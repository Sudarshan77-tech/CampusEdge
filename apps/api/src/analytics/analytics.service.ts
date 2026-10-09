import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  TechnicalTrack,
  TopicCategory,
  TopicMasteryLevel,
  computeReadiness,
} from '@campusedge/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministically evaluates student placement readiness with full component breakdown,
   * confidence level, and disclaimer.
   */
  async getReadiness(user: CurrentUser) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId },
    });

    const track = (student?.technicalTrack as TechnicalTrack) || TechnicalTrack.SOFTWARE;

    // Check if diagnostic assessment has been completed
    const diagnosticAttempt = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        kind: 'DIAGNOSTIC',
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      select: { id: true, submittedAt: true },
    });

    const hasCompletedDiagnostic = !!diagnosticAttempt;

    // Fetch all student topic stats
    const allTopicStats = await this.prisma.studentTopicStat.findMany({
      where: { studentId: user.userId },
      include: {
        topic: { select: { id: true, name: true, category: true, slug: true } },
      },
    });

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

    // Fetch recent mock test attempts (last 5)
    const recentMocks = await this.prisma.attempt.findMany({
      where: {
        studentId: user.userId,
        kind: 'MOCK',
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
      },
      select: { percent: true, submittedAt: true },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    });

    // Compute active practice days in last 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const activeItems = await this.prisma.attemptItem.findMany({
      where: {
        attempt: { studentId: user.userId },
        answeredAt: { gte: fourteenDaysAgo },
      },
      select: { answeredAt: true },
    });

    const activeDaysSet = new Set(
      activeItems
        .map((i) => (i.answeredAt ? i.answeredAt.toISOString().split('T')[0] : null))
        .filter(Boolean),
    );
    const activeDaysInLast14Days = activeDaysSet.size;

    const totalScoredItems = allTopicStats.reduce((sum, st) => sum + st.scoredCount, 0);

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
      totalScoredItems,
    });

    return {
      ...readiness,
      diagnosticCompleted: hasCompletedDiagnostic,
      diagnosticCompletedAt: diagnosticAttempt?.submittedAt ?? null,
      message: hasCompletedDiagnostic
        ? undefined
        : 'Complete your initial Diagnostic Assessment to unlock your Placement Readiness Score.',
    };
  }

  /**
   * High-level student practice analytics summary.
   */
  async getSummary(user: CurrentUser) {
    // 1. Practice time & questions attempted
    const items = await this.prisma.attemptItem.findMany({
      where: {
        attempt: { studentId: user.userId },
        answeredAt: { not: null },
      },
      select: {
        timeSpentMs: true,
        isCorrect: true,
        answeredAt: true,
      },
    });

    const totalTimeMs = items.reduce((sum, i) => sum + (i.timeSpentMs || 0), 0);
    const practiceTimeMinutes = Math.round((totalTimeMs / (1000 * 60)) * 10) / 10;
    const totalQuestionsAttempted = items.length;

    const scoredItems = items.filter((i) => i.isCorrect !== null);
    const correctItems = scoredItems.filter((i) => i.isCorrect === true).length;
    const overallAccuracy =
      scoredItems.length > 0 ? Math.round((correctItems / scoredItems.length) * 1000) / 10 : 0;

    // Active days in last 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentItems = items.filter(
      (i) => i.answeredAt && new Date(i.answeredAt) >= fourteenDaysAgo,
    );
    const activeDaysSet = new Set(
      recentItems
        .map((i) => (i.answeredAt ? new Date(i.answeredAt).toISOString().split('T')[0] : null))
        .filter(Boolean),
    );
    const activeDaysLast14 = activeDaysSet.size;

    // Readiness
    const readiness = await this.getReadiness(user);

    // Diagnostic status
    const latestDiagnostic = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        kind: 'DIAGNOSTIC',
      },
      orderBy: { startedAt: 'desc' },
    });

    const isDiagnosticCompleted =
      latestDiagnostic?.status === 'SUBMITTED' || latestDiagnostic?.status === 'AUTO_SUBMITTED';

    const cooldownPeriodMs = 14 * 24 * 60 * 60 * 1000;
    const lastDate = latestDiagnostic?.submittedAt || latestDiagnostic?.startedAt;
    const cooldownEndsAt = lastDate ? new Date(lastDate.getTime() + cooldownPeriodMs) : null;
    const canTakeNewDiagnostic = !lastDate || !cooldownEndsAt || new Date() >= cooldownEndsAt;

    return {
      practiceTimeMinutes,
      totalQuestionsAttempted,
      overallAccuracy,
      activeDaysLast14,
      readinessScore: readiness.score,
      readinessBand: readiness.band,
      readinessBandLabel: readiness.bandLabel,
      readinessConfidence: readiness.confidence,
      diagnosticStatus: {
        completed: isDiagnosticCompleted,
        completedAt: isDiagnosticCompleted ? latestDiagnostic?.submittedAt : null,
        attemptId: latestDiagnostic?.id ?? null,
        score: latestDiagnostic?.score ?? null,
        percent: latestDiagnostic?.percent ?? null,
        canTakeNew: canTakeNewDiagnostic,
        cooldownEndsAt: canTakeNewDiagnostic ? null : (cooldownEndsAt?.toISOString() ?? null),
      },
    };
  }

  /**
   * Topic mastery analytics list for current student.
   */
  async getTopicAnalytics(user: CurrentUser) {
    const topics = await this.prisma.topic.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const stats = await this.prisma.studentTopicStat.findMany({
      where: { studentId: user.userId },
    });
    const statByTopicId = new Map(stats.map((s) => [s.topicId, s]));

    return topics.map((t) => {
      const stat = statByTopicId.get(t.id);
      const scoredCount = stat?.scoredCount ?? 0;
      const correctCount = stat?.correctCount ?? 0;
      const accuracy = scoredCount > 0 ? Math.round((correctCount / scoredCount) * 1000) / 10 : 0;

      return {
        topicId: t.id,
        topicName: t.name,
        slug: t.slug,
        category: t.category,
        mastery: stat?.mastery ?? 0.5,
        level: stat?.level ?? TopicMasteryLevel.INSUFFICIENT_DATA,
        accuracy,
        scoredCount,
        correctCount,
        lastPracticedAt: stat?.lastPracticedAt ?? null,
      };
    });
  }

  /**
   * Daily accuracy trend over time window.
   */
  async getAccuracyTrend(user: CurrentUser, days: number = 30) {
    const windowDays = Math.max(7, Math.min(90, Number(days) || 30));
    const startDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const items = await this.prisma.attemptItem.findMany({
      where: {
        attempt: { studentId: user.userId },
        answeredAt: { gte: startDate },
        isCorrect: { not: null },
      },
      select: {
        answeredAt: true,
        isCorrect: true,
      },
      orderBy: { answeredAt: 'asc' },
    });

    const dayMap = new Map<string, { attempted: number; correct: number }>();

    for (const item of items) {
      if (!item.answeredAt) continue;
      const dateKey = item.answeredAt.toISOString().split('T')[0];
      if (!dateKey) continue;

      const current = dayMap.get(dateKey) || { attempted: 0, correct: 0 };
      current.attempted += 1;
      if (item.isCorrect) {
        current.correct += 1;
      }
      dayMap.set(dateKey, current);
    }

    const result = Array.from(dayMap.entries()).map(([date, stats]) => ({
      date,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 1000) / 10 : 0,
    }));

    return result;
  }
}
