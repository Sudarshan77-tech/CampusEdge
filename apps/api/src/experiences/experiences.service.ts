import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  Role,
  CreateExperienceDto,
  UpdateExperienceDto,
  ModerateExperienceDto,
  ReportExperienceDto,
  ExperienceQueryDto,
  ExperienceStatus,
} from '@campusedge/shared';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Student drafts an interview experience.
   */
  async create(user: CurrentUser, dto: CreateExperienceDto) {
    if (!user.collegeId) {
      throw new ForbiddenException('College context required');
    }

    // 1. Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    // 2. If driveId provided, verify it belongs to this college and company
    if (dto.driveId) {
      const drive = await this.prisma.drive.findFirst({
        where: { id: dto.driveId, collegeId: user.collegeId, companyId: dto.companyId },
      });
      if (!drive) {
        throw new NotFoundException('Drive not found for this company and college');
      }
    }

    // 3. Create experience with rounds and topics
    return this.prisma.$transaction(async (tx) => {
      const experience = await tx.experience.create({
        data: {
          collegeId: user.collegeId!,
          companyId: dto.companyId,
          driveId: dto.driveId || null,
          authorId: user.userId,
          roleTitle: dto.roleTitle.trim(),
          seasonLabel: dto.seasonLabel.trim(),
          difficulty: dto.difficulty,
          outcome: dto.outcome,
          overallSummary: dto.overallSummary.trim(),
          tips: dto.tips ? dto.tips.trim() : null,
          isAnonymous: dto.isAnonymous ?? true,
          status: ExperienceStatus.DRAFT,
        },
      });

      if (dto.rounds && dto.rounds.length > 0) {
        for (const roundDto of dto.rounds) {
          const round = await tx.experienceRound.create({
            data: {
              experienceId: experience.id,
              collegeId: user.collegeId!,
              sequence: roundDto.sequence,
              roundType: roundDto.roundType,
              description: roundDto.description.trim(),
              difficulty: roundDto.difficulty ?? null,
            },
          });

          if (roundDto.topicIds && roundDto.topicIds.length > 0) {
            await tx.experienceRoundTopic.createMany({
              data: roundDto.topicIds.map((topicId) => ({
                roundId: round.id,
                topicId,
                collegeId: user.collegeId!,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return tx.experience.findUnique({
        where: { id: experience.id },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          rounds: {
            include: { topics: { include: { topic: true } } },
            orderBy: { sequence: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Student updates an existing experience (only if DRAFT or CHANGES_REQUESTED).
   */
  async update(id: string, user: CurrentUser, dto: UpdateExperienceDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const experience = await this.prisma.experience.findFirst({
      where: { id, collegeId: user.collegeId },
    });
    if (!experience) throw new NotFoundException('Experience not found');

    if (experience.authorId !== user.userId) {
      throw new ForbiddenException('You can only edit your own experience');
    }

    if (
      experience.status !== ExperienceStatus.DRAFT &&
      experience.status !== ExperienceStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        'Only drafts or experiences with requested changes can be edited',
      );
    }

    if (dto.rowVersion !== undefined && experience.rowVersion !== dto.rowVersion) {
      throw new BadRequestException('Experience was modified concurrently. Please refresh.');
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {
        rowVersion: { increment: 1 },
      };

      if (dto.roleTitle !== undefined) data.roleTitle = dto.roleTitle.trim();
      if (dto.seasonLabel !== undefined) data.seasonLabel = dto.seasonLabel.trim();
      if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
      if (dto.outcome !== undefined) data.outcome = dto.outcome;
      if (dto.overallSummary !== undefined) data.overallSummary = dto.overallSummary.trim();
      if (dto.tips !== undefined) data.tips = dto.tips ? dto.tips.trim() : null;
      if (dto.isAnonymous !== undefined) data.isAnonymous = dto.isAnonymous;
      if (dto.companyId !== undefined) data.companyId = dto.companyId;
      if (dto.driveId !== undefined) data.driveId = dto.driveId || null;

      await tx.experience.update({
        where: { id_collegeId: { id, collegeId: user.collegeId! } },
        data,
      });

      if (dto.rounds) {
        // Replace rounds
        await tx.experienceRound.deleteMany({
          where: { experienceId: id, collegeId: user.collegeId! },
        });

        for (const roundDto of dto.rounds) {
          const round = await tx.experienceRound.create({
            data: {
              experienceId: id,
              collegeId: user.collegeId!,
              sequence: roundDto.sequence,
              roundType: roundDto.roundType,
              description: roundDto.description.trim(),
              difficulty: roundDto.difficulty ?? null,
            },
          });

          if (roundDto.topicIds && roundDto.topicIds.length > 0) {
            await tx.experienceRoundTopic.createMany({
              data: roundDto.topicIds.map((topicId) => ({
                roundId: round.id,
                topicId,
                collegeId: user.collegeId!,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return tx.experience.findUnique({
        where: { id },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          rounds: {
            include: { topics: { include: { topic: true } } },
            orderBy: { sequence: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Submit an experience for TPO review.
   */
  async submit(id: string, user: CurrentUser) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const experience = await this.prisma.experience.findFirst({
      where: { id, collegeId: user.collegeId },
    });
    if (!experience) throw new NotFoundException('Experience not found');

    if (experience.authorId !== user.userId) {
      throw new ForbiddenException('You can only submit your own experience');
    }

    if (
      experience.status !== ExperienceStatus.DRAFT &&
      experience.status !== ExperienceStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException('Only drafts can be submitted for review');
    }

    return this.prisma.experience.update({
      where: { id_collegeId: { id, collegeId: user.collegeId } },
      data: {
        status: ExperienceStatus.SUBMITTED,
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * List experiences (Public/Student feed with anonymity projection).
   */
  async list(user: CurrentUser, query: ExperienceQueryDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      collegeId: user.collegeId,
      status: ExperienceStatus.APPROVED,
    };

    if (query.companyId) where.companyId = query.companyId;
    if (query.outcome) where.outcome = query.outcome;

    if (query.search) {
      where.OR = [
        { roleTitle: { contains: query.search, mode: 'insensitive' } },
        { company: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.experience.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
          author: {
            select: {
              userId: true,
              userProfile: { select: { fullName: true } },
              branch: { select: { name: true } },
              batchYear: true,
            },
          },
          rounds: {
            include: { topics: { include: { topic: true } } },
            orderBy: { sequence: 'asc' },
          },
        },
      }),
      this.prisma.experience.count({ where }),
    ]);

    // Anonymity projection: mask student info if isAnonymous is true
    const sanitizedItems = items.map((exp) => this.projectAnonymity(exp, user.userId));

    return {
      items: sanitizedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List student's own experiences.
   */
  async findMine(user: CurrentUser) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    return this.prisma.experience.findMany({
      where: { authorId: user.userId, collegeId: user.collegeId },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        rounds: {
          include: { topics: { include: { topic: true } } },
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  /**
   * Find single experience with anonymity projection.
   */
  async findById(id: string, user: CurrentUser) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const exp = await this.prisma.experience.findFirst({
      where: { id, collegeId: user.collegeId },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, industry: true } },
        author: {
          select: {
            userId: true,
            userProfile: { select: { fullName: true } },
            branch: { select: { name: true } },
            batchYear: true,
          },
        },
        rounds: {
          include: { topics: { include: { topic: true } } },
          orderBy: { sequence: 'asc' },
        },
        reports:
          user.role === Role.COLLEGE_ADMIN || user.role === Role.SUPER_ADMIN
            ? { select: { id: true, reason: true, createdAt: true } }
            : false,
      },
    });

    if (!exp) throw new NotFoundException('Experience not found');

    if (
      user.role === Role.STUDENT &&
      exp.status !== ExperienceStatus.APPROVED &&
      exp.authorId !== user.userId
    ) {
      throw new ForbiddenException('Experience is not published');
    }

    return this.projectAnonymity(exp, user.userId);
  }

  /**
   * TPO Moderation Queue: list submitted, under-review, or changes-requested experiences.
   */
  async listModerationQueue(user: CurrentUser, query: ExperienceQueryDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      collegeId: user.collegeId,
      status: query.status || {
        in: [
          ExperienceStatus.SUBMITTED,
          ExperienceStatus.UNDER_REVIEW,
          ExperienceStatus.CHANGES_REQUESTED,
        ],
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.experience.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          author: {
            select: {
              userId: true,
              userProfile: { select: { fullName: true, email: true } },
              branch: { select: { name: true } },
              batchYear: true,
            },
          },
          _count: { select: { reports: true } },
        },
      }),
      this.prisma.experience.count({ where }),
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
   * TPO Moderation Action.
   */
  async moderate(id: string, collegeId: string, reviewerId: string, dto: ModerateExperienceDto) {
    const exp = await this.prisma.experience.findFirst({
      where: { id, collegeId },
    });
    if (!exp) throw new NotFoundException('Experience not found');

    let nextStatus: ExperienceStatus;
    switch (dto.decision) {
      case 'APPROVE':
        nextStatus = ExperienceStatus.APPROVED;
        break;
      case 'REJECT':
        nextStatus = ExperienceStatus.REJECTED;
        break;
      case 'REQUEST_CHANGES':
        nextStatus = ExperienceStatus.CHANGES_REQUESTED;
        break;
      case 'REMOVE':
        nextStatus = ExperienceStatus.REJECTED;
        break;
      default:
        throw new BadRequestException('Invalid moderation decision');
    }

    return this.prisma.experience.update({
      where: { id_collegeId: { id, collegeId } },
      data: {
        status: nextStatus,
        reviewerId,
        reviewNote: dto.reviewNote ?? null,
        reviewedAt: new Date(),
        rowVersion: { increment: 1 },
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Student reports an experience. Auto-flags to UNDER_REVIEW at >= 3 reports.
   */
  async report(id: string, user: CurrentUser, dto: ReportExperienceDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const exp = await this.prisma.experience.findFirst({
      where: { id, collegeId: user.collegeId },
    });
    if (!exp) throw new NotFoundException('Experience not found');

    // Create report record (unique on experienceId, reporterId)
    try {
      await this.prisma.experienceReport.create({
        data: {
          experienceId: id,
          reporterId: user.userId,
          collegeId: user.collegeId,
          reason: dto.reason.trim(),
        },
      });
    } catch {
      throw new ConflictException('You have already reported this interview experience');
    }

    // Check total distinct reports count
    const count = await this.prisma.experienceReport.count({
      where: { experienceId: id, collegeId: user.collegeId },
    });

    if (count >= 3 && exp.status === ExperienceStatus.APPROVED) {
      await this.prisma.experience.update({
        where: { id_collegeId: { id, collegeId: user.collegeId } },
        data: {
          status: ExperienceStatus.UNDER_REVIEW,
          rowVersion: { increment: 1 },
        },
      });
      return { success: true, status: ExperienceStatus.UNDER_REVIEW, reportCount: count };
    }

    return { success: true, status: exp.status, reportCount: count };
  }

  /**
   * Super Admin takedown across colleges.
   */
  async takedown(id: string, reviewerId: string, note: string) {
    const exp = await this.prisma.experience.findUnique({
      where: { id },
    });
    if (!exp) throw new NotFoundException('Experience not found');

    return this.prisma.experience.update({
      where: { id },
      data: {
        status: ExperienceStatus.REJECTED,
        reviewerId,
        reviewNote: `[SUPER_ADMIN_TAKEDOWN] ${note}`,
        reviewedAt: new Date(),
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * Helper to strip author identity if anonymous and requester is not the author.
   */
  private projectAnonymity<
    T extends {
      authorId: string;
      isAnonymous: boolean;
      author?: {
        userId?: string;
        userProfile?: { fullName?: string | null; email?: string | null } | null;
        branch?: { name?: string | null } | null;
        batchYear?: number | null;
      } | null;
    },
  >(exp: T, viewerId: string) {
    if (exp.isAnonymous && exp.authorId !== viewerId) {
      return {
        ...exp,
        author: {
          userId: undefined,
          userProfile: { fullName: 'Anonymous Senior', email: undefined },
          branch: exp.author?.branch,
          batchYear: exp.author?.batchYear,
        },
      };
    }
    return exp;
  }
}
