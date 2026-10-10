import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from '../prisma.service';

describe('PrismaModule Singleton', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('provides a single instance of PrismaService', () => {
    const instance1 = moduleRef.get<PrismaService>(PrismaService);
    const instance2 = moduleRef.get<PrismaService>(PrismaService);

    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
    expect(instance1).toBe(instance2);
  });
});
