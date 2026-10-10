import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MeController } from './auth/me.controller';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('Canonical Routes vs Duplicate Routes', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController, MeController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
            userProfile: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'test-user-id',
                email: 'test@apex.edu',
                fullName: 'Test User',
                role: 'STUDENT',
                status: 'ACTIVE',
                collegeId: null,
                college: null,
                consents: [],
                studentProfile: null,
              }),
            },
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'test-user-id', role: 'STUDENT', email: 'test@apex.edu' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address.port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('canonical /api/v1/health responds with 200', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('legacy /health returns 404', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('Cannot GET /health');
  });

  it('duplicate /api/v1/api/v1/health returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/api/v1/health`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('Cannot GET /api/v1/api/v1/health');
  });

  it('legacy /auth/me returns 404', async () => {
    const res = await fetch(`${baseUrl}/auth/me`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('Cannot GET /auth/me');
  });

  it('duplicate /api/v1/auth/me returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('Cannot GET /api/v1/auth/me');
  });

  it('canonical /api/v1/me is reachable and returns 200', async () => {
    const res = await fetch(`${baseUrl}/api/v1/me`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; email: string };
    expect(body.success).toBe(true);
    expect(body.email).toBe('test@apex.edu');
  });
});
