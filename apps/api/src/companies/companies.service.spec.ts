import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma.service';
import { Role, CompanyStatus, UserStatus } from '@campusedge/shared';
import { ConflictException } from '@nestjs/common';

interface MockPrisma {
  company: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  drive: {
    updateMany: jest.Mock;
  };
  experience: {
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      company: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      drive: {
        updateMany: jest.fn(),
      },
      experience: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('returns existing company when exact normalized name matches', async () => {
    const existing = {
      id: 'comp-1',
      name: 'Google India',
      normalizedName: 'google india',
      status: CompanyStatus.VERIFIED,
    };
    prisma.company.findUnique.mockResolvedValue(existing);

    const result = await service.create(
      { userId: 'u1', role: Role.COLLEGE_ADMIN, status: UserStatus.ACTIVE, collegeId: 'c1' },
      { name: 'Google India' },
    );

    expect(result.isExisting).toBe(true);
    expect(result.company).toEqual(existing);
    expect(prisma.company.create).not.toHaveBeenCalled();
  });

  it('creates new company with PENDING_REVIEW if created by college admin', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    prisma.company.findMany.mockResolvedValue([]);
    prisma.company.create.mockResolvedValue({
      id: 'comp-2',
      name: 'Acme Corp',
      status: CompanyStatus.PENDING_REVIEW,
      createdByCollegeId: 'c1',
    });

    const result = await service.create(
      { userId: 'u1', role: Role.COLLEGE_ADMIN, status: UserStatus.ACTIVE, collegeId: 'c1' },
      { name: 'Acme Corp' },
    );

    expect(result.isExisting).toBe(false);
    expect(prisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Acme Corp',
          status: CompanyStatus.PENDING_REVIEW,
          createdByCollegeId: 'c1',
        }),
      }),
    );
  });

  it('throws error when company name has no alphanumeric characters', async () => {
    await expect(
      service.create(
        { userId: 'u1', role: Role.COLLEGE_ADMIN, status: UserStatus.ACTIVE, collegeId: 'c1' },
        { name: '---' },
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('merges source company into target company transactionally', async () => {
    prisma.company.findUnique
      .mockResolvedValueOnce({ id: 'src-1', name: 'Ggle' })
      .mockResolvedValueOnce({ id: 'tgt-1', name: 'Google' });
    prisma.drive.updateMany.mockResolvedValue({ count: 5 });
    prisma.experience.updateMany.mockResolvedValue({ count: 3 });
    prisma.company.update.mockResolvedValue({ id: 'src-1', status: CompanyStatus.MERGED });

    const result = await service.merge('src-1', { targetCompanyId: 'tgt-1' });

    expect(result.success).toBe(true);
    expect(prisma.drive.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'src-1' },
      data: { companyId: 'tgt-1' },
    });
    expect(prisma.experience.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'src-1' },
      data: { companyId: 'tgt-1' },
    });
  });
});
