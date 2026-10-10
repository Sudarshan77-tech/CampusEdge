import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, ReadinessBand } from '@campusedge/shared';
import { Prisma } from '@campusedge/database';

@Injectable()
export class PlacementCellReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Evaluates cohort readiness distribution across the 4 readiness bands.
   * Strictly enforces Differential Privacy (ADR 0004):
   * Cohorts with fewer than 3 students are masked to prevent identification.
   */
  async getCohortDistribution(user: CurrentUser, branchId?: string, batchYear?: number) {
    if (!user.collegeId) {
      throw new BadRequestException('College context required');
    }

    const where: Prisma.StudentProfileWhereInput = {
      collegeId: user.collegeId,
    };

    if (branchId) {
      where.branchId = branchId;
    }
    if (batchYear) {
      where.batchYear = Number(batchYear);
    }

    const students = await this.prisma.studentProfile.findMany({
      where,
      select: { userId: true },
    });

    const totalStudents = students.length;

    // Differential privacy threshold check (ADR 0004)
    if (totalStudents > 0 && totalStudents < 3) {
      return {
        masked: true,
        totalStudents,
        evaluatedStudents: 0,
        averageScore: null,
        distribution: null,
        message:
          'Cohort size is below the differential privacy threshold (< 3 students). Aggregate data is masked to protect individual student privacy per ADR 0004.',
      };
    }

    if (totalStudents === 0) {
      return {
        masked: false,
        totalStudents: 0,
        evaluatedStudents: 0,
        averageScore: null,
        distribution: {
          GETTING_STARTED: { count: 0, percentage: 0 },
          BUILDING: { count: 0, percentage: 0 },
          COMPETITIVE: { count: 0, percentage: 0 },
          STRONG: { count: 0, percentage: 0 },
        },
      };
    }

    const studentIds = students.map((s) => s.userId);

    // Fetch latest readiness snapshot for each student
    const snapshots = await this.prisma.readinessSnapshot.findMany({
      where: {
        studentId: { in: studentIds },
      },
      orderBy: { computedAt: 'desc' },
    });

    const latestByStudent = new Map<string, (typeof snapshots)[0]>();
    for (const snap of snapshots) {
      if (!latestByStudent.has(snap.studentId)) {
        latestByStudent.set(snap.studentId, snap);
      }
    }

    const evaluatedSnaps = Array.from(latestByStudent.values());
    const evaluatedCount = evaluatedSnaps.length;

    let sumScores = 0;
    const bandCounts: Record<ReadinessBand, number> = {
      [ReadinessBand.GETTING_STARTED]: 0,
      [ReadinessBand.BUILDING]: 0,
      [ReadinessBand.COMPETITIVE]: 0,
      [ReadinessBand.STRONG]: 0,
    };

    for (const snap of evaluatedSnaps) {
      sumScores += snap.score;
      if (snap.band && bandCounts[snap.band as ReadinessBand] !== undefined) {
        bandCounts[snap.band as ReadinessBand]++;
      }
    }

    const averageScore =
      evaluatedCount > 0 ? Math.round((sumScores / evaluatedCount) * 100) / 100 : null;

    const distribution = {
      GETTING_STARTED: {
        count: bandCounts[ReadinessBand.GETTING_STARTED],
        percentage:
          evaluatedCount > 0
            ? Math.round((bandCounts[ReadinessBand.GETTING_STARTED] / evaluatedCount) * 1000) / 10
            : 0,
      },
      BUILDING: {
        count: bandCounts[ReadinessBand.BUILDING],
        percentage:
          evaluatedCount > 0
            ? Math.round((bandCounts[ReadinessBand.BUILDING] / evaluatedCount) * 1000) / 10
            : 0,
      },
      COMPETITIVE: {
        count: bandCounts[ReadinessBand.COMPETITIVE],
        percentage:
          evaluatedCount > 0
            ? Math.round((bandCounts[ReadinessBand.COMPETITIVE] / evaluatedCount) * 1000) / 10
            : 0,
      },
      STRONG: {
        count: bandCounts[ReadinessBand.STRONG],
        percentage:
          evaluatedCount > 0
            ? Math.round((bandCounts[ReadinessBand.STRONG] / evaluatedCount) * 1000) / 10
            : 0,
      },
    };

    return {
      masked: false,
      totalStudents,
      evaluatedStudents: evaluatedCount,
      averageScore,
      distribution,
    };
  }

  /**
   * College topic mastery heatmap aggregating average score and weak student counts per topic.
   */
  async getTopicHeatmap(user: CurrentUser, branchId?: string, batchYear?: number) {
    if (!user.collegeId) {
      throw new BadRequestException('College context required');
    }

    // Check filter size for privacy masking
    if (branchId || batchYear) {
      const filteredStudents = await this.prisma.studentProfile.findMany({
        where: {
          collegeId: user.collegeId,
          ...(branchId ? { branchId } : {}),
          ...(batchYear ? { batchYear: Number(batchYear) } : {}),
        },
        select: { userId: true },
      });

      if (filteredStudents.length > 0 && filteredStudents.length < 3) {
        return {
          masked: true,
          totalStudents: filteredStudents.length,
          heatmap: [],
          message:
            'Filtered cohort size is below differential privacy threshold (< 3 students). Topic heatmap is masked per ADR 0004.',
        };
      }
    }

    const topics = await this.prisma.topic.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const stats = await this.prisma.studentTopicStat.findMany({
      where: {
        collegeId: user.collegeId,
      },
    });

    const heatmap = topics.map((t) => {
      const topicStats = stats.filter((s) => s.topicId === t.id);
      const evaluatedCount = topicStats.length;

      const sumMastery = topicStats.reduce((acc, s) => acc + s.mastery, 0);
      const averageMastery =
        evaluatedCount > 0 ? Math.round((sumMastery / evaluatedCount) * 10000) / 10000 : 0.5;

      const weakCount = topicStats.filter((s) => s.level === 'WEAK').length;
      const moderateCount = topicStats.filter((s) => s.level === 'MODERATE').length;
      const strongCount = topicStats.filter((s) => s.level === 'STRONG').length;

      return {
        topicId: t.id,
        topicName: t.name,
        slug: t.slug,
        category: t.category,
        averageMastery,
        weakStudentCount: weakCount,
        moderateStudentCount: moderateCount,
        strongStudentCount: strongCount,
        totalEvaluatedStudents: evaluatedCount,
      };
    });

    return {
      masked: false,
      totalTopics: topics.length,
      heatmap,
    };
  }

  /**
   * Live attendance and metrics tracking for a scheduled college test.
   */
  async getScheduleAttendance(scheduleId: string, user: CurrentUser) {
    if (!user.collegeId) {
      throw new BadRequestException('College context required');
    }

    const schedule = await this.prisma.testSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        template: { select: { title: true, durationMinutes: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Test schedule not found');
    }

    if (schedule.collegeId !== user.collegeId) {
      throw new ForbiddenException('Access denied to this test schedule');
    }

    const attempts = await this.prisma.attempt.findMany({
      where: { scheduleId },
      select: {
        status: true,
        score: true,
        percent: true,
        integrityFlagCount: true,
      },
    });

    const inProgressCount = attempts.filter((a) => a.status === 'IN_PROGRESS').length;
    const submittedAttempts = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED',
    );
    const submittedCount = submittedAttempts.length;
    const abandonedCount = attempts.filter((a) => a.status === 'ABANDONED').length;

    const totalScores = submittedAttempts.reduce((acc, a) => acc + a.score, 0);
    const averageScore =
      submittedCount > 0 ? Math.round((totalScores / submittedCount) * 100) / 100 : 0;

    const totalPercents = submittedAttempts.reduce((acc, a) => acc + a.percent, 0);
    const averagePercent =
      submittedCount > 0 ? Math.round((totalPercents / submittedCount) * 100) / 100 : 0;

    const totalIntegrityFlags = attempts.reduce((acc, a) => acc + (a.integrityFlagCount || 0), 0);

    return {
      scheduleId: schedule.id,
      scheduleTitle: schedule.title,
      templateTitle: schedule.template.title,
      durationMinutes: schedule.template.durationMinutes,
      status: schedule.status,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      attendance: {
        totalAttempts: attempts.length,
        inProgressCount,
        submittedCount,
        abandonedCount,
        averageScore,
        averagePercent,
        totalIntegrityFlags,
      },
    };
  }

  /**
   * Export completed test results to CSV with mandatory DPDP purpose logging.
   */
  async exportScheduleResultsCsv(scheduleId: string, user: CurrentUser) {
    if (!user.collegeId) {
      throw new BadRequestException('College context required');
    }

    const schedule = await this.prisma.testSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        template: { select: { title: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Test schedule not found');
    }

    if (schedule.collegeId !== user.collegeId) {
      throw new ForbiddenException('Access denied to this test schedule');
    }

    const attempts = await this.prisma.attempt.findMany({
      where: {
        scheduleId,
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
            studentProfile: {
              include: {
                branch: { select: { code: true } },
              },
            },
          },
        },
      },
      orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
    });

    // Build CSV rows
    const headers = [
      'Rank',
      'Student Name',
      'Email',
      'Enrollment Number',
      'Branch',
      'Batch Year',
      'Score',
      'Total Marks',
      'Percentage',
      'Integrity Flags',
      'Status',
      'Submitted At',
    ];

    const rows = attempts.map((att, idx) => {
      const student = att.student;
      const profile = student.studentProfile;
      const branchCode = profile?.branch?.code || 'N/A';
      const enrollment = profile?.enrollmentNumber || 'N/A';
      const batchYear = profile?.batchYear?.toString() || 'N/A';
      const submittedAt = att.submittedAt ? att.submittedAt.toISOString() : 'N/A';

      return [
        idx + 1,
        `"${student.fullName.replace(/"/g, '""')}"`,
        `"${student.email}"`,
        `"${enrollment}"`,
        `"${branchCode}"`,
        batchYear,
        att.score,
        att.totalMarks,
        `${att.percent}%`,
        att.integrityFlagCount,
        att.status,
        `"${submittedAt}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Mandatory DPDP purpose log
    await this.auditService.log({
      actorId: user.userId,
      collegeId: user.collegeId,
      action: 'EXPORT_SCHEDULE_RESULTS',
      entityType: 'TestSchedule',
      entityId: scheduleId,
      metadata: {
        reason: 'Placement Cell drive shortlisting and academic record export',
        studentCount: attempts.length,
        scheduleTitle: schedule.title,
      },
    });

    const safeTitle = schedule.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      filename: `schedule_results_${safeTitle}.csv`,
      totalExported: attempts.length,
      csv: csvContent,
    };
  }
}
