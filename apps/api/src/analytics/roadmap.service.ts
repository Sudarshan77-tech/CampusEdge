import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  TechnicalTrack,
  TopicMasteryLevel,
  RoadmapPlanStatus,
  RoadmapTaskKind,
  RoadmapTaskStatus,
  generateRoadmap,
  TopicStatForRoadmap,
  UpcomingDriveForRoadmap,
  RoadmapTaskItem,
  FORMULA_VERSION,
} from '@campusedge/shared';

export interface RegenerateRoadmapOptions {
  studyHoursPerDay?: number;
  targetDate?: string | Date | null;
}

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministically generates and saves a 4-week personalized roadmap plan for a student.
   * Supersedes any previous active plan.
   */
  async generateAndSaveRoadmap(
    studentId: string,
    collegeId: string,
    options?: RegenerateRoadmapOptions,
  ) {
    // 1. Fetch student profile
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    const technicalTrack =
      (studentProfile?.technicalTrack as TechnicalTrack) || TechnicalTrack.SOFTWARE;

    let studyHoursPerDay = Number(studentProfile?.studyHoursPerDay ?? 1.5);
    if (options?.studyHoursPerDay !== undefined && options.studyHoursPerDay !== null) {
      studyHoursPerDay = Number(options.studyHoursPerDay);
    }

    let targetDate = studentProfile?.targetDate ?? null;
    if (options?.targetDate !== undefined) {
      targetDate = options.targetDate ? new Date(options.targetDate) : null;
    }

    // Update student profile preferences if changed
    if (options?.studyHoursPerDay !== undefined || options?.targetDate !== undefined) {
      await this.prisma.studentProfile.update({
        where: { userId: studentId },
        data: {
          studyHoursPerDay: studyHoursPerDay,
          targetDate: targetDate,
        },
      });
    }

    // 2. Fetch student topic stats
    const rawStats = await this.prisma.studentTopicStat.findMany({
      where: { studentId },
      include: {
        topic: { select: { id: true, name: true, category: true, slug: true } },
      },
    });

    const topicStats: TopicStatForRoadmap[] = rawStats.map((st) => ({
      topicId: st.topic.id,
      topicName: st.topic.name,
      category: st.topic.category as string,
      mastery: st.mastery,
      level: st.level as TopicMasteryLevel,
      lastPracticedAt: st.lastPracticedAt,
    }));

    // If student has no topic stats yet, pull all active topics as baseline
    if (topicStats.length === 0) {
      const allTopics = await this.prisma.topic.findMany({
        select: { id: true, name: true, category: true, slug: true },
        orderBy: { sortOrder: 'asc' },
      });
      for (const t of allTopics) {
        topicStats.push({
          topicId: t.id,
          topicName: t.name,
          category: t.category as string,
          mastery: 0.5,
          level: TopicMasteryLevel.INSUFFICIENT_DATA,
          lastPracticedAt: null,
        });
      }
    }

    // 3. Fetch upcoming drives for student's college (next 30 days)
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingDrives = await this.prisma.drive.findMany({
      where: {
        collegeId,
        visitDate: { gte: now, lte: thirtyDaysAhead },
      },
      include: {
        company: { select: { id: true, name: true } },
        rounds: {
          select: {
            id: true,
            title: true,
            topics: { select: { topicId: true } },
          },
        },
      },
      orderBy: { visitDate: 'asc' },
    });

    const eligibleUpcomingDrives: UpcomingDriveForRoadmap[] = upcomingDrives.map((d) => ({
      driveId: d.id,
      companyName: d.company.name,
      driveDate: d.visitDate || now,
      topicIdsInRounds: d.rounds.flatMap((r) => r.topics.map((t) => t.topicId)),
    }));

    // 4. Check for completed tasks from previous active plans to preserve
    const existingActivePlan = await this.prisma.roadmapPlan.findFirst({
      where: { studentId, status: RoadmapPlanStatus.ACTIVE },
      include: {
        tasks: {
          where: { status: RoadmapTaskStatus.DONE },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    const existingFutureTasks: RoadmapTaskItem[] = [];
    if (existingActivePlan) {
      for (const t of existingActivePlan.tasks) {
        existingFutureTasks.push({
          scheduledDate: t.scheduledDate,
          kind: t.kind as RoadmapTaskKind,
          topicId: t.topicId || undefined,
          driveId: t.driveId || undefined,
          targetQuestionCount: t.targetQuestionCount,
          status: t.status as RoadmapTaskStatus,
          completedAt: t.completedAt || undefined,
          priority: t.priority,
          reason: t.reason,
        });
      }
    }

    // 5. Run deterministic roadmap engine
    const planResult = generateRoadmap({
      studentId,
      collegeId,
      currentDate: now,
      studyHoursPerDay,
      technicalTrack,
      targetDate,
      topicStats,
      eligibleUpcomingDrives,
      recurringRecruiterTopTopicIds: [],
      existingFutureTasks,
    });

    // 6. Atomically persist roadmap plan and tasks
    return this.prisma.$transaction(async (tx) => {
      // Archive existing active plans
      await tx.roadmapPlan.updateMany({
        where: { studentId, status: RoadmapPlanStatus.ACTIVE },
        data: { status: RoadmapPlanStatus.SUPERSEDED },
      });

      // Create new plan
      const newPlan = await tx.roadmapPlan.create({
        data: {
          studentId,
          collegeId,
          status: RoadmapPlanStatus.ACTIVE,
          horizonDays: planResult.horizonDays,
          formulaVersion: FORMULA_VERSION,
          inputs: {
            studyHoursPerDay,
            technicalTrack,
            targetDate: targetDate?.toISOString() ?? null,
            dailyQuestionBudget: planResult.dailyQuestionBudget,
          },
        },
      });

      // Create tasks
      if (planResult.tasks.length > 0) {
        await tx.roadmapTask.createMany({
          data: planResult.tasks.map((task) => ({
            planId: newPlan.id,
            scheduledDate: task.scheduledDate,
            kind: task.kind as RoadmapTaskKind,
            topicId: task.topicId || null,
            driveId: task.driveId || null,
            targetQuestionCount: task.targetQuestionCount,
            status: task.status as RoadmapTaskStatus,
            completedAt: task.completedAt ? new Date(task.completedAt) : null,
            priority: task.priority,
            reason: task.reason,
          })),
        });
      }

      // Return fully hydrated plan
      return tx.roadmapPlan.findUnique({
        where: { id: newPlan.id },
        include: {
          tasks: {
            orderBy: [{ scheduledDate: 'asc' }, { priority: 'desc' }],
            include: {
              topic: { select: { id: true, name: true, slug: true, category: true } },
              drive: { select: { id: true, company: { select: { id: true, name: true } } } },
            },
          },
        },
      });
    });
  }

  /**
   * Get active roadmap plan for student. If no plan exists but diagnostic is completed, auto-generates.
   */
  async getActivePlan(user: CurrentUser) {
    if (!user.collegeId) {
      throw new BadRequestException('College context required');
    }

    const activePlan = await this.prisma.roadmapPlan.findFirst({
      where: {
        studentId: user.userId,
        status: RoadmapPlanStatus.ACTIVE,
      },
      include: {
        tasks: {
          orderBy: [{ scheduledDate: 'asc' }, { priority: 'desc' }],
          include: {
            topic: { select: { id: true, name: true, slug: true, category: true } },
            drive: { select: { id: true, company: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (activePlan) {
      return {
        active: true,
        plan: activePlan,
      };
    }

    // Check if diagnostic is completed
    const diagnosticAttempt = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        kind: 'DIAGNOSTIC',
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      select: { id: true },
    });

    if (diagnosticAttempt) {
      const generated = await this.generateAndSaveRoadmap(user.userId, user.collegeId);
      return {
        active: true,
        plan: generated,
      };
    }

    return {
      active: false,
      plan: null,
      message:
        'Complete your initial Diagnostic Assessment to generate your personalized 4-week roadmap.',
    };
  }

  /**
   * Update roadmap task status (mark DONE / SKIPPED).
   */
  async updateTaskStatus(taskId: string, status: RoadmapTaskStatus, user: CurrentUser) {
    const task = await this.prisma.roadmapTask.findUnique({
      where: { id: taskId },
      include: { plan: true },
    });

    if (!task) {
      throw new NotFoundException('Roadmap task not found');
    }

    if (task.plan.studentId !== user.userId) {
      throw new ForbiddenException('Access denied to this roadmap task');
    }

    const updated = await this.prisma.roadmapTask.update({
      where: { id: taskId },
      data: {
        status: status,
        completedAt: status === RoadmapTaskStatus.DONE ? new Date() : null,
      },
      include: {
        topic: { select: { id: true, name: true, slug: true } },
      },
    });

    return {
      success: true,
      task: updated,
    };
  }
}
