import { DiagnosticsService } from './diagnostics.service';
import { AttemptsService } from '../attempts/attempts.service';
import { PrismaService } from '../prisma.service';
import {
  Role,
  CurrentUser,
  UserStatus,
  AttemptStatus,
  TechnicalTrack,
  TestTemplateKind,
} from '@campusedge/shared';
import { ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';

interface MockPrismaClient {
  attempt: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  attemptItem: { createMany: jest.Mock };
  studentProfile: { findUnique: jest.Mock };
  testTemplate: { findFirst: jest.Mock; create: jest.Mock; findUniqueOrThrow: jest.Mock };
  testSection: { createMany: jest.Mock };
  topic: { findMany: jest.Mock };
  question: { findMany: jest.Mock; findUnique: jest.Mock };
  $transaction: jest.Mock;
}

interface MockAttemptsService {
  finalizeAttempt: jest.Mock;
  getAttempt: jest.Mock;
}

describe('DiagnosticsService', () => {
  let service: DiagnosticsService;
  let mockPrisma: MockPrismaClient;
  let mockAttemptsService: MockAttemptsService;

  const mockStudent: CurrentUser = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'student@apex.edu',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    collegeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  const mockAdmin: CurrentUser = {
    userId: '99999999-9999-9999-9999-999999999999',
    email: 'admin@apex.edu',
    role: Role.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    collegeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  beforeEach(() => {
    mockPrisma = {
      attempt: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'attempt-diag-1',
            ...data,
          }),
        ),
      },
      attemptItem: {
        createMany: jest.fn().mockResolvedValue({ count: 45 }),
      },
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          userId: mockStudent.userId,
          technicalTrack: TechnicalTrack.SOFTWARE,
        }),
      },
      testTemplate: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'tpl-diag-1',
          title: 'CampusEdge Comprehensive Diagnostic Assessment (Software Track)',
          durationMinutes: 60,
          sections: [
            { id: 'sec-1', sequence: 1, title: 'Quant', questionCount: 10 },
            { id: 'sec-2', sequence: 2, title: 'Logical', questionCount: 10 },
            { id: 'sec-3', sequence: 3, title: 'Verbal', questionCount: 10 },
            { id: 'sec-4', sequence: 4, title: 'Tech', questionCount: 15 },
          ],
        }),
        create: jest.fn().mockResolvedValue({ id: 'tpl-diag-1' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'tpl-diag-1',
          sections: [],
        }),
      },
      testSection: {
        createMany: jest.fn().mockResolvedValue({ count: 4 }),
      },
      topic: {
        findMany: jest.fn().mockResolvedValue([
          { id: 't-apt', slug: 'aptitude', category: 'APTITUDE' },
          { id: 't-log', slug: 'logical', category: 'LOGICAL' },
          { id: 't-vrb', slug: 'verbal', category: 'VERBAL' },
          { id: 't-dsa', slug: 'dsa', category: 'DSA' },
          { id: 't-sql', slug: 'sql-dbms', category: 'SQL' },
          { id: 't-os', slug: 'os-concurrency', category: 'OS' },
          { id: 't-net', slug: 'networks', category: 'NETWORKS' },
          { id: 't-oop', slug: 'oop', category: 'OOP' },
          { id: 't-prg', slug: 'programming', category: 'PROGRAMMING' },
        ]),
      },
      question: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          // Return sample questions matching count
          const count = where?.id?.notIn ? 15 : 10;
          return Promise.resolve(
            Array.from({ length: count }, (_, i) => ({
              id: `q-${i + 1}-${Math.random().toString(36).substring(7)}`,
              topicId: where?.topicId?.in ? where.topicId.in[0] : 't-apt',
              subtopicId: null,
              difficulty: 3,
              expectedTimeSeconds: 60,
              currentVersionId: `v-${i + 1}`,
              currentVersion: {
                id: `v-${i + 1}`,
                stem: `Diagnostic Question ${i + 1}`,
                options: [
                  { id: 'opt-1', key: 'A', text: 'Option A' },
                  { id: 'opt-2', key: 'B', text: 'Option B' },
                ],
              },
            })),
          );
        }),
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve({
            id: where.id,
            topicId: 't-apt',
            difficulty: 3,
            currentVersion: {
              id: `v-for-${where.id}`,
              stem: `Diagnostic Question Stem`,
              options: [
                { id: 'opt-1', key: 'A', text: 'Option A' },
                { id: 'opt-2', key: 'B', text: 'Option B' },
              ],
            },
          }),
        ),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    mockAttemptsService = {
      finalizeAttempt: jest.fn().mockResolvedValue({ success: true }),
      getAttempt: jest.fn().mockImplementation((attemptId) =>
        Promise.resolve({
          id: attemptId,
          status: AttemptStatus.IN_PROGRESS,
          totalQuestions: 45,
          durationMinutes: 60,
        }),
      ),
    };

    service = new DiagnosticsService(
      mockPrisma as unknown as PrismaService,
      mockAttemptsService as unknown as AttemptsService,
    );
  });

  describe('startDiagnostic Role and Concurrency Validation', () => {
    it('strictly forbids non-students from starting diagnostic assessment', async () => {
      await expect(service.startDiagnostic(mockAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('rejects student with missing college context', async () => {
      const studentWithoutCollege: CurrentUser = {
        ...mockStudent,
        collegeId: null as unknown as string,
      };
      await expect(service.startDiagnostic(studentWithoutCollege)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects student if another test attempt is currently IN_PROGRESS', async () => {
      mockPrisma.attempt.findFirst.mockResolvedValueOnce({
        id: 'active-attempt-id',
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: new Date(Date.now() + 30 * 60 * 1000), // Not expired
      });

      await expect(service.startDiagnostic(mockStudent)).rejects.toThrow(ConflictException);
    });

    it('auto-finalizes expired active attempt and proceeds', async () => {
      mockPrisma.attempt.findFirst
        .mockResolvedValueOnce({
          id: 'expired-attempt-id',
          status: AttemptStatus.IN_PROGRESS,
          deadlineAt: new Date(Date.now() - 10000), // Expired
        })
        .mockResolvedValueOnce(null); // No previous diagnostic for cooldown

      const result = await service.startDiagnostic(mockStudent);
      expect(mockAttemptsService.finalizeAttempt).toHaveBeenCalledWith(
        'expired-attempt-id',
        AttemptStatus.AUTO_SUBMITTED,
      );
      expect(result).toBeDefined();
    });
  });

  describe('14-Day Diagnostic Cooldown Enforcement', () => {
    it('blocks student who submitted diagnostic within the last 14 days', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      mockPrisma.attempt.findFirst
        .mockResolvedValueOnce(null) // No IN_PROGRESS attempt
        .mockResolvedValueOnce({
          id: 'prev-diag-attempt',
          kind: TestTemplateKind.DIAGNOSTIC,
          status: AttemptStatus.SUBMITTED,
          submittedAt: fiveDaysAgo,
        });

      await expect(service.startDiagnostic(mockStudent)).rejects.toThrow(
        /Diagnostic cooldown active/,
      );
    });

    it('allows student to take diagnostic if last attempt was 15 days ago', async () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      mockPrisma.attempt.findFirst
        .mockResolvedValueOnce(null) // No IN_PROGRESS attempt
        .mockResolvedValueOnce({
          id: 'prev-diag-attempt',
          kind: TestTemplateKind.DIAGNOSTIC,
          status: AttemptStatus.SUBMITTED,
          submittedAt: fifteenDaysAgo,
        });

      const result = await service.startDiagnostic(mockStudent);
      expect(result).toBeDefined();
      expect(mockAttemptsService.getAttempt).toHaveBeenCalled();
    });

    it('allows first-time student who has never taken a diagnostic', async () => {
      mockPrisma.attempt.findFirst.mockResolvedValue(null);

      const result = await service.startDiagnostic(mockStudent);
      expect(result).toBeDefined();
      expect(mockAttemptsService.getAttempt).toHaveBeenCalled();
    });
  });

  describe('Track-aware 45-Question Blueprint Generation', () => {
    it('creates diagnostic test for Software Track with 4 sections', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        userId: mockStudent.userId,
        technicalTrack: TechnicalTrack.SOFTWARE,
      });

      const result = await service.startDiagnostic(mockStudent);
      expect(result).toBeDefined();
      expect(mockPrisma.attempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: mockStudent.userId,
            kind: TestTemplateKind.DIAGNOSTIC,
            status: AttemptStatus.IN_PROGRESS,
          }),
        }),
      );
      expect(mockPrisma.attemptItem.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              collegeId: mockStudent.collegeId,
              visited: true,
              position: 1,
            }),
          ]),
        }),
      );
    });

    it('creates diagnostic test for Non-Software Track', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        userId: mockStudent.userId,
        technicalTrack: TechnicalTrack.OTHER,
      });

      mockPrisma.testTemplate.findFirst.mockResolvedValue(null); // Force template creation branch

      const result = await service.startDiagnostic(mockStudent);
      expect(result).toBeDefined();
      expect(mockPrisma.testTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('General Track'),
            durationMinutes: 60,
          }),
        }),
      );
    });

    it('deprioritizes questions answered within 30-day anti-repeat pool', async () => {
      mockPrisma.attempt.findMany.mockResolvedValueOnce([
        {
          items: [{ questionId: 'seen-question-1' }, { questionId: 'seen-question-2' }],
        },
      ]);

      const result = await service.startDiagnostic(mockStudent);
      expect(result).toBeDefined();
      expect(mockPrisma.attempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: mockStudent.userId,
          }),
        }),
      );
    });
  });
});
