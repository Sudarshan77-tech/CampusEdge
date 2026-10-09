import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  Role,
  AttemptStatus,
  AttemptEventType,
  TestTemplateKind,
  TestTemplateStatus,
  ResultsReleasePolicy,
  QuestionType,
  TopicCategory,
  TechnicalTrack,
  ReadinessBand,
  ReadinessTrigger,
  scoreItem,
  scoreAttempt,
  computeMastery,
  computeReadiness,
  assertNoAnswerLeakage,
  FORMULA_VERSION,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';
import {
  createPrng,
  selectQuestionsForRule,
  generateOptionOrder,
  CandidateQuestion,
} from '../tests/question-selector';
import { RoadmapService } from '../analytics/roadmap.service';

export interface StartAttemptDto {
  templateId: string;
  scheduleId?: string;
}

export interface SaveAnswerDto {
  selectedOptionIds?: string[];
  numericResponse?: number;
  timeSpentMs?: number;
  markedForReview?: boolean;
}

export interface RecordEventDto {
  type: AttemptEventType;
  occurredAt?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roadmapService: RoadmapService,
  ) {}

  /**
   * Start a new test attempt for a student.
   * Enforces:
   * 1. Single IN_PROGRESS attempt limit per student
   * 2. Schedule eligibility and live window if scheduleId provided
   * 3. Deterministic question selection with 30-day anti-repeat pool avoidance
   * 4. Option order randomization
   * 5. Strict deadline calculation
   */
  async startAttempt(dto: StartAttemptDto, user: CurrentUser) {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can start test attempts');
    }
    const collegeId = user.collegeId;
    if (!collegeId) {
      throw new BadRequestException('Student must be assigned to a college');
    }

    // 1. Enforce single IN_PROGRESS attempt limit (application check before DB index)
    const existingActive = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (existingActive) {
      // Check if active attempt is actually expired; if so, finalize it
      const now = new Date();
      if (now > new Date(existingActive.deadlineAt.getTime() + 5000)) {
        await this.finalizeAttempt(existingActive.id, AttemptStatus.AUTO_SUBMITTED);
      } else {
        throw new ConflictException(
          'You already have an active test attempt in progress. Please submit or abandon it first.',
        );
      }
    }

    // 2. Validate template
    const template = await this.prisma.testTemplate.findUnique({
      where: { id: dto.templateId },
      include: {
        sections: {
          orderBy: { sequence: 'asc' },
          include: {
            rules: true,
            fixedQuestions: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (!template || template.status !== TestTemplateStatus.PUBLISHED) {
      throw new NotFoundException('Active test template not found');
    }

    if (template.collegeId && template.collegeId !== collegeId) {
      throw new ForbiddenException('Access denied to this college test template');
    }

    // 3. Validate schedule if provided
    let scheduleDeadline: Date | null = null;
    if (dto.scheduleId) {
      const schedule = await this.prisma.testSchedule.findUnique({
        where: { id: dto.scheduleId },
      });

      if (!schedule || schedule.collegeId !== collegeId) {
        throw new NotFoundException('Test schedule not found');
      }

      const now = new Date();
      if (now < schedule.startsAt || now > schedule.endsAt) {
        throw new BadRequestException('Test schedule is not currently active');
      }

      scheduleDeadline = schedule.endsAt;
    }

    // 4. Calculate deadline
    const startedAt = new Date();
    let calculatedDeadline = new Date(startedAt.getTime() + template.durationMinutes * 60 * 1000);
    if (scheduleDeadline && scheduleDeadline < calculatedDeadline) {
      calculatedDeadline = scheduleDeadline;
    }

    // 5. Generate seed
    const seed = Math.floor(Math.random() * 2147483647);
    const prng = createPrng(seed);

    // 6. Query student's 30-day attempted question IDs for anti-repeat avoidance
    const thirtyDaysAgo = new Date(startedAt.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentAttempts =
      (await this.prisma.attempt.findMany({
        where: {
          studentId: user.userId,
          startedAt: { gte: thirtyDaysAgo },
        },
        select: {
          items: {
            select: { questionId: true },
          },
        },
      })) || [];

    const recentQuestionIds = new Set<string>();
    for (const att of recentAttempts) {
      for (const it of att.items) {
        recentQuestionIds.add(it.questionId);
      }
    }

    // 7. Select questions for each section
    interface PreparedItem {
      sectionSeq: number;
      position: number;
      questionId: string;
      versionId: string;
      optionCount: number;
    }

    const preparedItems: PreparedItem[] = [];
    let globalPosition = 1;

    for (const section of template.sections) {
      if (section.fixedQuestions.length > 0) {
        // Fixed questions configured
        for (const fq of section.fixedQuestions) {
          const q = await this.prisma.question.findUnique({
            where: { id: fq.questionId },
            include: { currentVersion: { include: { options: true } } },
          });
          if (q && q.currentVersion) {
            preparedItems.push({
              sectionSeq: section.sequence,
              position: globalPosition++,
              questionId: q.id,
              versionId: q.currentVersion.id,
              optionCount: q.currentVersion.options.length,
            });
          }
        }
      } else if (section.rules.length > 0) {
        // Dynamic rule-based selection
        for (const rule of section.rules) {
          // Pre-fetch candidate pool for rule topic
          const candidates = await this.prisma.question.findMany({
            where: {
              status: 'APPROVED',
              topicId: rule.topicId,
              subtopicId: rule.subtopicId || undefined,
              difficulty: { gte: rule.difficultyMin, lte: rule.difficultyMax },
              OR: [{ scope: 'GLOBAL' }, { scope: 'COLLEGE', collegeId }],
            },
            select: {
              id: true,
              topicId: true,
              subtopicId: true,
              difficulty: true,
              expectedTimeSeconds: true,
              currentVersionId: true,
            },
          });

          const candidatePool: CandidateQuestion[] = candidates.map((c) => ({
            id: c.id,
            topicId: c.topicId,
            subtopicId: c.subtopicId,
            difficulty: c.difficulty,
            expectedTimeSeconds: c.expectedTimeSeconds,
          }));

          const selected = selectQuestionsForRule(
            {
              topicId: rule.topicId,
              subtopicId: rule.subtopicId,
              count: rule.count,
              difficultyMin: rule.difficultyMin,
              difficultyMax: rule.difficultyMax,
            },
            candidatePool,
            recentQuestionIds,
            prng,
          );

          for (const sq of selected) {
            const fullQ = await this.prisma.question.findUnique({
              where: { id: sq.id },
              include: { currentVersion: { include: { options: true } } },
            });
            if (fullQ && fullQ.currentVersion) {
              preparedItems.push({
                sectionSeq: section.sequence,
                position: globalPosition++,
                questionId: fullQ.id,
                versionId: fullQ.currentVersion.id,
                optionCount: fullQ.currentVersion.options.length,
              });
            }
          }
        }
      }
    }

    if (preparedItems.length === 0) {
      throw new BadRequestException('Unable to start attempt: no questions match template rules');
    }

    // 8. Create Attempt and AttemptItems atomically
    const totalMarks = template.sections.reduce(
      (sum, s) => sum + s.marksPerQuestion * s.questionCount,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.create({
        data: {
          studentId: user.userId,
          collegeId,
          templateId: template.id,
          scheduleId: dto.scheduleId || null,
          kind: template.kind,
          status: AttemptStatus.IN_PROGRESS,
          startedAt,
          deadlineAt: calculatedDeadline,
          seed,
          totalMarks,
          formulaVersion: FORMULA_VERSION,
        },
      });

      // Create items with option permutations
      await tx.attemptItem.createMany({
        data: preparedItems.map((item) => ({
          attemptId: attempt.id,
          collegeId,
          sectionSeq: item.sectionSeq,
          position: item.position,
          questionId: item.questionId,
          versionId: item.versionId,
          optionOrder:
            item.optionCount > 0 ? generateOptionOrder(item.optionCount, seed, item.position) : [],
        })),
      });

      return {
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        deadlineAt: attempt.deadlineAt,
        durationMinutes: template.durationMinutes,
        totalQuestions: preparedItems.length,
        sections: template.sections.map((s) => ({
          sequence: s.sequence,
          title: s.title,
          questionCount: s.questionCount,
          marksPerQuestion: s.marksPerQuestion,
          sectionTimeLimitMinutes: s.sectionTimeLimitMinutes,
        })),
      };
    });
  }

  /**
   * Get attempt metadata and navigation palette overview.
   * ZERO ANSWER KEY LEAKAGE GUARANTEED.
   */
  async getAttempt(attemptId: string, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        template: {
          include: {
            sections: { orderBy: { sequence: 'asc' } },
          },
        },
        items: {
          orderBy: { position: 'asc' },
          select: {
            position: true,
            sectionSeq: true,
            visited: true,
            markedForReview: true,
            selectedOptionIds: true,
            numericResponse: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (user.role === Role.STUDENT && attempt.studentId !== user.userId) {
      throw new ForbiddenException('Access denied to this attempt');
    }

    const now = new Date();
    const remainingMs = Math.max(0, attempt.deadlineAt.getTime() - now.getTime());

    const result = {
      attemptId: attempt.id,
      status: attempt.status,
      templateId: attempt.templateId,
      templateTitle: attempt.template.title,
      durationMinutes: attempt.template.durationMinutes,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      remainingMs,
      integrityFlagCount: attempt.integrityFlagCount,
      sections: attempt.template.sections.map((s) => ({
        sequence: s.sequence,
        title: s.title,
        questionCount: s.questionCount,
        marksPerQuestion: s.marksPerQuestion,
        sectionTimeLimitMinutes: s.sectionTimeLimitMinutes,
      })),
      items: attempt.items.map((item) => ({
        position: item.position,
        sectionSeq: item.sectionSeq,
        visited: item.visited,
        markedForReview: item.markedForReview,
        isAnswered:
          (item.selectedOptionIds && item.selectedOptionIds.length > 0) ||
          item.numericResponse !== null,
      })),
    };

    assertNoAnswerLeakage(result);
    return result;
  }

  /**
   * Get the active IN_PROGRESS attempt for a student, if one exists.
   */
  async getActiveAttempt(user: CurrentUser) {
    if (user.role !== Role.STUDENT) {
      return null;
    }
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        status: AttemptStatus.IN_PROGRESS,
      },
      select: {
        id: true,
        deadlineAt: true,
      },
    });

    if (!attempt) return null;

    const now = new Date();
    if (now > new Date(attempt.deadlineAt.getTime() + 5000)) {
      await this.finalizeAttempt(attempt.id, AttemptStatus.AUTO_SUBMITTED);
      return null;
    }

    return this.getAttempt(attempt.id, user);
  }

  /**
   * Get sanitized question details for a position in the active attempt.
   * ZERO ANSWER KEY LEAKAGE GUARANTEED.
   */
  async getQuestionAtPosition(attemptId: string, position: number, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        template: {
          include: {
            sections: { orderBy: { sequence: 'asc' } },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== user.userId) {
      throw new ForbiddenException('Access denied to this attempt');
    }

    // Check if expired
    const now = new Date();
    if (now > new Date(attempt.deadlineAt.getTime() + 5000)) {
      await this.finalizeAttempt(attempt.id, AttemptStatus.AUTO_SUBMITTED);
      throw new ForbiddenException('Test deadline exceeded. Attempt has been auto-submitted.');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Attempt is in ${attempt.status} state. Questions can only be fetched while IN_PROGRESS.`,
      );
    }

    const item = await this.prisma.attemptItem.findUnique({
      where: { attemptId_position: { attemptId, position } },
      include: {
        question: { select: { type: true, difficulty: true } },
        version: {
          include: {
            options: {
              select: { id: true, key: true, text: true, sort: true }, // NO is_correct!
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Question at position ${position} not found`);
    }

    // Mark as visited
    if (!item.visited) {
      await this.prisma.attemptItem.update({
        where: { id: item.id },
        data: { visited: true },
      });
    }

    // Reorder options according to permutation
    const rawOptions = item.version.options;
    let orderedOptions = rawOptions;
    if (item.optionOrder && item.optionOrder.length === rawOptions.length) {
      orderedOptions = item.optionOrder.map((idx) => rawOptions[idx]!).filter(Boolean);
    }

    const sanitizedQuestion = {
      position: item.position,
      sectionSeq: item.sectionSeq,
      type: item.question.type,
      difficulty: item.question.difficulty,
      stem: item.version.stem,
      imagePath: item.version.imagePath,
      options: orderedOptions.map((o) => ({
        id: o.id,
        key: o.key,
        text: o.text,
      })),
      visited: true,
      markedForReview: item.markedForReview,
      selectedOptionIds: item.selectedOptionIds,
      numericResponse: item.numericResponse,
      timeSpentMs: item.timeSpentMs,
    };

    // Rigorous runtime assertion: assert no leakage
    assertNoAnswerLeakage(sanitizedQuestion);

    return sanitizedQuestion;
  }

  /**
   * Save a student's answer at position with server clock deadline enforcement.
   */
  async saveAnswer(attemptId: string, position: number, dto: SaveAnswerDto, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== user.userId) throw new ForbiddenException('Access denied');

    // Enforce server clock (+ 5 second grace)
    const now = new Date();
    if (now > new Date(attempt.deadlineAt.getTime() + 5000)) {
      await this.finalizeAttempt(attempt.id, AttemptStatus.AUTO_SUBMITTED);
      throw new ForbiddenException('Test deadline exceeded. Attempt has been auto-submitted.');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot save answer: attempt is ${attempt.status}`);
    }

    const item = await this.prisma.attemptItem.findUnique({
      where: { attemptId_position: { attemptId, position } },
    });

    if (!item) throw new NotFoundException(`Item at position ${position} not found`);

    const updated = await this.prisma.attemptItem.update({
      where: { id: item.id },
      data: {
        selectedOptionIds: dto.selectedOptionIds ?? item.selectedOptionIds,
        numericResponse:
          dto.numericResponse !== undefined ? dto.numericResponse : item.numericResponse,
        timeSpentMs: dto.timeSpentMs !== undefined ? dto.timeSpentMs : item.timeSpentMs,
        markedForReview:
          dto.markedForReview !== undefined ? dto.markedForReview : item.markedForReview,
        answeredAt: new Date(),
      },
    });

    return {
      success: true,
      position: updated.position,
      savedAt: updated.answeredAt,
    };
  }

  /**
   * Record proctoring / integrity event.
   */
  async recordEvent(attemptId: string, dto: RecordEventDto, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== user.userId) throw new ForbiddenException('Access denied');

    const shouldIncrementFlag =
      dto.type === AttemptEventType.BLUR ||
      dto.type === AttemptEventType.FULLSCREEN_EXIT ||
      dto.type === AttemptEventType.PASTE;

    await this.prisma.$transaction(async (tx) => {
      await tx.attemptEvent.create({
        data: {
          attemptId: attempt.id,
          collegeId: attempt.collegeId,
          type: dto.type,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          meta: (dto.meta as Prisma.InputJsonValue) || {},
        },
      });

      if (shouldIncrementFlag) {
        await tx.attempt.update({
          where: { id: attempt.id },
          data: { integrityFlagCount: { increment: 1 } },
        });
      }
    });

    return { recorded: true };
  }

  /**
   * Submit attempt explicitly.
   */
  async submitAttempt(attemptId: string, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== user.userId) throw new ForbiddenException('Access denied');

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(`Attempt already finalized in status: ${attempt.status}`);
    }

    return this.finalizeAttempt(attempt.id, AttemptStatus.SUBMITTED);
  }

  /**
   * Abandon an attempt.
   */
  async abandonAttempt(attemptId: string, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== user.userId) throw new ForbiddenException('Access denied');

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot abandon attempt in status: ${attempt.status}`);
    }

    await this.prisma.attempt.update({
      where: { id: attempt.id },
      data: { status: AttemptStatus.ABANDONED },
    });

    return { success: true, status: AttemptStatus.ABANDONED };
  }

  /**
   * Finalize and grade an attempt.
   * Uses pure scoreAttempt() and computeMastery() functions!
   */
  async finalizeAttempt(
    attemptId: string,
    targetStatus: AttemptStatus.SUBMITTED | AttemptStatus.AUTO_SUBMITTED,
  ) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        template: {
          include: {
            sections: { orderBy: { sequence: 'asc' } },
          },
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            question: { select: { id: true, type: true, topicId: true, difficulty: true } },
            version: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    const sections = attempt.template.sections;
    const items = attempt.items;

    // 1. Score each item individually using scoreItem()
    const itemResultsMap = new Map<
      string,
      { isCorrect: boolean; marksAwarded: number; isSkipped: boolean }
    >();

    for (const it of items) {
      const sec = sections.find((s) => s.sequence === it.sectionSeq);
      const marksPerQuestion = sec ? sec.marksPerQuestion : 1;
      const negativeMarks = sec ? sec.negativeMarks : 0;

      const scored = scoreItem({
        type: it.question.type as QuestionType,
        selectedOptionIds: it.selectedOptionIds,
        numericResponse: it.numericResponse,
        correctOptionIds: it.version.options.filter((o) => o.isCorrect).map((o) => o.id),
        numericAnswer: it.version.numericAnswer,
        numericTolerance: it.version.numericTolerance,
        marksPerQuestion,
        negativeMarks,
      });

      itemResultsMap.set(it.id, scored);
    }

    // 2. Score entire attempt using pure scoreAttempt()
    const sectionDefs = sections.map((sec) => ({
      sequence: sec.sequence,
      title: sec.title,
      marksPerQuestion: sec.marksPerQuestion,
      negativeMarks: sec.negativeMarks,
      questionCount: sec.questionCount,
    }));

    const attemptItemsForScoring = items.map((it) => ({
      sectionSeq: it.sectionSeq,
      position: it.position,
      isCorrect: itemResultsMap.get(it.id)?.isCorrect,
      marksAwarded: itemResultsMap.get(it.id)?.marksAwarded,
      isSkipped: itemResultsMap.get(it.id)?.isSkipped,
    }));

    const scoreResult = scoreAttempt(attemptItemsForScoring, sectionDefs);

    // Save item results, attempt score, topic stats, and readiness snapshot
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update items with isCorrect and marksAwarded
      for (const it of items) {
        const scored = itemResultsMap.get(it.id);
        if (scored) {
          await tx.attemptItem.update({
            where: { id: it.id },
            data: {
              isCorrect: scored.isCorrect,
              marksAwarded: scored.marksAwarded,
            },
          });
        }
      }

      // 2. Update Attempt
      const updatedAttempt = await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          status: targetStatus,
          submittedAt: new Date(),
          score: scoreResult.score,
          percent: scoreResult.percent,
          totalMarks: scoreResult.totalMarks,
          sectionScores: scoreResult.sectionScores as unknown as Prisma.InputJsonValue,
        },
      });

      // 3. Update student_topic_stats for affected topics using pure computeMastery()
      const affectedTopicIds = Array.from(new Set(items.map((it) => it.question.topicId)));

      for (const topicId of affectedTopicIds) {
        // Query recent answered items for student in this topic
        const topicHistory = await tx.attemptItem.findMany({
          where: {
            attempt: {
              studentId: attempt.studentId,
              status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
            },
            question: { topicId },
            isCorrect: { not: null },
          },
          include: {
            question: { select: { difficulty: true } },
          },
          orderBy: { answeredAt: 'desc' },
          take: 100,
        });

        const scoredForMastery = topicHistory.map((th) => ({
          difficulty: th.question.difficulty,
          isCorrect: th.isCorrect ?? false,
          answeredAt: th.answeredAt || new Date(),
        }));

        const masteryRes = computeMastery(scoredForMastery);

        await tx.studentTopicStat.upsert({
          where: {
            studentId_topicId: {
              studentId: attempt.studentId,
              topicId,
            },
          },
          update: {
            scoredCount: masteryRes.scoredCount,
            correctCount: topicHistory.filter((th) => th.isCorrect).length,
            mastery: masteryRes.mastery,
            level: masteryRes.level,
            lastPracticedAt: new Date(),
            formulaVersion: FORMULA_VERSION,
          },
          create: {
            studentId: attempt.studentId,
            collegeId: attempt.collegeId,
            topicId,
            scoredCount: masteryRes.scoredCount,
            correctCount: topicHistory.filter((th) => th.isCorrect).length,
            mastery: masteryRes.mastery,
            level: masteryRes.level,
            lastPracticedAt: new Date(),
            formulaVersion: FORMULA_VERSION,
          },
        });
      }

      // 4. Compute updated readiness score using pure computeReadiness()
      const allTopicStats =
        (await tx.studentTopicStat.findMany({
          where: { studentId: attempt.studentId },
          include: { topic: { select: { id: true, name: true, category: true } } },
        })) || [];

      const aptitudeCategories: string[] = [
        TopicCategory.APTITUDE,
        TopicCategory.VERBAL,
        TopicCategory.LOGICAL,
      ];

      const aptitudeTopics = allTopicStats
        .filter((st) => aptitudeCategories.includes(st.topic.category as string))
        .map((st) => ({
          topicId: st.topic.id,
          name: st.topic.name,
          mastery: st.mastery,
          scoredCount: st.scoredCount,
        }));

      const technicalTopics = allTopicStats
        .filter((st) => !aptitudeCategories.includes(st.topic.category as string))
        .map((st) => ({
          topicId: st.topic.id,
          name: st.topic.name,
          mastery: st.mastery,
          scoredCount: st.scoredCount,
        }));

      const isCurrentDiagnostic = attempt.kind === TestTemplateKind.DIAGNOSTIC;
      const previouslyCompletedDiagnostic = !!(await tx.attempt.findFirst({
        where: {
          studentId: attempt.studentId,
          kind: TestTemplateKind.DIAGNOSTIC,
          status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
        },
        select: { id: true },
      }));
      const hasCompletedDiagnostic = isCurrentDiagnostic || previouslyCompletedDiagnostic;

      const studentProfile = await tx.studentProfile.findUnique({
        where: { userId: attempt.studentId },
      });
      const track = (studentProfile?.technicalTrack as TechnicalTrack) || TechnicalTrack.SOFTWARE;

      const recentMocks =
        (await tx.attempt.findMany({
          where: {
            studentId: attempt.studentId,
            kind: TestTemplateKind.MOCK,
            status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
          },
          select: { percent: true, submittedAt: true },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        })) || [];

      // Compute active practice days in last 14 days
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const recentItems = await tx.attemptItem.findMany({
        where: {
          attempt: { studentId: attempt.studentId },
          answeredAt: { gte: fourteenDaysAgo },
        },
        select: { answeredAt: true },
      });
      const activeDaysSet = new Set(
        recentItems
          .map((i) => (i.answeredAt ? i.answeredAt.toISOString().split('T')[0] : null))
          .filter(Boolean),
      );
      const activeDaysInLast14Days = Math.max(1, activeDaysSet.size);

      const readiness = computeReadiness({
        track,
        hasCompletedDiagnostic,
        aptitudeTopics,
        technicalTopics,
        recentMockAttempts: recentMocks.map((m) => ({
          percent: m.percent,
          submittedAt: m.submittedAt || new Date(),
        })),
        activeDaysInLast14Days,
        totalScoredItems: allTopicStats.reduce((sum, st) => sum + st.scoredCount, 0),
      });

      await tx.readinessSnapshot.create({
        data: {
          studentId: attempt.studentId,
          collegeId: attempt.collegeId,
          score: readiness.score ?? 0,
          band: readiness.band ?? ReadinessBand.GETTING_STARTED,
          confidence: readiness.confidence,
          trigger: ReadinessTrigger.ATTEMPT_SUBMITTED,
          formulaVersion: FORMULA_VERSION,
          components: readiness.components as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        attemptId: updatedAttempt.id,
        status: updatedAttempt.status,
        score: updatedAttempt.score,
        totalMarks: updatedAttempt.totalMarks,
        percent: updatedAttempt.percent,
        sectionScores: updatedAttempt.sectionScores,
        isDiagnostic: isCurrentDiagnostic,
      };
    });

    // Auto-generate 4-week roadmap upon diagnostic completion if needed
    if (result.isDiagnostic) {
      try {
        await this.roadmapService.generateAndSaveRoadmap(attempt.studentId, attempt.collegeId);
      } catch (err) {
        // Log roadmap generation warning but don't fail score return
        console.warn('Roadmap auto-generation on diagnostic completion:', err);
      }
    }

    return result;
  }

  /**
   * Get review with answers, explanations, and scores.
   * ONLY accessible if attempt is finalized.
   */
  async getAttemptReview(attemptId: string, user: CurrentUser) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        schedule: true,
        template: {
          include: {
            sections: { orderBy: { sequence: 'asc' } },
          },
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              select: { type: true, difficulty: true, topic: { select: { name: true } } },
            },
            version: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    if (user.role === Role.STUDENT && attempt.studentId !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('Review is not available while attempt is IN_PROGRESS');
    }

    // Schedule results release policy check
    if (
      attempt.schedule &&
      attempt.schedule.resultsRelease === ResultsReleasePolicy.AFTER_WINDOW_CLOSES
    ) {
      const now = new Date();
      if (now < attempt.schedule.endsAt) {
        throw new ForbiddenException(
          `Results are withheld until schedule ends at ${attempt.schedule.endsAt.toISOString()}`,
        );
      }
    }

    return {
      attemptId: attempt.id,
      status: attempt.status,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percent: attempt.percent,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      sectionScores: attempt.sectionScores,
      items: attempt.items.map((it) => ({
        position: it.position,
        sectionSeq: it.sectionSeq,
        topic: it.question.topic.name,
        type: it.question.type,
        difficulty: it.question.difficulty,
        stem: it.version.stem,
        explanation: it.version.explanation,
        marksAwarded: it.marksAwarded,
        isCorrect: it.isCorrect,
        studentSelectedOptionIds: it.selectedOptionIds,
        studentNumericResponse: it.numericResponse,
        options: it.version.options.map((o) => ({
          id: o.id,
          key: o.key,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
        numericAnswer: it.version.numericAnswer,
      })),
    };
  }

  /**
   * Sweeper: finalize expired in-progress attempts across the platform.
   */
  async finalizeExpiredAttempts() {
    const expiredCutoff = new Date(Date.now() - 10000); // 10s grace
    const expiredAttempts = await this.prisma.attempt.findMany({
      where: {
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: { lt: expiredCutoff },
      },
      select: { id: true },
    });

    let finalizedCount = 0;
    for (const att of expiredAttempts) {
      try {
        await this.finalizeAttempt(att.id, AttemptStatus.AUTO_SUBMITTED);
        finalizedCount++;
      } catch (err) {
        console.error(`[Sweeper] Failed to auto-finalize attempt ${att.id}:`, err);
      }
    }

    return { processedCount: finalizedCount };
  }
}
