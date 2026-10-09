// QuestionsService unit tests with Jest
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma.service';
import {
  Role,
  ContentScope,
  QuestionStatus,
  QuestionType,
  QuestionSource,
  CreateQuestionDto,
  CurrentUser,
  UserStatus,
  QuestionReportReason,
} from '@campusedge/shared';

interface MockPrisma {
  question: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  questionVersion: {
    create: jest.Mock;
    findFirst: jest.Mock;
  };
  questionOption: {
    createMany: jest.Mock;
  };
  questionStat: {
    create: jest.Mock;
  };
  questionReport: {
    upsert: jest.Mock;
  };
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
}

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: MockPrisma;

  const mockAdminUser: CurrentUser = {
    userId: '99999999-9999-9999-9999-999999999999',
    email: 'superadmin@campusedge.internal',
    role: Role.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    collegeId: null,
  };

  const mockCollegeAdminUser: CurrentUser = {
    userId: '88888888-8888-8888-8888-888888888888',
    email: 'placement.admin@apex.edu',
    role: Role.COLLEGE_ADMIN,
    status: UserStatus.ACTIVE,
    collegeId: '00000000-0000-0000-0000-000000000001',
  };

  const mockStudentUser: CurrentUser = {
    userId: '77777777-7777-7777-7777-777777777777',
    email: 'student.demo@apex.edu',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    collegeId: '00000000-0000-0000-0000-000000000001',
  };

  beforeEach(() => {
    prisma = {
      question: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      questionVersion: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      questionOption: {
        createMany: jest.fn(),
      },
      questionStat: {
        create: jest.fn(),
      },
      questionReport: {
        upsert: jest.fn(),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(prisma)),
    };

    service = new QuestionsService(prisma as unknown as PrismaService);
  });

  it('creates an initial question with version 1 and options for Super Admin', async () => {
    const dto: CreateQuestionDto = {
      scope: ContentScope.GLOBAL,
      topicId: '11111111-1111-1111-1111-111111111111',
      type: QuestionType.MCQ_SINGLE,
      difficulty: 3,
      stem: 'What is the time complexity of QuickSelect average case?',
      explanation: 'Average case time complexity is O(N) by solving the recurrence relation.',
      numericTolerance: 0,
      expectedTimeSeconds: 60,
      tags: ['algorithms', 'complexity'],
      source: QuestionSource.AUTHORED,
      options: [
        { key: 'A', text: 'O(N)', isCorrect: true, sort: 0 },
        { key: 'B', text: 'O(N log N)', isCorrect: false, sort: 1 },
      ],
    };

    prisma.question.findFirst.mockResolvedValue(null);
    prisma.question.create.mockResolvedValue({ id: 'q-1', ...dto });
    prisma.questionVersion.create.mockResolvedValue({ id: 'v-1', version: 1 });
    prisma.question.findUnique.mockResolvedValue({
      id: 'q-1',
      status: QuestionStatus.APPROVED,
      currentVersion: { id: 'v-1', version: 1, stem: dto.stem },
    });

    const result = await service.create(dto, mockAdminUser);
    expect(result).toBeDefined();
    expect(prisma.question.create).toHaveBeenCalled();
    expect(prisma.questionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 1,
          stem: dto.stem,
          createdBy: mockAdminUser.userId,
        }),
      }),
    );
  });

  it('rejects duplicate questions with identical stem text hash', async () => {
    const dto: CreateQuestionDto = {
      scope: ContentScope.GLOBAL,
      topicId: '11111111-1111-1111-1111-111111111111',
      type: QuestionType.MCQ_SINGLE,
      difficulty: 3,
      stem: 'Existing question stem that already exists in database',
      explanation: 'Detailed explanation here.',
      numericTolerance: 0,
      expectedTimeSeconds: 60,
      tags: [],
      source: QuestionSource.AUTHORED,
      options: [
        { key: 'A', text: 'Opt A', isCorrect: true, sort: 0 },
        { key: 'B', text: 'Opt B', isCorrect: false, sort: 1 },
      ],
    };

    prisma.question.findFirst.mockResolvedValue({
      id: 'existing-q-id',
      currentVersion: { stem: dto.stem },
    });

    await expect(service.create(dto, mockAdminUser)).rejects.toThrow(/Duplicate Question Refusal/);
  });

  it('enforces college tenant scoping for College Admin', async () => {
    const dto: CreateQuestionDto = {
      scope: ContentScope.GLOBAL, // College Admin cannot author GLOBAL
      topicId: '11111111-1111-1111-1111-111111111111',
      type: QuestionType.MCQ_SINGLE,
      difficulty: 2,
      stem: 'College specific placement test question stem?',
      explanation: 'College specific explanation.',
      numericTolerance: 0,
      expectedTimeSeconds: 60,
      tags: [],
      source: QuestionSource.AUTHORED,
      options: [
        { key: 'A', text: 'Option 1', isCorrect: true, sort: 0 },
        { key: 'B', text: 'Option 2', isCorrect: false, sort: 1 },
      ],
    };

    prisma.question.findFirst.mockResolvedValue(null);
    prisma.question.create.mockResolvedValue({ id: 'q-college-1' });
    prisma.questionVersion.create.mockResolvedValue({ id: 'v-1' });
    prisma.question.findUnique.mockResolvedValue({ id: 'q-college-1' });

    await service.create(dto, mockCollegeAdminUser);

    // Verified that scope was forced to COLLEGE and collegeId forced to user's college
    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scope: ContentScope.COLLEGE,
          collegeId: mockCollegeAdminUser.collegeId,
        }),
      }),
    );
  });

  it('updates a question by creating a new immutable version without mutating old version', async () => {
    prisma.question.findUnique.mockResolvedValue({
      id: 'q-1',
      scope: ContentScope.GLOBAL,
      collegeId: null,
      currentVersionId: 'v-1',
      currentVersion: { version: 1, stem: 'Old stem', explanation: 'Old explanation' },
    });

    prisma.questionVersion.findFirst.mockResolvedValue({
      id: 'v-1',
      version: 1,
    });

    prisma.questionVersion.create.mockResolvedValue({
      id: 'v-2',
      version: 2,
    });

    prisma.question.update.mockResolvedValue({
      id: 'q-1',
      currentVersionId: 'v-2',
    });

    await service.update('q-1', { stem: 'Updated new stem with revised phrasing?' }, mockAdminUser);

    expect(prisma.questionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questionId: 'q-1',
          version: 2,
          stem: 'Updated new stem with revised phrasing?',
        }),
      }),
    );
    expect(prisma.question.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1' },
        data: expect.objectContaining({ currentVersionId: 'v-2' }),
      }),
    );
  });

  it('allows student to report a question and registers report in question_reports', async () => {
    prisma.question.findUnique.mockResolvedValue({ id: 'q-report-target' });
    prisma.questionReport.upsert.mockResolvedValue({ id: 'rep-1' });

    const res = await service.report(
      'q-report-target',
      {
        reason: QuestionReportReason.WRONG_ANSWER,
        note: 'The correct option should be C instead of A.',
      },
      mockStudentUser,
    );

    expect(res.success).toBe(true);
    expect(prisma.questionReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          questionId_reporterId: {
            questionId: 'q-report-target',
            reporterId: mockStudentUser.userId,
          },
        },
      }),
    );
  });

  it('approves a question via review gate', async () => {
    prisma.question.findUnique.mockResolvedValue({ id: 'q-to-approve' });
    prisma.question.update.mockResolvedValue({
      id: 'q-to-approve',
      status: QuestionStatus.APPROVED,
    });

    await service.approve('q-to-approve', mockAdminUser);

    expect(prisma.question.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-to-approve' },
        data: expect.objectContaining({
          status: QuestionStatus.APPROVED,
          reviewedBy: mockAdminUser.userId,
        }),
      }),
    );
  });
});
