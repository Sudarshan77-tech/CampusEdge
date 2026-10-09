import { Test, TestingModule } from '@nestjs/testing';
import { ImportsService } from './imports.service';
import { PrismaService } from '../prisma.service';
import { ImportJobType } from '@campusedge/shared';

interface MockPrisma {
  company: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  placementSeason: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  drive: {
    create: jest.Mock;
  };
  driveRole: {
    create: jest.Mock;
  };
  importJob: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  importRowError: {
    createMany: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      company: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      placementSeason: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      drive: {
        create: jest.fn(),
      },
      driveRole: {
        create: jest.fn(),
      },
      importJob: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      importRowError: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
  });

  it('neutralizes formula injection characters (=, +, -, @) during CSV import', async () => {
    const csvContent =
      'company_name,season_label,title,role_title,ctc_min_lpa,ctc_max_lpa\n' +
      '=CMD|"" /C calc"!A0,2024-25,+Malicious Title,@Engineer,10,12';

    prisma.importJob.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      id: 'job-1',
      ...data,
    }));

    const result = await service.uploadAndParse(
      'col-1',
      'user-1',
      {
        originalname: 'test.csv',
        size: Buffer.byteLength(csvContent),
        buffer: Buffer.from(csvContent),
      },
      ImportJobType.HISTORICAL_DRIVES,
    );

    expect(result.validRows).toBe(1);
    expect(result.sampleValidRows[0]!.company_name).toBe('\'=CMD|"" /C calc"!A0');
    expect(result.sampleValidRows[0]!.title).toBe("'+Malicious Title");
    expect(result.sampleValidRows[0]!.role_title).toBe("'@Engineer");
  });

  it('flags invalid rows when ctc_min_lpa exceeds ctc_max_lpa', async () => {
    const csvContent =
      'company_name,season_label,title,role_title,ctc_min_lpa,ctc_max_lpa\n' +
      'Google,2024-25,Campus Drive,SWE,15,10'; // min > max

    prisma.importJob.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      id: 'job-1',
      ...data,
    }));

    const result = await service.uploadAndParse(
      'col-1',
      'user-1',
      {
        originalname: 'invalid.csv',
        size: Buffer.byteLength(csvContent),
        buffer: Buffer.from(csvContent),
      },
      ImportJobType.HISTORICAL_DRIVES,
    );

    expect(result.validRows).toBe(0);
    expect(result.errorCount).toBe(1);
    expect(prisma.importRowError.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          column: 'ctc_min_lpa',
          message: expect.stringContaining('cannot exceed ctc_max_lpa'),
        }),
      ]),
    });
  });

  it('exports formatted and sanitized errors CSV', async () => {
    prisma.importJob.findFirst.mockResolvedValue({ id: 'job-1', collegeId: 'col-1' });
    prisma.importRowError.findMany.mockResolvedValue([
      { rowNumber: 2, column: 'ctc_min_lpa', message: '=1+1 calculation invalid' },
    ]);

    const { fileName, csvContent } = await service.getErrorsCsv('job-1', 'col-1');

    expect(fileName).toContain('import-errors-job-1');
    expect(csvContent).toContain('Row,Column,Error Message');
    // Notice formula in message is neutralized:
    expect(csvContent).toContain('2,"ctc_min_lpa","\'=1+1 calculation invalid"');
  });
});
