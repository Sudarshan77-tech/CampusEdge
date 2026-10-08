import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return status ok when database is reachable', async () => {
    const res = await controller.check();
    expect(res.status).toBe('ok');
    expect(res.database).toBe('connected');
    expect(res.version).toBe('0.1.0');
  });

  it('should throw ServiceUnavailableException when database query fails', async () => {
    jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('DB unreachable'));
    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
