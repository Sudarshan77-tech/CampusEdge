import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma.service';
import { ApplicationStatus, ConsentType, DriveStatus } from '@campusedge/shared';
import { ConflictException } from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      drive: {
        findFirst: jest.fn(),
      },
      studentProfile: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      college: {
        findUnique: jest.fn(),
      },
      driveApplication: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        upsert: jest.fn().mockResolvedValue({
          id: 'app-1',
          driveId: 'd1',
          studentId: 'u1',
          status: ApplicationStatus.REGISTERED,
        }),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      consentRecord: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('records consent and creates application when student is eligible', async () => {
    prisma.drive.findFirst.mockResolvedValue({
      id: 'd1',
      collegeId: 'c1',
      status: DriveStatus.REGISTRATION_OPEN,
      registrationDeadline: new Date(Date.now() + 86400000), // tomorrow
      eligibility: null,
    });
    prisma.studentProfile.findUnique.mockResolvedValue({
      userId: 'u1',
      collegeId: 'c1',
      cgpa: 8.5,
      activeBacklogs: 0,
      userProfile: { status: 'ACTIVE' },
      college: { allowMultipleOffers: true },
    });
    prisma.college.findUnique.mockResolvedValue({
      id: 'c1',
      allowMultipleOffers: true,
    });
    prisma.driveApplication.findUnique.mockResolvedValue(null);
    prisma.driveApplication.create.mockResolvedValue({
      id: 'app-1',
      driveId: 'd1',
      studentId: 'u1',
      status: ApplicationStatus.REGISTERED,
    });

    const result = await service.apply(
      { userId: 'u1', collegeId: 'c1', role: 'STUDENT' as any, status: 'ACTIVE' as any },
      'd1',
      { consentGiven: true, policyVersion: '1.0' },
    );

    expect(result.id).toBe('app-1');
    expect(prisma.consentRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        consentType: ConsentType.PLACEMENT_SHARING,
      }),
    });
  });

  it('rejects duplicate application', async () => {
    prisma.drive.findFirst.mockResolvedValue({
      id: 'd1',
      collegeId: 'c1',
      status: DriveStatus.REGISTRATION_OPEN,
      registrationDeadline: new Date(Date.now() + 86400000),
    });
    prisma.studentProfile.findUnique.mockResolvedValue({
      userId: 'u1',
      collegeId: 'c1',
      cgpa: 8.0,
      activeBacklogs: 0,
      userProfile: { status: 'ACTIVE' },
      college: { allowMultipleOffers: true },
    });
    prisma.college.findUnique.mockResolvedValue({ id: 'c1', allowMultipleOffers: true });
    prisma.driveApplication.findUnique.mockResolvedValue({ id: 'existing-app' });

    await expect(
      service.apply(
        { userId: 'u1', collegeId: 'c1', role: 'STUDENT' as any, status: 'ACTIVE' as any },
        'd1',
        { consentGiven: true, policyVersion: '1.0' },
      ),
    ).rejects.toThrow(ConflictException);
  });
});
