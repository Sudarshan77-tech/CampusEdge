import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionQueryDto,
  QuestionReportDto,
  ResolveReportDto,
  CreateQuestionGroupDto,
  CurrentUser,
  Role,
  ContentScope,
  QuestionStatus,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates deterministic SHA-256 hash of normalized stem.
   */
  private computeStemHash(stem: string): string {
    const normalized = stem.trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Checks for duplicate or near-duplicate stems using exact hash and pg_trgm similarity.
   */
  async checkStemSimilarity(stem: string, excludeQuestionId?: string) {
    const textHash = this.computeStemHash(stem);

    // 1. Exact hash check
    const exactMatch = await this.prisma.question.findFirst({
      where: {
        textHash,
        id: excludeQuestionId ? { not: excludeQuestionId } : undefined,
      },
      include: {
        currentVersion: true,
      },
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        similarity: 1.0,
        matchingQuestionId: exactMatch.id,
        matchingStem: exactMatch.currentVersion?.stem || '',
      };
    }

    // 2. Trigram similarity check (> 0.85)
    try {
      const results = await this.prisma.$queryRaw<{ id: string; stem: string; sim: number }[]>`
        SELECT q.id, v.stem, similarity(v.stem, ${stem}) AS sim
        FROM question_versions v
        JOIN questions q ON q.id = v.question_id
        WHERE (${excludeQuestionId || null}::uuid IS NULL OR q.id != ${excludeQuestionId || null}::uuid)
          AND similarity(v.stem, ${stem}) > 0.85
        ORDER BY sim DESC
        LIMIT 1;
      `;

      if (results && results.length > 0 && results[0]) {
        return {
          isDuplicate: true,
          similarity: Math.round(Number(results[0].sim) * 100) / 100,
          matchingQuestionId: results[0].id,
          matchingStem: results[0].stem,
        };
      }
    } catch {
      // If pg_trgm similarity function throws, non-blocking fallback
    }

    return {
      isDuplicate: false,
      similarity: 0,
      matchingQuestionId: null,
      matchingStem: null,
    };
  }

  /**
   * Create question with initial immutable version 1 and options.
   */
  async create(dto: CreateQuestionDto, currentUser: CurrentUser) {
    let scope = dto.scope;
    let collegeId = dto.collegeId ?? null;

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (!currentUser.collegeId) {
        throw new ForbiddenException('College context required for College Admin');
      }
      scope = ContentScope.COLLEGE;
      collegeId = currentUser.collegeId;
    } else if (currentUser.role === Role.SUPER_ADMIN) {
      if (scope === ContentScope.GLOBAL) {
        collegeId = null;
      }
    } else {
      throw new ForbiddenException('Only Administrators may author questions');
    }

    // Duplicate stem detection
    const similarity = await this.checkStemSimilarity(dto.stem);
    if (similarity.similarity === 1.0) {
      throw new ConflictException(
        `Duplicate Question Refusal: An identical question already exists in the bank (ID: ${similarity.matchingQuestionId}).`,
      );
    }

    const textHash = this.computeStemHash(dto.stem);
    const initialStatus =
      currentUser.role === Role.SUPER_ADMIN && !similarity.isDuplicate
        ? QuestionStatus.APPROVED
        : QuestionStatus.IN_REVIEW;

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          scope,
          collegeId,
          topicId: dto.topicId,
          subtopicId: dto.subtopicId,
          type: dto.type,
          difficulty: dto.difficulty,
          groupId: dto.groupId,
          status: initialStatus,
          source: dto.source,
          licenseNote: dto.licenseNote,
          textHash,
          needsHumanReview: initialStatus !== QuestionStatus.APPROVED,
          reviewedBy: initialStatus === QuestionStatus.APPROVED ? currentUser.userId : null,
          reviewedAt: initialStatus === QuestionStatus.APPROVED ? new Date() : null,
          expectedTimeSeconds: dto.expectedTimeSeconds,
          tags: dto.tags,
        },
      });

      const version = await tx.questionVersion.create({
        data: {
          questionId: question.id,
          version: 1,
          stem: dto.stem,
          explanation: dto.explanation,
          numericAnswer: dto.numericAnswer,
          numericTolerance: dto.numericTolerance,
          createdBy: currentUser.userId,
        },
      });

      if (dto.options && dto.options.length > 0) {
        await tx.questionOption.createMany({
          data: dto.options.map((opt, idx) => ({
            versionId: version.id,
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect,
            sort: opt.sort ?? idx,
          })),
        });
      }

      await tx.question.update({
        where: { id: question.id },
        data: { currentVersionId: version.id },
      });

      await tx.questionStat.create({
        data: { questionId: question.id },
      });

      return tx.question.findUnique({
        where: { id: question.id },
        include: {
          currentVersion: {
            include: { options: { orderBy: { sort: 'asc' } } },
          },
          topic: true,
          stats: true,
        },
      });
    });
  }

  /**
   * Updates question by producing a new immutable version if content changes.
   */
  async update(id: string, dto: UpdateQuestionDto, currentUser: CurrentUser) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
      include: {
        currentVersion: {
          include: { options: true },
        },
      },
    });

    if (!existing) throw new NotFoundException('Question not found');

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (existing.scope !== ContentScope.COLLEGE || existing.collegeId !== currentUser.collegeId) {
        throw new ForbiddenException('Cannot edit questions outside your college scope');
      }
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    const contentChanged =
      dto.stem !== undefined ||
      dto.explanation !== undefined ||
      dto.numericAnswer !== undefined ||
      dto.numericTolerance !== undefined ||
      dto.options !== undefined;

    return this.prisma.$transaction(async (tx) => {
      let currentVersionId = existing.currentVersionId;
      let textHash = existing.textHash;

      if (contentChanged) {
        const latestVersionRecord = await tx.questionVersion.findFirst({
          where: { questionId: id },
          orderBy: { version: 'desc' },
        });

        const nextVersionNum = (latestVersionRecord?.version || 1) + 1;
        const newStem = dto.stem ?? existing.currentVersion?.stem ?? '';
        const newExplanation = dto.explanation ?? existing.currentVersion?.explanation ?? '';
        const newNumericAnswer =
          dto.numericAnswer !== undefined
            ? dto.numericAnswer
            : (existing.currentVersion?.numericAnswer ?? null);
        const newNumericTolerance =
          dto.numericTolerance !== undefined
            ? dto.numericTolerance
            : (existing.currentVersion?.numericTolerance ?? 0);

        textHash = this.computeStemHash(newStem);

        const newVersion = await tx.questionVersion.create({
          data: {
            questionId: id,
            version: nextVersionNum,
            stem: newStem,
            explanation: newExplanation,
            numericAnswer: newNumericAnswer,
            numericTolerance: newNumericTolerance,
            createdBy: currentUser.userId,
          },
        });

        currentVersionId = newVersion.id;

        const optionsToUse = dto.options ?? existing.currentVersion?.options ?? [];
        if (optionsToUse.length > 0) {
          await tx.questionOption.createMany({
            data: optionsToUse.map((opt, idx) => ({
              versionId: newVersion.id,
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
              sort: opt.sort ?? idx,
            })),
          });
        }
      }

      return tx.question.update({
        where: { id },
        data: {
          currentVersionId,
          textHash,
          topicId: dto.topicId,
          subtopicId: dto.subtopicId,
          difficulty: dto.difficulty,
          groupId: dto.groupId,
          expectedTimeSeconds: dto.expectedTimeSeconds,
          tags: dto.tags,
          needsHumanReview: true,
        },
        include: {
          currentVersion: {
            include: { options: { orderBy: { sort: 'asc' } } },
          },
          topic: true,
          stats: true,
        },
      });
    });
  }

  /**
   * Search / list question bank with authorization & filters.
   */
  async list(query: QuestionQueryDto, currentUser: CurrentUser) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};

    // Tenant scoping
    if (currentUser.role === Role.SUPER_ADMIN) {
      if (query.scope) where.scope = query.scope;
    } else if (currentUser.role === Role.COLLEGE_ADMIN) {
      where.OR = [
        { scope: ContentScope.GLOBAL, status: QuestionStatus.APPROVED },
        { scope: ContentScope.COLLEGE, collegeId: currentUser.collegeId || undefined },
      ];
    } else {
      throw new ForbiddenException('Direct question browsing is restricted to administrators');
    }

    if (query.topicId) where.topicId = query.topicId;
    if (query.subtopicId) where.subtopicId = query.subtopicId;
    if (query.type) where.type = query.type;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.status) where.status = query.status;
    if (query.tag) where.tags = { has: query.tag };
    if (query.search) {
      where.currentVersion = {
        stem: { contains: query.search, mode: 'insensitive' },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          currentVersion: {
            include: { options: { orderBy: { sort: 'asc' } } },
          },
          topic: true,
          stats: true,
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieve question details by ID.
   */
  async findById(id: string, currentUser: CurrentUser) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        currentVersion: {
          include: { options: { orderBy: { sort: 'asc' } } },
        },
        topic: true,
        subtopic: true,
        group: true,
        stats: true,
        reports: {
          include: {
            reporter: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (question.scope === ContentScope.COLLEGE && question.collegeId !== currentUser.collegeId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return question;
  }

  /**
   * Super Admin human review approval gate.
   */
  async approve(id: string, currentUser: CurrentUser) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (question.scope !== ContentScope.COLLEGE || question.collegeId !== currentUser.collegeId) {
        throw new ForbiddenException('College Admin can only approve questions for their college');
      }
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        status: QuestionStatus.APPROVED,
        needsHumanReview: false,
        reviewedBy: currentUser.userId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Retires a question from active test generation.
   */
  async retire(id: string, currentUser: CurrentUser) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (question.scope !== ContentScope.COLLEGE || question.collegeId !== currentUser.collegeId) {
        throw new ForbiddenException('College Admin can only retire questions for their college');
      }
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    return this.prisma.question.update({
      where: { id },
      data: { status: QuestionStatus.RETIRED },
    });
  }

  /**
   * Student submits a question report. Trigger auto-flags if >= 3 reports.
   */
  async report(id: string, dto: QuestionReportDto, currentUser: CurrentUser) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    const report = await this.prisma.questionReport.upsert({
      where: {
        questionId_reporterId: {
          questionId: id,
          reporterId: currentUser.userId,
        },
      },
      update: {
        reason: dto.reason,
        note: dto.note || '',
      },
      create: {
        questionId: id,
        reporterId: currentUser.userId,
        reason: dto.reason,
        note: dto.note || '',
      },
    });

    return {
      success: true,
      reportId: report.id,
      message: 'Question report registered for quality review.',
    };
  }

  /**
   * Review queue: retrieves flagged and pending questions for moderation.
   */
  async getReviewQueue(page = 1, limit = 20, currentUser: CurrentUser) {
    const skip = (page - 1) * limit;
    const where: Prisma.QuestionWhereInput = {
      OR: [
        { status: QuestionStatus.IN_REVIEW },
        { status: QuestionStatus.FLAGGED },
        { needsHumanReview: true },
      ],
    };

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      where.collegeId = currentUser.collegeId;
      where.scope = ContentScope.COLLEGE;
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ stats: { reportCount: 'desc' } }, { createdAt: 'asc' }],
        include: {
          currentVersion: {
            include: { options: { orderBy: { sort: 'asc' } } },
          },
          topic: true,
          stats: true,
          reports: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Resolve reported question.
   */
  async resolveReport(id: string, dto: ResolveReportDto, currentUser: CurrentUser) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (question.scope !== ContentScope.COLLEGE || question.collegeId !== currentUser.collegeId) {
        throw new ForbiddenException('Unauthorized');
      }
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Unauthorized');
    }

    const newStatus = dto.action === 'APPROVE' ? QuestionStatus.APPROVED : QuestionStatus.RETIRED;

    return this.prisma.question.update({
      where: { id },
      data: {
        status: newStatus,
        needsHumanReview: false,
        reviewedBy: currentUser.userId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Passage group management (Reading comprehension & Data interpretation).
   */
  async createGroup(dto: CreateQuestionGroupDto, currentUser: CurrentUser) {
    let scope = dto.scope;
    let collegeId = dto.collegeId ?? null;

    if (currentUser.role === Role.COLLEGE_ADMIN) {
      if (!currentUser.collegeId) throw new ForbiddenException('College context required');
      scope = ContentScope.COLLEGE;
      collegeId = currentUser.collegeId;
    }

    return this.prisma.questionGroup.create({
      data: {
        title: dto.title,
        body: dto.body,
        imagePath: dto.imagePath,
        scope,
        collegeId,
      },
    });
  }

  async listGroups(currentUser: CurrentUser) {
    const where: Prisma.QuestionGroupWhereInput = {};
    if (currentUser.role === Role.COLLEGE_ADMIN) {
      where.OR = [
        { scope: ContentScope.GLOBAL },
        { scope: ContentScope.COLLEGE, collegeId: currentUser.collegeId || undefined },
      ];
    }
    return this.prisma.questionGroup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Student bookmarking for mistake notebook / review.
   */
  async bookmark(questionId: string, currentUser: CurrentUser) {
    if (!currentUser.collegeId) throw new BadRequestException('College required');

    return this.prisma.questionBookmark.upsert({
      where: {
        studentId_questionId: {
          studentId: currentUser.userId,
          questionId,
        },
      },
      update: {},
      create: {
        studentId: currentUser.userId,
        collegeId: currentUser.collegeId,
        questionId,
      },
    });
  }

  async removeBookmark(questionId: string, currentUser: CurrentUser) {
    return this.prisma.questionBookmark.deleteMany({
      where: {
        studentId: currentUser.userId,
        questionId,
      },
    });
  }

  async listBookmarks(currentUser: CurrentUser) {
    return this.prisma.questionBookmark.findMany({
      where: { studentId: currentUser.userId },
      include: {
        question: {
          include: {
            currentVersion: {
              include: { options: true },
            },
            topic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
