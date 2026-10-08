import { ConflictException, NotFoundException } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CollegeStatus, UserStatus, Role } from '@campusedge/shared';

describe('CollegesService Unit Tests', () => {
  let service: CollegesService;
  let mockPrisma: Partial<PrismaService>;
  let mockJwtStrategy: Partial<JwtStrategy>;

  const collegeIdA = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    mockJwtStrategy = {
      invalidateCache: jest.fn(),
    };

    mockPrisma = {
      college: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      } as unknown as PrismaService['college'],
      branch: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      } as unknown as PrismaService['branch'],
      userProfile: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      } as unknown as PrismaService['userProfile'],
      studentProfile: {
        groupBy: jest.fn(),
      } as unknown as PrismaService['studentProfile'],
    };

    service = new CollegesService(mockPrisma as PrismaService, mockJwtStrategy as JwtStrategy);
  });

  describe('Public College Discovery', () => {
    it('should query only ACTIVE colleges', async () => {
      (mockPrisma.college!.findMany as jest.Mock).mockResolvedValue([
        { id: collegeIdA, name: 'Apex Institute', status: CollegeStatus.ACTIVE },
      ]);

      const res = await service.searchPublicColleges('Apex');
      expect(res).toHaveLength(1);
      expect(mockPrisma.college!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CollegeStatus.ACTIVE,
          }),
        }),
      );
    });
  });

  describe('Branch Management (Tenant Isolation)', () => {
    it('should create branch scoped to caller collegeId', async () => {
      (mockPrisma.branch!.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.branch!.create as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        collegeId: collegeIdA,
        name: 'Computer Science',
        code: 'CSE',
      });

      const res = await service.createBranch(collegeIdA, {
        name: 'Computer Science',
        code: 'CSE',
      });
      expect(res.collegeId).toBe(collegeIdA);
      expect(mockPrisma.branch!.create).toHaveBeenCalledWith({
        data: {
          collegeId: collegeIdA,
          name: 'Computer Science',
          code: 'CSE',
          isActive: true,
        },
      });
    });

    it('should reject duplicate branch code within same college', async () => {
      (mockPrisma.branch!.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-b',
        collegeId: collegeIdA,
        code: 'CSE',
      });

      await expect(
        service.createBranch(collegeIdA, { name: 'Comp Sci', code: 'CSE' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject updating branch belonging to another college', async () => {
      (mockPrisma.branch!.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateBranch(collegeIdA, 'branch-of-college-b', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Student Decision (Tenant Isolation)', () => {
    it('should approve student belonging to own college and invalidate cache', async () => {
      (mockPrisma.userProfile!.findFirst as jest.Mock).mockResolvedValue({
        id: 'student-1',
        collegeId: collegeIdA,
        role: Role.STUDENT,
      });
      (mockPrisma.userProfile!.update as jest.Mock).mockResolvedValue({
        id: 'student-1',
        status: UserStatus.ACTIVE,
      });

      const res = await service.decideStudent(collegeIdA, 'student-1', {
        decision: 'APPROVE',
      });
      expect(res.status).toBe(UserStatus.ACTIVE);
      expect(mockJwtStrategy.invalidateCache).toHaveBeenCalledWith('student-1');
    });

    it('should reject deciding on a student from another college', async () => {
      (mockPrisma.userProfile!.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.decideStudent(collegeIdA, 'student-of-college-b', { decision: 'APPROVE' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
