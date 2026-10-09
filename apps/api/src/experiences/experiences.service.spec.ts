import { Test, TestingModule } from '@nestjs/testing';
import { ExperiencesService } from './experiences.service';
import { PrismaService } from '../prisma.service';
import { ExperienceStatus, Role, ExperienceOutcome, UserStatus } from '@campusedge/shared';

interface MockPrisma {
  experience: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  experienceReport: {
    create: jest.Mock;
    count: jest.Mock;
  };
  company: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('ExperiencesService', () => {
  let service: ExperiencesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      experience: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      experienceReport: {
        create: jest.fn(),
        count: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExperiencesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ExperiencesService>(ExperiencesService);
  });

  it('masks student details when experience is anonymous and viewer is a peer student', async () => {
    const rawExperience = {
      id: 'exp-1',
      authorId: 'student-author-id',
      collegeId: 'col-1',
      isAnonymous: true,
      status: ExperienceStatus.APPROVED,
      roleTitle: 'Software Engineer',
      outcome: ExperienceOutcome.SELECTED,
      author: {
        userId: 'student-author-id',
        userProfile: { fullName: 'Secret Student', email: 'secret@college.edu' },
        branch: { name: 'Computer Science' },
        batchYear: 2025,
      },
      rounds: [],
    };

    prisma.experience.findFirst.mockResolvedValue(rawExperience);

    const result = await service.findById('exp-1', {
      userId: 'different-student-id',
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      collegeId: 'col-1',
    });

    expect(result.author?.userProfile?.fullName).toBe('Anonymous Senior');
    expect(result.author?.branch?.name).toBe('Computer Science');
  });

  it('automatically flags experience to UNDER_REVIEW when 3rd report is submitted', async () => {
    prisma.experience.findFirst.mockResolvedValue({
      id: 'exp-1',
      collegeId: 'col-1',
      status: ExperienceStatus.APPROVED,
      rowVersion: 1,
    });
    prisma.experienceReport.create.mockResolvedValue({ id: 'rep-3' });
    prisma.experienceReport.count.mockResolvedValue(3); // 3rd report
    prisma.experience.update.mockResolvedValue({
      id: 'exp-1',
      status: ExperienceStatus.UNDER_REVIEW,
    });

    const result = await service.report(
      'exp-1',
      { userId: 'u3', collegeId: 'col-1', role: Role.STUDENT, status: UserStatus.ACTIVE },
      { reason: 'Contains NDA violating technical questions' },
    );

    expect(result.status).toBe(ExperienceStatus.UNDER_REVIEW);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ExperienceStatus.UNDER_REVIEW }),
      }),
    );
  });

  it('allows TPO to approve an experience in moderation queue', async () => {
    prisma.experience.findFirst.mockResolvedValue({
      id: 'exp-1',
      collegeId: 'col-1',
      status: ExperienceStatus.SUBMITTED,
    });
    prisma.experience.update.mockResolvedValue({
      id: 'exp-1',
      status: ExperienceStatus.APPROVED,
      reviewerId: 'admin-1',
    });

    const result = await service.moderate('exp-1', 'col-1', 'admin-1', {
      decision: 'APPROVE',
    });

    expect(result.status).toBe(ExperienceStatus.APPROVED);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ExperienceStatus.APPROVED,
          reviewerId: 'admin-1',
        }),
      }),
    );
  });
});
