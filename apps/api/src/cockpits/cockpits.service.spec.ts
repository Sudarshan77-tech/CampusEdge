import { PlacementCellReadinessService } from './placement-cell-readiness.service';
import { AdminReadinessService } from './admin-readiness.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { QuestionsService } from '../questions/questions.service';
import { Role, CurrentUser, UserStatus, ReadinessBand } from '@campusedge/shared';
import { ForbiddenException } from '@nestjs/common';

interface MockPrismaClient {
  studentProfile: { findMany: jest.Mock; count: jest.Mock };
  readinessSnapshot: { findMany: jest.Mock };
  topic: { findMany: jest.Mock };
  studentTopicStat: { findMany: jest.Mock };
  testSchedule: { findUnique: jest.Mock };
  attempt: { findMany: jest.Mock };
  attemptItem: { findMany: jest.Mock };
  college: { findMany: jest.Mock };
  question: { findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  questionReport: { count: jest.Mock };
}

interface MockAuditService {
  log: jest.Mock;
}

interface MockQuestionsService {
  approve: jest.Mock;
}

describe('Cockpits Service & RBAC / Tenant / Privacy Guards (Part 3E)', () => {
  let placementService: PlacementCellReadinessService;
  let adminService: AdminReadinessService;
  let mockPrisma: MockPrismaClient;
  let mockAuditService: MockAuditService;
  let mockQuestionsService: MockQuestionsService;

  const collegeIdA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const collegeIdB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const mockCollegeAdminA: CurrentUser = {
    userId: 'admin-a-id',
    email: 'tpo@college-a.edu',
    role: Role.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    collegeId: collegeIdA,
  };

  const mockSuperAdmin: CurrentUser = {
    userId: 'super-admin-id',
    email: 'superadmin@campusedge.internal',
    role: Role.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    collegeId: null,
  };

  beforeEach(() => {
    mockPrisma = {
      studentProfile: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      readinessSnapshot: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      topic: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'top-1', name: 'Quant', slug: 'aptitude', category: 'APTITUDE' },
          { id: 'top-2', name: 'DSA', slug: 'dsa', category: 'DSA' },
        ]),
      },
      studentTopicStat: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      testSchedule: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      attempt: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      attemptItem: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      college: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      question: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      questionReport: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockQuestionsService = {
      approve: jest.fn().mockResolvedValue({ success: true }),
    };

    placementService = new PlacementCellReadinessService(
      mockPrisma as unknown as PrismaService,
      mockAuditService as unknown as AuditService,
    );

    adminService = new AdminReadinessService(
      mockPrisma as unknown as PrismaService,
      mockAuditService as unknown as AuditService,
      mockQuestionsService as unknown as QuestionsService,
    );
  });

  describe('Placement Cell Differential Privacy Masking (ADR 0004)', () => {
    it('masks cohort distribution when cohort matches fewer than 3 students (> 0 and < 3)', async () => {
      // 2 students match the filter
      mockPrisma.studentProfile.findMany.mockResolvedValueOnce([
        { userId: 'student-1' },
        { userId: 'student-2' },
      ]);

      const result = await placementService.getCohortDistribution(
        mockCollegeAdminA,
        'branch-ece-id',
        2026,
      );

      expect(result.masked).toBe(true);
      expect(result.totalStudents).toBe(2);
      expect(result.distribution).toBeNull();
      expect(result.message).toContain('differential privacy threshold (< 3 students)');
    });

    it('returns unmasked distribution across 4 bands when cohort has 3 or more students', async () => {
      // 4 students match
      mockPrisma.studentProfile.findMany.mockResolvedValueOnce([
        { userId: 'student-1' },
        { userId: 'student-2' },
        { userId: 'student-3' },
        { userId: 'student-4' },
      ]);

      mockPrisma.readinessSnapshot.findMany.mockResolvedValueOnce([
        { studentId: 'student-1', score: 35, band: ReadinessBand.GETTING_STARTED },
        { studentId: 'student-2', score: 55, band: ReadinessBand.BUILDING },
        { studentId: 'student-3', score: 72, band: ReadinessBand.COMPETITIVE },
        { studentId: 'student-4', score: 88, band: ReadinessBand.STRONG },
      ]);

      const result = await placementService.getCohortDistribution(
        mockCollegeAdminA,
        'branch-cse-id',
        2026,
      );

      expect(result.masked).toBe(false);
      expect(result.totalStudents).toBe(4);
      expect(result.evaluatedStudents).toBe(4);
      expect(result.averageScore).toBe(62.5); // (35 + 55 + 72 + 88) / 4
      expect(result.distribution).toBeDefined();
      expect(result.distribution!.GETTING_STARTED.count).toBe(1);
      expect(result.distribution!.BUILDING.count).toBe(1);
      expect(result.distribution!.COMPETITIVE.count).toBe(1);
      expect(result.distribution!.STRONG.count).toBe(1);
    });

    it('masks topic heatmap when cohort filter is below privacy threshold', async () => {
      mockPrisma.studentProfile.findMany.mockResolvedValueOnce([{ userId: 'student-1' }]);

      const result = await placementService.getTopicHeatmap(mockCollegeAdminA, 'small-branch-id');

      expect(result.masked).toBe(true);
      expect(result.message).toContain('differential privacy threshold');
    });

    it('returns topic heatmap with weak student counts when cohort is valid', async () => {
      mockPrisma.topic.findMany.mockResolvedValueOnce([
        { id: 'top-1', name: 'Quant', slug: 'aptitude', category: 'APTITUDE', sortOrder: 1 },
      ]);

      mockPrisma.studentTopicStat.findMany.mockResolvedValueOnce([
        { topicId: 'top-1', mastery: 0.35, level: 'WEAK' },
        { topicId: 'top-1', mastery: 0.55, level: 'MODERATE' },
        { topicId: 'top-1', mastery: 0.85, level: 'STRONG' },
      ]);

      const result = await placementService.getTopicHeatmap(mockCollegeAdminA);

      expect(result.masked).toBe(false);
      expect(result.heatmap).toHaveLength(1);
      expect(result.heatmap[0]!.weakStudentCount).toBe(1);
      expect(result.heatmap[0]!.moderateStudentCount).toBe(1);
      expect(result.heatmap[0]!.strongStudentCount).toBe(1);
      expect(result.heatmap[0]!.averageMastery).toBeCloseTo(0.5833, 3);
    });
  });

  describe('Placement Cell Tenant Isolation & Schedule Attendance', () => {
    it('strictly forbids College Admin from viewing test schedule belonging to another college', async () => {
      mockPrisma.testSchedule.findUnique.mockResolvedValueOnce({
        id: 'schedule-b-id',
        collegeId: collegeIdB, // College B
        template: { title: 'Mock Test', durationMinutes: 60 },
      });

      await expect(
        placementService.getScheduleAttendance('schedule-b-id', mockCollegeAdminA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('calculates live attendance metrics for own college schedule', async () => {
      mockPrisma.testSchedule.findUnique.mockResolvedValueOnce({
        id: 'schedule-a-id',
        collegeId: collegeIdA,
        title: 'TCS Placement Mock',
        status: 'ACTIVE',
        startsAt: new Date(),
        endsAt: new Date(),
        template: { title: 'TCS Aptitude', durationMinutes: 60 },
      });

      mockPrisma.attempt.findMany.mockResolvedValueOnce([
        { status: 'IN_PROGRESS', score: 0, percent: 0, integrityFlagCount: 1 },
        { status: 'SUBMITTED', score: 38, percent: 84.4, integrityFlagCount: 0 },
        { status: 'SUBMITTED', score: 42, percent: 93.3, integrityFlagCount: 2 },
        { status: 'ABANDONED', score: 10, percent: 22.2, integrityFlagCount: 0 },
      ]);

      const result = await placementService.getScheduleAttendance(
        'schedule-a-id',
        mockCollegeAdminA,
      );

      expect(result.attendance.totalAttempts).toBe(4);
      expect(result.attendance.inProgressCount).toBe(1);
      expect(result.attendance.submittedCount).toBe(2);
      expect(result.attendance.abandonedCount).toBe(1);
      expect(result.attendance.averageScore).toBe(40);
      expect(result.attendance.totalIntegrityFlags).toBe(3);
    });
  });

  describe('DPDP CSV Results Export', () => {
    it('generates ranked CSV results and logs mandatory DPDP purpose audit log', async () => {
      mockPrisma.testSchedule.findUnique.mockResolvedValueOnce({
        id: 'schedule-a-id',
        collegeId: collegeIdA,
        title: 'Campus Assessment Round 1',
        template: { title: 'Round 1 Template' },
      });

      mockPrisma.attempt.findMany.mockResolvedValueOnce([
        {
          score: 45,
          totalMarks: 50,
          percent: 90,
          integrityFlagCount: 0,
          status: 'SUBMITTED',
          submittedAt: new Date('2026-10-10T04:00:00Z'),
          student: {
            fullName: 'Alice Smith',
            email: 'alice@apex.edu',
            studentProfile: {
              enrollmentNumber: 'APEX-001',
              batchYear: 2026,
              branch: { code: 'CSE' },
            },
          },
        },
        {
          score: 40,
          totalMarks: 50,
          percent: 80,
          integrityFlagCount: 1,
          status: 'SUBMITTED',
          submittedAt: new Date('2026-10-10T04:05:00Z'),
          student: {
            fullName: 'Bob Jones',
            email: 'bob@apex.edu',
            studentProfile: {
              enrollmentNumber: 'APEX-002',
              batchYear: 2026,
              branch: { code: 'ECE' },
            },
          },
        },
      ]);

      const exportResult = await placementService.exportScheduleResultsCsv(
        'schedule-a-id',
        mockCollegeAdminA,
      );

      expect(exportResult.totalExported).toBe(2);
      expect(exportResult.csv).toContain('Rank,Student Name,Email');
      expect(exportResult.csv).toContain('1,"Alice Smith","alice@apex.edu"');
      expect(exportResult.csv).toContain('2,"Bob Jones","bob@apex.edu"');

      // DPDP audit entry verified
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCollegeAdminA.userId,
          collegeId: collegeIdA,
          action: 'EXPORT_SCHEDULE_RESULTS',
          entityType: 'TestSchedule',
          entityId: 'schedule-a-id',
        }),
      );
    });

    it('strictly prevents exporting results of another college schedule', async () => {
      mockPrisma.testSchedule.findUnique.mockResolvedValueOnce({
        id: 'schedule-b-id',
        collegeId: collegeIdB, // Another college
        template: { title: 'Other Template' },
      });

      await expect(
        placementService.exportScheduleResultsCsv('schedule-b-id', mockCollegeAdminA),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Super Admin Multi-Institution Overview & Moderation Queue', () => {
    it('benchmarks all colleges with student count, diagnostic progress, and average readiness', async () => {
      mockPrisma.college.findMany.mockResolvedValueOnce([
        {
          id: collegeIdA,
          name: 'Apex Institute',
          slug: 'apex-iet',
          city: 'Bengaluru',
          state: 'Karnataka',
          status: 'ACTIVE',
        },
      ]);

      mockPrisma.studentProfile.count.mockResolvedValueOnce(100);

      mockPrisma.attempt.findMany.mockResolvedValueOnce([
        { studentId: 'student-1' },
        { studentId: 'student-2' },
      ]);

      mockPrisma.readinessSnapshot.findMany.mockResolvedValueOnce([
        { studentId: 'student-1', score: 75 },
        { studentId: 'student-2', score: 85 },
      ]);

      mockPrisma.attemptItem.findMany.mockResolvedValueOnce([
        { attempt: { studentId: 'student-1' } },
      ]);

      const overview = await adminService.getMultiInstitutionOverview();

      expect(overview).toHaveLength(1);
      expect(overview[0]!.collegeName).toBe('Apex Institute');
      expect(overview[0]!.totalStudents).toBe(100);
      expect(overview[0]!.diagnosticCompletedCount).toBe(2);
      expect(overview[0]!.diagnosticCompletionPercent).toBe(2.0);
      expect(overview[0]!.averageReadinessScore).toBe(80);
      expect(overview[0]!.activeStudentsLast7d).toBe(1);
    });

    it('returns question bank health by status and top flagged questions', async () => {
      mockPrisma.question.findMany
        .mockResolvedValueOnce([
          { id: 'q-1', status: 'APPROVED' },
          { id: 'q-2', status: 'APPROVED' },
          { id: 'q-3', status: 'FLAGGED' },
        ])
        .mockResolvedValueOnce([
          {
            id: 'q-3',
            status: 'FLAGGED',
            difficulty: 3,
            currentVersion: { stem: 'Problematic question stem' },
            topic: { name: 'Quant', category: 'APTITUDE' },
            reports: [
              { id: 'rep-1', reason: 'AMBIGUOUS_OPTIONS', note: 'Multiple correct answers' },
            ],
          },
        ]);

      mockPrisma.questionReport.count.mockResolvedValueOnce(5);

      const health = await adminService.getQuestionBankHealth();

      expect(health.totalQuestions).toBe(3);
      expect(health.statusBreakdown.APPROVED).toBe(2);
      expect(health.statusBreakdown.FLAGGED).toBe(1);
      expect(health.pendingReportsCount).toBe(5);
      expect(health.flaggedQuestions).toHaveLength(1);
      expect(health.flaggedQuestions[0]!.stem).toBe('Problematic question stem');
    });

    it('allows Super Admin to reject a question with a moderator note and audit log', async () => {
      mockPrisma.question.findUnique.mockResolvedValueOnce({
        id: 'q-bad',
        status: 'FLAGGED',
      });
      mockPrisma.question.update.mockResolvedValueOnce({
        id: 'q-bad',
        status: 'RETIRED',
      });

      const res = await adminService.rejectQuestion(
        'q-bad',
        'Duplicate question stem violating uniqueness',
        mockSuperAdmin,
      );

      expect(res.success).toBe(true);
      expect(mockPrisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-bad' },
          data: { status: 'RETIRED' },
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REJECT_QUESTION',
          entityId: 'q-bad',
        }),
      );
    });
  });
});
