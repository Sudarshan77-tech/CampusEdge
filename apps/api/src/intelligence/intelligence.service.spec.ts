import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceService } from './intelligence.service';
import { PrismaService } from '../prisma.service';
import { HISTORICAL_INTELLIGENCE_DISCLAIMER } from '@campusedge/shared';

interface MockPrisma {
  placementSeason: {
    findMany: jest.Mock;
  };
  drive: {
    findMany: jest.Mock;
  };
  company: {
    findUnique: jest.Mock;
  };
  experience: {
    findMany: jest.Mock;
  };
}

describe('IntelligenceService', () => {
  let service: IntelligenceService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      placementSeason: {
        findMany: jest.fn(),
      },
      drive: {
        findMany: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
      },
      experience: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [IntelligenceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
  });

  it('marks company as recurring recruiter if present in >= 2 of recent 3 seasons', async () => {
    prisma.placementSeason.findMany.mockResolvedValue([
      { id: 's3', label: '2024-25' },
      { id: 's2', label: '2023-24' },
      { id: 's1', label: '2022-23' },
    ]);

    prisma.drive.findMany.mockResolvedValue([
      {
        id: 'd1',
        companyId: 'comp-1',
        seasonId: 's3',
        selectedCount: 5,
        registeredCount: 50,
        company: { id: 'comp-1', name: 'Infosys', slug: 'infosys', logoUrl: null, industry: 'IT' },
        roles: [{ ctcLpaMin: 4.5, ctcLpaMax: 6.5 }],
        season: { id: 's3', label: '2024-25' },
      },
      {
        id: 'd2',
        companyId: 'comp-1',
        seasonId: 's2',
        selectedCount: 8,
        registeredCount: 70,
        company: { id: 'comp-1', name: 'Infosys', slug: 'infosys', logoUrl: null, industry: 'IT' },
        roles: [{ ctcLpaMin: 5.0, ctcLpaMax: 7.0 }],
        season: { id: 's2', label: '2023-24' },
      },
    ]);

    const result = await service.getRecruiters('col-1');

    expect(result.disclaimer).toBe(HISTORICAL_INTELLIGENCE_DISCLAIMER);
    expect(result.recruiters).toHaveLength(1);
    expect(result.recruiters[0]!.isRecurringRecruiter).toBe(true);
    expect(result.recruiters[0]!.totalOffers).toBe(13);
  });

  it('masks salary metrics when cohort size is less than 3 students', async () => {
    prisma.placementSeason.findMany.mockResolvedValue([{ id: 's1', label: '2024-25' }]);

    prisma.drive.findMany.mockResolvedValue([
      {
        id: 'd1',
        companyId: 'comp-small',
        seasonId: 's1',
        selectedCount: 2, // Cohort < 3
        registeredCount: 10,
        company: {
          id: 'comp-small',
          name: 'Boutique Labs',
          slug: 'boutique-labs',
          logoUrl: null,
          industry: 'AI',
        },
        roles: [{ ctcLpaMin: 25.0, ctcLpaMax: 30.0 }],
        season: { id: 's1', label: '2024-25' },
      },
    ]);

    const result = await service.getRecruiters('col-1');

    expect(result.recruiters[0]!.salaryMetrics.masked).toBe(true);
    expect(result.recruiters[0]!.salaryMetrics.message).toContain(
      'hidden to preserve student privacy',
    );
  });
});
