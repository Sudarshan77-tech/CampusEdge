import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../auth/jwt.strategy';
import { InvitationStatus, CollegeStatus, UserStatus } from '@campusedge/shared';

describe('AdminService Unit Tests', () => {
  let service: AdminService;
  let mockPrisma: Partial<PrismaService>;
  let mockConfig: Partial<ConfigService>;
  let mockJwtStrategy: Partial<JwtStrategy>;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_SECRET_KEY') return 'test-service-key-dummy';
        return undefined;
      }),
    };

    mockPrisma = {
      college: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      } as unknown as PrismaService['college'],
      invitation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      } as unknown as PrismaService['invitation'],
      userProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      } as unknown as PrismaService['userProfile'],
    };

    mockJwtStrategy = {
      invalidateCache: jest.fn(),
    };

    service = new AdminService(
      mockPrisma as PrismaService,
      mockConfig as ConfigService,
      mockJwtStrategy as JwtStrategy,
    );
  });

  describe('Invitation Flow', () => {
    const collegeId = '00000000-0000-0000-0000-000000000001';
    const email = 'newadmin@apex.edu';

    it('should create an invitation with 7-day expiration', async () => {
      (mockPrisma.college!.findUnique as jest.Mock).mockResolvedValue({
        id: collegeId,
        name: 'Apex Institute',
        status: CollegeStatus.ACTIVE,
      });
      (mockPrisma.invitation!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.invitation!.create as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        collegeId,
        email,
        status: InvitationStatus.PENDING,
      });

      const result = await service.inviteCollegeAdmin(collegeId, email, 'superadmin-id');
      expect(result.id).toBe('inv-1');
      expect(mockPrisma.invitation!.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            collegeId,
            email,
            status: InvitationStatus.PENDING,
          }),
        }),
      );
    });

    it('should reject invitation if a pending invite already exists', async () => {
      (mockPrisma.college!.findUnique as jest.Mock).mockResolvedValue({ id: collegeId });
      (mockPrisma.invitation!.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-inv',
        status: InvitationStatus.PENDING,
      });

      await expect(service.inviteCollegeAdmin(collegeId, email, 'superadmin-id')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should revoke a pending invitation', async () => {
      (mockPrisma.invitation!.findFirst as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        collegeId,
        status: InvitationStatus.PENDING,
      });
      (mockPrisma.invitation!.update as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        status: InvitationStatus.REVOKED,
      });

      const res = await service.revokeInvitation(collegeId, 'inv-1');
      expect(res.status).toBe(InvitationStatus.REVOKED);
    });

    it('should throw BadRequestException when revoking non-pending invitation', async () => {
      (mockPrisma.invitation!.findFirst as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        collegeId,
        status: InvitationStatus.ACCEPTED,
      });

      await expect(service.revokeInvitation(collegeId, 'inv-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('User Status Management', () => {
    it('should update user status and invalidate JWT cache', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        status: UserStatus.ACTIVE,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        status: UserStatus.SUSPENDED,
      });

      const updated = await service.updateUserStatus('user-1', { status: UserStatus.SUSPENDED });
      expect(updated.status).toBe(UserStatus.SUSPENDED);
      expect(mockJwtStrategy.invalidateCache).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.updateUserStatus('unknown-user', { status: UserStatus.SUSPENDED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
