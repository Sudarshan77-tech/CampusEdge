import { AnalyticsService } from './analytics.service';
import { RoadmapService } from './roadmap.service';
import { PrismaService } from '../prisma.service';
import {
  Role,
  CurrentUser,
  UserStatus,
  TechnicalTrack,
  TopicMasteryLevel,
  RoadmapPlanStatus,
  RoadmapTaskStatus,
  READINESS_DISCLAIMER,
} from '@campusedge/shared';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AnalyticsService and RoadmapService (Part 3D)', () => {
  let analyticsService: AnalyticsService;
  let roadmapService: RoadmapService;
  let mockPrisma: any;

  const mockStudent: CurrentUser = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'student@apex.edu',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    collegeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  beforeEach(() => {
    mockPrisma = {
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          userId: mockStudent.userId,
          technicalTrack: TechnicalTrack.SOFTWARE,
          studyHoursPerDay: 1.5,
          targetDate: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      attempt: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      attemptItem: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      studentTopicStat: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      topic: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'top-1', name: 'Quantitative Aptitude', slug: 'aptitude', category: 'APTITUDE' },
          { id: 'top-2', name: 'Data Structures & Algorithms', slug: 'dsa', category: 'DSA' },
        ]),
      },
      drive: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      roadmapPlan: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'plan-new-id',
            ...data,
          }),
        ),
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve({
            id: where.id,
            status: RoadmapPlanStatus.ACTIVE,
            tasks: [],
          }),
        ),
      },
      roadmapTask: {
        createMany: jest.fn().mockResolvedValue({ count: 28 }),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            ...data,
          }),
        ),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    analyticsService = new AnalyticsService(mockPrisma as unknown as PrismaService);
    roadmapService = new RoadmapService(mockPrisma as unknown as PrismaService);
  });

  describe('getReadiness (Placement Readiness Calculation)', () => {
    it('returns disabled readiness state with empty state message when diagnostic has not been taken', async () => {
      mockPrisma.attempt.findFirst.mockResolvedValueOnce(null); // No completed diagnostic

      const result = await analyticsService.getReadiness(mockStudent);

      expect(result.isAvailable).toBe(false);
      expect(result.score).toBeNull();
      expect(result.band).toBeNull();
      expect(result.diagnosticCompleted).toBe(false);
      expect(result.message).toContain('Complete your initial Diagnostic Assessment');
      expect(result.disclaimer).toBe(READINESS_DISCLAIMER);
    });

    it('computes readiness score for Software Track when diagnostic is completed', async () => {
      // Diagnostic completed
      mockPrisma.attempt.findFirst.mockResolvedValueOnce({
        id: 'diag-attempt-id',
        submittedAt: new Date(),
      });

      // Topic stats: Aptitude (20 questions, mastery 0.8), Technical (25 questions, mastery 0.75)
      mockPrisma.studentTopicStat.findMany.mockResolvedValueOnce([
        {
          topic: { id: 'top-1', name: 'Aptitude', category: 'APTITUDE', slug: 'aptitude' },
          scoredCount: 20,
          mastery: 0.8,
          level: TopicMasteryLevel.STRONG,
        },
        {
          topic: { id: 'top-2', name: 'DSA', category: 'DSA', slug: 'dsa' },
          scoredCount: 25,
          mastery: 0.75,
          level: TopicMasteryLevel.STRONG,
        },
      ]);

      // Mocks: 1 completed mock with 80%
      mockPrisma.attempt.findMany.mockResolvedValueOnce([{ percent: 80, submittedAt: new Date() }]);

      // Active items in last 14 days (5 days)
      mockPrisma.attemptItem.findMany.mockResolvedValueOnce([
        { answeredAt: new Date('2026-10-01') },
        { answeredAt: new Date('2026-10-02') },
        { answeredAt: new Date('2026-10-03') },
        { answeredAt: new Date('2026-10-04') },
        { answeredAt: new Date('2026-10-05') },
      ]);

      const result = await analyticsService.getReadiness(mockStudent);

      expect(result.isAvailable).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.band).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.components.aptitude.available).toBe(true);
      expect(result.components.technical.available).toBe(true);
      expect(result.components.mockPerformance.available).toBe(true);
      expect(result.components.consistency.available).toBe(true);
    });

    it('assigns ZERO weight to technical component for Non-Technical student', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValueOnce({
        userId: mockStudent.userId,
        technicalTrack: TechnicalTrack.OTHER,
      });

      mockPrisma.attempt.findFirst.mockResolvedValueOnce({
        id: 'diag-attempt-id',
        submittedAt: new Date(),
      });

      mockPrisma.studentTopicStat.findMany.mockResolvedValueOnce([
        {
          topic: { id: 'top-1', name: 'Aptitude', category: 'APTITUDE', slug: 'aptitude' },
          scoredCount: 30,
          mastery: 0.7,
        },
      ]);

      const result = await analyticsService.getReadiness(mockStudent);

      expect(result.components.technical.weight).toBe(0.0);
      expect(result.components.technical.available).toBe(false);
      expect(result.components.aptitude.weight).toBe(0.55);
    });
  });

  describe('getTopicAnalytics (Mastery Thresholds & Insufficient Data)', () => {
    it('marks topic as INSUFFICIENT_DATA when scoredCount < 5 even if accuracy is 100%', async () => {
      mockPrisma.topic.findMany.mockResolvedValueOnce([
        { id: 'top-1', name: 'Quantitative Aptitude', slug: 'aptitude', category: 'APTITUDE' },
      ]);

      mockPrisma.studentTopicStat.findMany.mockResolvedValueOnce([
        {
          topicId: 'top-1',
          scoredCount: 1, // Only 1 question answered
          correctCount: 1, // 100% accuracy
          mastery: 0.58,
          level: TopicMasteryLevel.INSUFFICIENT_DATA,
          lastPracticedAt: new Date(),
        },
      ]);

      const result = await analyticsService.getTopicAnalytics(mockStudent);

      expect(result).toHaveLength(1);
      expect(result[0]!.accuracy).toBe(100);
      expect(result[0]!.scoredCount).toBe(1);
      expect(result[0]!.level).toBe(TopicMasteryLevel.INSUFFICIENT_DATA);
    });
  });

  describe('getSummary & getAccuracyTrend', () => {
    it('aggregates practice time, accuracy, and active days', async () => {
      const today = new Date();
      mockPrisma.attemptItem.findMany.mockResolvedValueOnce([
        { timeSpentMs: 60000, isCorrect: true, answeredAt: today },
        { timeSpentMs: 120000, isCorrect: false, answeredAt: today },
      ]);

      const summary = await analyticsService.getSummary(mockStudent);

      expect(summary.totalQuestionsAttempted).toBe(2);
      expect(summary.practiceTimeMinutes).toBe(3); // (60000 + 120000) / 60000
      expect(summary.overallAccuracy).toBe(50); // 1 out of 2 correct = 50%
      expect(summary.activeDaysLast14).toBe(1);
    });

    it('groups accuracy trend by calendar date', async () => {
      mockPrisma.attemptItem.findMany.mockResolvedValueOnce([
        { answeredAt: new Date('2026-10-01T10:00:00Z'), isCorrect: true },
        { answeredAt: new Date('2026-10-01T11:00:00Z'), isCorrect: false },
        { answeredAt: new Date('2026-10-02T10:00:00Z'), isCorrect: true },
      ]);

      const trend = await analyticsService.getAccuracyTrend(mockStudent, 30);

      expect(trend).toHaveLength(2);
      expect(trend[0]!.date).toBe('2026-10-01');
      expect(trend[0]!.attempted).toBe(2);
      expect(trend[0]!.correct).toBe(1);
      expect(trend[0]!.accuracy).toBe(50);
      expect(trend[1]!.date).toBe('2026-10-02');
      expect(trend[1]!.accuracy).toBe(100);
    });
  });

  describe('RoadmapService (Plan Generation, Tasks, & Status Updates)', () => {
    it('generates 28-day roadmap plan and persists tasks atomically', async () => {
      const plan = await roadmapService.generateAndSaveRoadmap(
        mockStudent.userId,
        mockStudent.collegeId!,
        { studyHoursPerDay: 2.0 },
      );

      expect(plan).toBeDefined();
      expect(mockPrisma.roadmapPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: mockStudent.userId, status: RoadmapPlanStatus.ACTIVE },
          data: { status: RoadmapPlanStatus.SUPERSEDED },
        }),
      );
      expect(mockPrisma.roadmapPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: mockStudent.userId,
            status: RoadmapPlanStatus.ACTIVE,
            horizonDays: 28,
          }),
        }),
      );
      expect(mockPrisma.roadmapTask.createMany).toHaveBeenCalled();
    });

    it('updates roadmap task status to DONE and records completion timestamp', async () => {
      mockPrisma.roadmapTask.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        plan: { studentId: mockStudent.userId },
      });

      const updated = await roadmapService.updateTaskStatus(
        'task-1',
        RoadmapTaskStatus.DONE,
        mockStudent,
      );

      expect(updated.success).toBe(true);
      expect(mockPrisma.roadmapTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({
            status: RoadmapTaskStatus.DONE,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('rejects task update if task is not found', async () => {
      mockPrisma.roadmapTask.findUnique.mockResolvedValueOnce(null);

      await expect(
        roadmapService.updateTaskStatus('non-existent', RoadmapTaskStatus.DONE, mockStudent),
      ).rejects.toThrow(NotFoundException);
    });

    it('strictly forbids a student from updating another student task', async () => {
      mockPrisma.roadmapTask.findUnique.mockResolvedValueOnce({
        id: 'task-other-student',
        plan: { studentId: 'another-student-uuid' },
      });

      await expect(
        roadmapService.updateTaskStatus('task-other-student', RoadmapTaskStatus.DONE, mockStudent),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
