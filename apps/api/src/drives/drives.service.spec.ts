import { Test, TestingModule } from '@nestjs/testing';
import { DrivesService } from './drives.service';
import { PrismaService } from '../prisma.service';
import { DriveStatus, DriveCategory, DriveType, JobType } from '@campusedge/shared';
import { ConflictException } from '@nestjs/common';

describe('DrivesService', () => {
  let service: DrivesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      placementSeason: {
        findFirst: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
      },
      drive: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      driveRole: {
        create: jest.fn(),
      },
      driveRoleSkill: {
        createMany: jest.fn(),
      },
      driveEligibility: {
        create: jest.fn(),
      },
      driveRound: {
        create: jest.fn(),
      },
      driveRoundTopic: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DrivesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<DrivesService>(DrivesService);
  });

  it('creates drive with nested roles and criteria in transaction', async () => {
    prisma.placementSeason.findFirst.mockResolvedValue({ id: 's1', collegeId: 'c1' });
    prisma.company.findUnique.mockResolvedValue({ id: 'comp-1', name: 'TCS' });
    prisma.drive.create.mockResolvedValue({
      id: 'd1',
      collegeId: 'c1',
      title: 'TCS Digital',
      status: DriveStatus.DRAFT,
    });
    prisma.driveRole.create.mockResolvedValue({ id: 'r1' });
    prisma.drive.findFirst.mockResolvedValue({
      id: 'd1',
      title: 'TCS Digital',
      roles: [{ id: 'r1', title: 'Developer' }],
    });

    const result = await service.create('c1', 'u1', {
      companyId: 'comp-1',
      seasonId: 's1',
      title: 'TCS Digital',
      status: DriveStatus.DRAFT,
      driveType: DriveType.ON_CAMPUS,
      category: DriveCategory.REGULAR,
      roles: [
        {
          title: 'Developer',
          jobType: JobType.FULL_TIME,
          ctcLpaMin: 7.0,
          ctcLpaMax: 7.5,
        },
      ],
    });

    expect(prisma.drive.create).toHaveBeenCalled();
    expect(prisma.driveRole.create).toHaveBeenCalled();
    expect(result.id).toBe('d1');
  });

  it('rejects invalid state transition according to state machine', async () => {
    prisma.drive.findFirst.mockResolvedValue({
      id: 'd1',
      collegeId: 'c1',
      status: DriveStatus.COMPLETED,
      isHistorical: false,
      rowVersion: 1,
      roles: [],
      eligibility: null,
      registrationDeadline: null,
      _count: { applications: 0 },
    });

    await expect(
      service.transitionStatus('d1', 'c1', {
        status: DriveStatus.REGISTRATION_OPEN,
        rowVersion: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects transition on rowVersion mismatch (optimistic concurrency)', async () => {
    prisma.drive.findFirst.mockResolvedValue({
      id: 'd1',
      collegeId: 'c1',
      status: DriveStatus.DRAFT,
      isHistorical: false,
      rowVersion: 2,
      roles: [],
      eligibility: null,
      registrationDeadline: null,
      _count: { applications: 0 },
    });

    await expect(
      service.transitionStatus('d1', 'c1', {
        status: DriveStatus.IN_PROGRESS,
        rowVersion: 1, // Stale version
      }),
    ).rejects.toThrow(ConflictException);
  });
});
