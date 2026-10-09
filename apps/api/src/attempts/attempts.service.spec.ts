import {
  AttemptsService,
  StartAttemptDto,
  SaveAnswerDto,
  RecordEventDto,
} from './attempts.service';
import { PrismaService } from '../prisma.service';
import {
  Role,
  CurrentUser,
  UserStatus,
  AttemptStatus,
  AttemptEventType,
  TestTemplateKind,
  TestTemplateStatus,
  QuestionType,
  TopicCategory,
  assertNoAnswerLeakage,
  FORMULA_VERSION,
} from '@campusedge/shared';
import { ForbiddenException, ConflictException } from '@nestjs/common';

interface MockPrisma {
  attempt: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  attemptItem: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    createMany: jest.Mock;
    update: jest.Mock;
  };
  attemptEvent: {
    create: jest.Mock;
  };
  testTemplate: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  testSchedule: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  question: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  studentTopicStat: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    upsert: jest.Mock;
  };
  readinessSnapshot: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('AttemptsService & Zero Leakage Security Contract', () => {
  let service: AttemptsService;
  let prisma: MockPrisma;

  const mockStudent: CurrentUser = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'student@college.edu',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    collegeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  const mockAdmin: CurrentUser = {
    userId: '99999999-9999-9999-9999-999999999999',
    email: 'admin@college.edu',
    role: Role.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    collegeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  const mockTemplateId = '22222222-2222-2222-2222-222222222222';
  const mockAttemptId = '33333333-3333-3333-3333-333333333333';
  const mockQuestionId = '44444444-4444-4444-4444-444444444444';
  const mockVersionId = '55555555-5555-5555-5555-555555555555';
  const mockTopicId = '66666666-6666-6666-6666-666666666666';

  beforeEach(() => {
    prisma = {
      attempt: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
      },
      attemptItem: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
      },
      attemptEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      testTemplate: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      testSchedule: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      question: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      studentTopicStat: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({}),
      },
      readinessSnapshot: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback(prisma);
        }),
    };

    service = new AttemptsService(prisma as unknown as PrismaService);
  });

  describe('startAttempt', () => {
    it('rejects non-students from starting attempts', async () => {
      await expect(service.startAttempt({ templateId: mockTemplateId }, mockAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects starting a new attempt if student already has an active IN_PROGRESS attempt', async () => {
      prisma.attempt.findFirst.mockResolvedValue({
        id: 'existing-attempt',
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: new Date(Date.now() + 600000), // 10 minutes in future
      });

      await expect(
        service.startAttempt({ templateId: mockTemplateId }, mockStudent),
      ).rejects.toThrow(ConflictException);
    });

    it('creates attempt and returns clean overview with ZERO question content leaked', async () => {
      prisma.attempt.findFirst.mockResolvedValue(null);
      prisma.testTemplate.findUnique.mockResolvedValue({
        id: mockTemplateId,
        title: 'Diagnostic Test',
        kind: TestTemplateKind.DIAGNOSTIC,
        status: TestTemplateStatus.PUBLISHED,
        collegeId: null,
        durationMinutes: 60,
        sections: [
          {
            id: 'sec-1',
            sequence: 1,
            title: 'Quant',
            marksPerQuestion: 2,
            negativeMarks: 0.5,
            sectionTimeLimitMinutes: null,
            questionCount: 1,
            rules: [
              {
                id: 'r-1',
                topicId: mockTopicId,
                subtopicId: null,
                count: 1,
                difficultyMin: 1,
                difficultyMax: 5,
              },
            ],
            fixedQuestions: [],
          },
        ],
      });

      prisma.attemptItem.findMany.mockResolvedValue([]);
      prisma.question.findMany.mockResolvedValue([
        {
          id: mockQuestionId,
          topicId: mockTopicId,
          subtopicId: null,
          difficulty: 3,
          expectedTimeSeconds: 60,
          currentVersionId: mockVersionId,
        },
      ]);

      prisma.question.findUnique.mockResolvedValue({
        id: mockQuestionId,
        currentVersion: {
          id: mockVersionId,
          options: [
            { id: 'opt-1', key: 'A', text: 'Option 1' },
            { id: 'opt-2', key: 'B', text: 'Option 2' },
          ],
        },
      });

      prisma.attempt.create.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        collegeId: mockStudent.collegeId,
        startedAt: new Date(),
        deadlineAt: new Date(Date.now() + 3600000),
      });

      const dto: StartAttemptDto = { templateId: mockTemplateId };
      const result = await service.startAttempt(dto, mockStudent);

      expect(result.attemptId).toBe(mockAttemptId);
      expect(result.totalQuestions).toBe(1);

      // Verify zero answer key leakage contract
      expect(() => assertNoAnswerLeakage(result)).not.toThrow();
      expect(result).not.toHaveProperty('isCorrect');
      expect(result).not.toHaveProperty('explanation');
      expect(result).not.toHaveProperty('stems');
    });
  });

  describe('getQuestionAtPosition & Zero Leakage Verification', () => {
    it('returns sanitized question with shuffled options and ZERO answer key fields', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: new Date(Date.now() + 1800000), // 30 mins remaining
        template: { sections: [] },
      });

      prisma.attemptItem.findUnique.mockResolvedValue({
        id: 'item-1',
        attemptId: mockAttemptId,
        position: 1,
        sectionSeq: 1,
        questionId: mockQuestionId,
        versionId: mockVersionId,
        visited: false,
        markedForReview: false,
        selectedOptionIds: [],
        numericResponse: null,
        timeSpentMs: 0,
        optionOrder: [1, 0], // Reordered permutation
        question: { type: QuestionType.MCQ_SINGLE, difficulty: 2 },
        version: {
          stem: 'What is 2 + 2?',
          imagePath: null,
          options: [
            { id: 'opt-a', key: 'A', text: '3', sort: 1, isCorrect: false },
            { id: 'opt-b', key: 'B', text: '4', sort: 2, isCorrect: true },
          ],
        },
      });

      const question = await service.getQuestionAtPosition(mockAttemptId, 1, mockStudent);

      expect(question.position).toBe(1);
      expect(question.stem).toBe('What is 2 + 2?');
      expect(question.options).toHaveLength(2);

      // Verify option order permutation was applied (idx 1 was opt-b, idx 0 was opt-a)
      expect(question.options[0]!.id).toBe('opt-b');
      expect(question.options[1]!.id).toBe('opt-a');

      // CRITICAL CONTRACT CHECK: options must not have isCorrect or is_correct
      for (const opt of question.options) {
        expect(opt).not.toHaveProperty('isCorrect');
        expect(opt).not.toHaveProperty('is_correct');
      }

      // CRITICAL CONTRACT CHECK: root object must not have explanation or numericAnswer
      expect(question).not.toHaveProperty('explanation');
      expect(question).not.toHaveProperty('numericAnswer');

      // Comprehensive recursive contract assertion
      expect(() => assertNoAnswerLeakage(question)).not.toThrow();
    });

    it('rejects request and auto-submits if deadline has passed', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: new Date(Date.now() - 10000), // 10s past deadline (exceeds 5s grace)
        template: {
          sections: [{ sequence: 1, marksPerQuestion: 1, negativeMarks: 0, questionCount: 1 }],
        },
        items: [],
      });

      prisma.attempt.update.mockResolvedValue({
        id: mockAttemptId,
        status: AttemptStatus.AUTO_SUBMITTED,
        score: 0,
        percent: 0,
        totalMarks: 1,
        sectionScores: {},
      });

      await expect(service.getQuestionAtPosition(mockAttemptId, 1, mockStudent)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('saveAnswer', () => {
    it('saves answer response within deadline', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: new Date(Date.now() + 600000),
      });

      prisma.attemptItem.findUnique.mockResolvedValue({
        id: 'item-1',
        attemptId: mockAttemptId,
        position: 1,
        selectedOptionIds: [],
        numericResponse: null,
      });

      prisma.attemptItem.update.mockResolvedValue({
        id: 'item-1',
        position: 1,
        answeredAt: new Date(),
      });

      const dto: SaveAnswerDto = {
        selectedOptionIds: ['opt-b'],
        timeSpentMs: 45000,
        markedForReview: true,
      };

      const result = await service.saveAnswer(mockAttemptId, 1, dto, mockStudent);
      expect(result.success).toBe(true);
      expect(result.position).toBe(1);
    });

    it('rejects saving answers when server deadline (+ 5s grace) is exceeded', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        deadlineAt: new Date(Date.now() - 6000), // 6 seconds past deadline
        template: { sections: [] },
        items: [],
      });

      prisma.attempt.update.mockResolvedValue({
        id: mockAttemptId,
        status: AttemptStatus.AUTO_SUBMITTED,
      });

      const dto: SaveAnswerDto = { selectedOptionIds: ['opt-b'] };
      await expect(service.saveAnswer(mockAttemptId, 1, dto, mockStudent)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('recordEvent', () => {
    it('records event and increments integrityFlagCount on blur/fullscreen exit', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        collegeId: mockStudent.collegeId,
      });

      prisma.attemptEvent.create.mockResolvedValue({ id: 'evt-1' });
      prisma.attempt.update.mockResolvedValue({ id: mockAttemptId });

      const dto: RecordEventDto = {
        type: AttemptEventType.BLUR,
        occurredAt: new Date().toISOString(),
      };

      const res = await service.recordEvent(mockAttemptId, dto, mockStudent);
      expect(res.recorded).toBe(true);
      expect(prisma.attempt.update).toHaveBeenCalledWith({
        where: { id: mockAttemptId },
        data: { integrityFlagCount: { increment: 1 } },
      });
    });
  });

  describe('submitAttempt and finalizeAttempt lifecycle', () => {
    it('evaluates attempt with pure formulas and creates readiness snapshot', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        collegeId: mockStudent.collegeId,
        status: AttemptStatus.IN_PROGRESS,
        template: {
          sections: [
            {
              id: 'sec-1',
              sequence: 1,
              title: 'Quantitative Aptitude',
              marksPerQuestion: 2,
              negativeMarks: 0.5,
              questionCount: 1,
            },
          ],
        },
        items: [
          {
            id: 'item-1',
            sectionSeq: 1,
            position: 1,
            questionId: mockQuestionId,
            selectedOptionIds: ['opt-correct'],
            numericResponse: null,
            question: {
              id: mockQuestionId,
              type: QuestionType.MCQ_SINGLE,
              topicId: mockTopicId,
              difficulty: 3,
            },
            version: {
              options: [
                { id: 'opt-correct', isCorrect: true },
                { id: 'opt-wrong', isCorrect: false },
              ],
              numericAnswer: null,
              numericTolerance: null,
            },
          },
        ],
      });

      prisma.attemptItem.update.mockResolvedValue({});
      prisma.attempt.update.mockResolvedValue({
        id: mockAttemptId,
        status: AttemptStatus.SUBMITTED,
        score: 2,
        percent: 100,
        totalMarks: 2,
        sectionScores: {},
      });

      prisma.attemptItem.findMany.mockResolvedValue([
        {
          isCorrect: true,
          answeredAt: new Date(),
          question: { difficulty: 3 },
        },
      ]);

      prisma.studentTopicStat.upsert.mockResolvedValue({});
      prisma.studentTopicStat.findMany.mockResolvedValue([
        {
          topicId: mockTopicId,
          scoredCount: 1,
          mastery: 0.8,
          topic: {
            id: mockTopicId,
            name: 'Quantitative Aptitude',
            category: TopicCategory.APTITUDE,
          },
        },
      ]);

      prisma.attempt.findFirst.mockResolvedValue(null);
      prisma.readinessSnapshot.create.mockResolvedValue({ id: 'snap-1' });

      const result = await service.submitAttempt(mockAttemptId, mockStudent);

      expect(result.status).toBe(AttemptStatus.SUBMITTED);
      expect(result.score).toBe(2);
      expect(result.percent).toBe(100);

      // Verify mastery updated
      expect(prisma.studentTopicStat.upsert).toHaveBeenCalled();

      // Verify readiness snapshot created with exact schema fields
      expect(prisma.readinessSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: mockStudent.userId,
            formulaVersion: FORMULA_VERSION,
          }),
        }),
      );
    });
  });

  describe('getAttemptReview Security Gate', () => {
    it('strictly forbids reviewing an active IN_PROGRESS attempt', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        template: { sections: [] },
        items: [],
      });

      await expect(service.getAttemptReview(mockAttemptId, mockStudent)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows reviewing finalized attempt with questions, explanations, and scores', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.SUBMITTED,
        score: 2,
        percent: 100,
        totalMarks: 2,
        schedule: null,
        template: {
          sections: [{ sequence: 1, title: 'Quant', marksPerQuestion: 2, questionCount: 1 }],
        },
        items: [
          {
            position: 1,
            sectionSeq: 1,
            isCorrect: true,
            marksAwarded: 2,
            selectedOptionIds: ['opt-1'],
            numericResponse: null,
            timeSpentMs: 30000,
            question: {
              type: QuestionType.MCQ_SINGLE,
              difficulty: 3,
              topic: { name: 'Quant' },
            },
            version: {
              stem: 'Problem text',
              imagePath: null,
              explanation: 'Step by step derivation.',
              options: [
                { id: 'opt-1', key: 'A', text: 'Option A', isCorrect: true },
                { id: 'opt-2', key: 'B', text: 'Option B', isCorrect: false },
              ],
            },
          },
        ],
      });

      const review = await service.getAttemptReview(mockAttemptId, mockStudent);

      expect(review.status).toBe(AttemptStatus.SUBMITTED);
      expect(review.items).toHaveLength(1);
      expect(review.items[0]!.explanation).toBe('Step by step derivation.');
      expect(review.items[0]!.options[0]!.isCorrect).toBe(true);
    });
  });

  describe('getAttempt Navigation Palette Overview', () => {
    it('returns overview for question palette with ZERO question text or answer keys leaked', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: mockAttemptId,
        studentId: mockStudent.userId,
        status: AttemptStatus.IN_PROGRESS,
        templateId: mockTemplateId,
        deadlineAt: new Date(Date.now() + 1800000),
        startedAt: new Date(),
        integrityFlagCount: 0,
        template: {
          title: 'Full Length Diagnostic',
          durationMinutes: 60,
          sections: [
            {
              sequence: 1,
              title: 'Aptitude',
              questionCount: 1,
              marksPerQuestion: 2,
              sectionTimeLimitMinutes: null,
            },
          ],
        },
        items: [
          {
            position: 1,
            sectionSeq: 1,
            visited: true,
            markedForReview: false,
            selectedOptionIds: ['opt-1'],
            numericResponse: null,
          },
        ],
      });

      const attemptSummary = await service.getAttempt(mockAttemptId, mockStudent);

      expect(attemptSummary.attemptId).toBe(mockAttemptId);
      expect(attemptSummary.items[0]!.isAnswered).toBe(true);

      // Verify zero leakage assertion passes on entire overview payload
      expect(() => assertNoAnswerLeakage(attemptSummary)).not.toThrow();
    });
  });
});
