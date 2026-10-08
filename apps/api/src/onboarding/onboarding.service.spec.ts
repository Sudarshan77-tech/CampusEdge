import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CollegeStatus, UserStatus, Role, Degree, InvitationStatus } from '@campusedge/shared';

describe('OnboardingService Unit Tests', () => {
  let service: OnboardingService;
  let mockPrisma: Partial<PrismaService>;
  let mockConfig: Partial<ConfigService>;
  let mockJwtStrategy: Partial<JwtStrategy>;

  const studentUser = {
    userId: '11111111-1111-1111-1111-111111111111',
    role: Role.STUDENT,
    status: UserStatus.ONBOARDING,
    collegeId: null,
    email: 'student@apex.edu',
  };

  const collegeId = '00000000-0000-0000-0000-000000000001';
  const branchId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_SECRET_KEY') return 'test-key';
        return undefined;
      }),
    };

    mockJwtStrategy = {
      invalidateCache: jest.fn(),
    };

    mockPrisma = {
      userProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      } as unknown as PrismaService['userProfile'],
      college: {
        findUnique: jest.fn(),
      } as unknown as PrismaService['college'],
      branch: {
        findUnique: jest.fn(),
      } as unknown as PrismaService['branch'],
      consentRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
      } as unknown as PrismaService['consentRecord'],
      studentProfile: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      } as unknown as PrismaService['studentProfile'],
      invitation: {
        findFirst: jest.fn(),
        update: jest.fn(),
      } as unknown as PrismaService['invitation'],
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb(mockPrisma),
      ) as unknown as PrismaService['$transaction'],
    };

    service = new OnboardingService(
      mockPrisma as PrismaService,
      mockConfig as ConfigService,
      mockJwtStrategy as JwtStrategy,
    );
  });

  describe('chooseCollege()', () => {
    it('should set collegeId when valid and not previously selected', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        collegeId: null,
      });
      (mockPrisma.college!.findUnique as jest.Mock).mockResolvedValue({
        id: collegeId,
        status: CollegeStatus.ACTIVE,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        collegeId,
      });

      const res = await service.chooseCollege(studentUser, { collegeId });
      expect(res.collegeId).toBe(collegeId);
      expect(mockJwtStrategy.invalidateCache).toHaveBeenCalledWith(studentUser.userId);
    });

    it('should reject changing college if collegeId is already set', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        collegeId: 'already-selected-id',
      });

      await expect(service.chooseCollege(studentUser, { collegeId })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject selecting an inactive college', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        collegeId: null,
      });
      (mockPrisma.college!.findUnique as jest.Mock).mockResolvedValue({
        id: collegeId,
        status: CollegeStatus.PENDING,
      });

      await expect(service.chooseCollege(studentUser, { collegeId })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('saveStudentProfile() - Activation Rule', () => {
    const validDto = {
      branchId,
      degree: Degree.BTECH,
      batchYear: 2026,
      cgpa: 8.5,
      activeBacklogs: 0,
      enrollmentNumber: 'APEX-101',
      targetRole: 'Software Engineer',
    };

    it('should automatically set status to ACTIVE when email domain matches college domain', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        email: 'student@apex.edu',
        collegeId,
        college: {
          id: collegeId,
          emailDomains: ['apex.edu'],
          requireStudentApproval: false,
        },
      });
      (mockPrisma.branch!.findUnique as jest.Mock).mockResolvedValue({
        id: branchId,
        collegeId,
        isActive: true,
      });
      (mockPrisma.studentProfile!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.studentProfile!.upsert as jest.Mock).mockResolvedValue({
        userId: studentUser.userId,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        status: UserStatus.ACTIVE,
      });

      const result = await service.saveStudentProfile(studentUser, validDto);
      expect(result.autoActivated).toBe(true);
      expect(result.userStatus).toBe(UserStatus.ACTIVE);
      expect(mockPrisma.userProfile!.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: UserStatus.ACTIVE },
        }),
      );
    });

    it('should set status to PENDING_APPROVAL when email domain does not match', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        email: 'student@gmail.com',
        collegeId,
        college: {
          id: collegeId,
          emailDomains: ['apex.edu'],
          requireStudentApproval: false,
        },
      });
      (mockPrisma.branch!.findUnique as jest.Mock).mockResolvedValue({
        id: branchId,
        collegeId,
        isActive: true,
      });
      (mockPrisma.studentProfile!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.studentProfile!.upsert as jest.Mock).mockResolvedValue({
        userId: studentUser.userId,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        status: UserStatus.PENDING_APPROVAL,
      });

      const result = await service.saveStudentProfile(studentUser, validDto);
      expect(result.autoActivated).toBe(false);
      expect(result.userStatus).toBe(UserStatus.PENDING_APPROVAL);
    });

    it('should set status to PENDING_APPROVAL if college requires approval even with matching domain', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        email: 'student@apex.edu',
        collegeId,
        college: {
          id: collegeId,
          emailDomains: ['apex.edu'],
          requireStudentApproval: true,
        },
      });
      (mockPrisma.branch!.findUnique as jest.Mock).mockResolvedValue({
        id: branchId,
        collegeId,
        isActive: true,
      });
      (mockPrisma.studentProfile!.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.studentProfile!.upsert as jest.Mock).mockResolvedValue({
        userId: studentUser.userId,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        status: UserStatus.PENDING_APPROVAL,
      });

      const result = await service.saveStudentProfile(studentUser, validDto);
      expect(result.autoActivated).toBe(false);
      expect(result.userStatus).toBe(UserStatus.PENDING_APPROVAL);
    });

    it('should reject branch if it does not belong to user selected college', async () => {
      (mockPrisma.userProfile!.findUnique as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        email: 'student@apex.edu',
        collegeId,
        college: { id: collegeId },
      });
      (mockPrisma.branch!.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.saveStudentProfile(studentUser, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('acceptInvitation()', () => {
    it('should accept pending invitation and elevate user role to COLLEGE_ADMIN', async () => {
      (mockPrisma.invitation!.findFirst as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        collegeId,
        status: InvitationStatus.PENDING,
      });
      (mockPrisma.invitation!.update as jest.Mock).mockResolvedValue({
        status: InvitationStatus.ACCEPTED,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        id: studentUser.userId,
        role: Role.COLLEGE_ADMIN,
        collegeId,
        status: UserStatus.ACTIVE,
      });

      const elevated = await service.acceptInvitation(studentUser);
      expect(elevated.role).toBe(Role.COLLEGE_ADMIN);
      expect(elevated.collegeId).toBe(collegeId);
      expect(mockJwtStrategy.invalidateCache).toHaveBeenCalledWith(studentUser.userId);
    });

    it('should throw NotFoundException if no pending unexpired invitation exists', async () => {
      (mockPrisma.invitation!.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.acceptInvitation(studentUser)).rejects.toThrow(NotFoundException);
    });
  });
});
