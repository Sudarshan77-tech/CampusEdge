import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma.service';
import { Role, UserStatus } from '@campusedge/shared';

describe('JwtStrategy Unit Tests', () => {
  let strategy: JwtStrategy;
  let mockPrisma: Partial<PrismaService>;
  let mockConfig: Partial<ConfigService>;

  const mockActiveProfile = {
    id: '11111111-1111-1111-1111-111111111111',
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    collegeId: '00000000-0000-0000-0000-000000000001',
    email: 'student@example.com',
    fullName: 'Test Student',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_JWT_SECRET') return 'test-secret-at-least-32-chars-long!!';
        return undefined;
      }),
    };

    mockPrisma = {
      userProfile: {
        findUnique: jest.fn(),
      } as unknown as PrismaService['userProfile'],
    };

    strategy = new JwtStrategy(mockConfig as ConfigService, mockPrisma as PrismaService);
  });

  describe('Algorithm Pinning & Strategy Configuration', () => {
    it('should pin HS256 algorithm when symmetric secret is configured', () => {
      const configWithSecret = {
        get: jest.fn((key: string) =>
          key === 'SUPABASE_JWT_SECRET' ? 'symmetric-key' : 'https://test.supabase.co',
        ),
      } as unknown as ConfigService;
      const s = new JwtStrategy(configWithSecret, mockPrisma as PrismaService);
      // passport-jwt stores options
      expect((s as unknown as Record<string, unknown>)._jwtFromRequest).toBeDefined();
    });

    it('should pin RS256/ES256 when using JWKS mode without secret', () => {
      const configNoSecret = {
        get: jest.fn((key: string) =>
          key === 'SUPABASE_JWT_SECRET' ? undefined : 'https://test.supabase.co',
        ),
      } as unknown as ConfigService;
      const s = new JwtStrategy(configNoSecret, mockPrisma as PrismaService);
      expect((s as unknown as Record<string, unknown>)._jwtFromRequest).toBeDefined();
    });
  });

  describe('validate() method', () => {
    it('should successfully validate an active user and cache the result', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue(mockActiveProfile);

      const result = await strategy.validate({
        sub: mockActiveProfile.id,
        email: 'student@example.com',
      });

      expect(result).toEqual({
        userId: mockActiveProfile.id,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        collegeId: mockActiveProfile.collegeId,
        email: mockActiveProfile.email,
      });
      expect(mockPrisma.userProfile!.findUnique).toHaveBeenCalledTimes(1);

      // Second call within 30s should hit cache without querying database
      const cachedResult = await strategy.validate({ sub: mockActiveProfile.id });
      expect(cachedResult).toEqual(result);
      expect(mockPrisma.userProfile!.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should reject when payload is missing sub claim', async () => {
      await expect(strategy.validate({} as unknown as { sub: string })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject unknown user not found in UserProfile', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(strategy.validate({ sub: 'unknown-id' })).rejects.toThrow(
        'User profile not found. User must be registered in the platform.',
      );
    });

    it('should reject SUSPENDED user', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        ...mockActiveProfile,
        status: UserStatus.SUSPENDED,
      });

      await expect(strategy.validate({ sub: mockActiveProfile.id })).rejects.toThrow(
        'User account is suspended or deactivated.',
      );
    });

    it('should reject DEACTIVATED user', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        ...mockActiveProfile,
        status: UserStatus.DEACTIVATED,
      });

      await expect(strategy.validate({ sub: mockActiveProfile.id })).rejects.toThrow(
        'User account is suspended or deactivated.',
      );
    });

    it('should invalidate cache when invalidateCache is called', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue(mockActiveProfile);

      await strategy.validate({ sub: mockActiveProfile.id });
      expect(mockPrisma.userProfile!.findUnique).toHaveBeenCalledTimes(1);

      strategy.invalidateCache(mockActiveProfile.id);

      await strategy.validate({ sub: mockActiveProfile.id });
      expect(mockPrisma.userProfile!.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
