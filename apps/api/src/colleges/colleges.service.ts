import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CollegeStatus,
  UpdateCollegeSettingsDto,
  CreateBranchDto,
  UpdateBranchDto,
  StudentDecisionDto,
  UserStatus,
  Role,
} from '@campusedge/shared';
import { JwtStrategy } from '../auth/jwt.strategy';

@Injectable()
export class CollegesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtStrategy: JwtStrategy,
  ) {}

  // --- Public Discovery ---

  async searchPublicColleges(query?: string) {
    const where = {
      status: CollegeStatus.ACTIVE,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { city: { contains: query, mode: 'insensitive' as const } },
          { state: { contains: query, mode: 'insensitive' as const } },
          { slug: { contains: query, mode: 'insensitive' as const } },
        ],
      }),
    };

    return this.prisma.college.findMany({
      where,
      take: 20,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        branches: {
          where: { isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  // --- Own College Settings (College Admin) ---

  async getMyCollege(collegeId: string) {
    const college = await this.prisma.college.findUnique({
      where: { id: collegeId },
      include: {
        branches: { where: { isActive: true } },
        _count: {
          select: { studentProfiles: true, userProfiles: true },
        },
      },
    });
    if (!college) throw new NotFoundException('College not found');
    return college;
  }

  async updateMyCollegeSettings(collegeId: string, dto: UpdateCollegeSettingsDto) {
    await this.getMyCollege(collegeId);

    return this.prisma.college.update({
      where: { id: collegeId },
      data: {
        ...(dto.emailDomains && { emailDomains: dto.emailDomains }),
        ...(dto.requireStudentApproval !== undefined && {
          requireStudentApproval: dto.requireStudentApproval,
        }),
        ...(dto.allowMultipleOffers !== undefined && {
          allowMultipleOffers: dto.allowMultipleOffers,
        }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
      },
    });
  }

  // --- Branches CRUD ---

  async listBranches(collegeId: string) {
    return this.prisma.branch.findMany({
      where: { collegeId },
      orderBy: { code: 'asc' },
    });
  }

  async createBranch(collegeId: string, dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: {
        collegeId_code: {
          collegeId,
          code: dto.code.toUpperCase().trim(),
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Branch code "${dto.code}" already exists in this college`);
    }

    return this.prisma.branch.create({
      data: {
        collegeId,
        name: dto.name,
        code: dto.code.toUpperCase().trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBranch(collegeId: string, branchId: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, collegeId },
    });
    if (!branch) throw new NotFoundException('Branch not found in this college');

    if (dto.code && dto.code !== branch.code) {
      const existing = await this.prisma.branch.findUnique({
        where: {
          collegeId_code: {
            collegeId,
            code: dto.code.toUpperCase().trim(),
          },
        },
      });
      if (existing) {
        throw new ConflictException(`Branch code "${dto.code}" already in use`);
      }
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code.toUpperCase().trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deactivateBranch(collegeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, collegeId },
    });
    if (!branch) throw new NotFoundException('Branch not found in this college');

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: false },
    });
  }

  // --- Students Management ---

  async listCollegeStudents(
    collegeId: string,
    page = 1,
    limit = 20,
    filters?: { branchId?: string; batchYear?: number; status?: UserStatus; search?: string },
  ) {
    const skip = (page - 1) * limit;

    const where = {
      collegeId,
      role: Role.STUDENT,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.branchId && {
        studentProfile: { branchId: filters.branchId },
      }),
      ...(filters?.batchYear && {
        studentProfile: { batchYear: filters.batchYear },
      }),
      ...(filters?.search && {
        OR: [
          { email: { contains: filters.search, mode: 'insensitive' as const } },
          { fullName: { contains: filters.search, mode: 'insensitive' as const } },
          {
            studentProfile: {
              enrollmentNumber: { contains: filters.search, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.userProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          studentProfile: {
            include: {
              branch: true,
              studentSkills: { include: { skill: true } },
            },
          },
        },
      }),
      this.prisma.userProfile.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async decideStudent(collegeId: string, targetUserId: string, dto: StudentDecisionDto) {
    const student = await this.prisma.userProfile.findFirst({
      where: { id: targetUserId, collegeId, role: Role.STUDENT },
    });
    if (!student) {
      throw new NotFoundException('Student not found in your college');
    }

    let nextStatus: UserStatus;
    if (dto.decision === 'APPROVE') nextStatus = UserStatus.ACTIVE;
    else if (dto.decision === 'REJECT') nextStatus = UserStatus.DEACTIVATED;
    else if (dto.decision === 'SUSPEND') nextStatus = UserStatus.SUSPENDED;
    else throw new ForbiddenException('Invalid decision');

    const updated = await this.prisma.userProfile.update({
      where: { id: targetUserId },
      data: { status: nextStatus },
    });

    this.jwtStrategy.invalidateCache(targetUserId);

    return updated;
  }

  // --- College Audit Logs & Stats ---

  async listCollegeAuditLogs(collegeId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { collegeId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where: { collegeId } }),
    ]);

    return { items, total, page, limit };
  }

  async getCollegeStats(collegeId: string) {
    const [statusCounts, branchCounts, batchCounts] = await Promise.all([
      this.prisma.userProfile.groupBy({
        by: ['status'],
        where: { collegeId, role: Role.STUDENT },
        _count: { id: true },
      }),
      this.prisma.studentProfile.groupBy({
        by: ['branchId'],
        where: { collegeId },
        _count: { userId: true },
      }),
      this.prisma.studentProfile.groupBy({
        by: ['batchYear'],
        where: { collegeId },
        _count: { userId: true },
      }),
    ]);

    const branches = await this.prisma.branch.findMany({
      where: { collegeId },
      select: { id: true, name: true, code: true },
    });

    const branchNameMap = new Map(branches.map((b) => [b.id, `${b.name} (${b.code})`]));

    return {
      byStatus: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      byBranch: branchCounts.map((b) => ({
        branchId: b.branchId,
        branchName: branchNameMap.get(b.branchId) || 'Unknown',
        count: b._count.userId,
      })),
      byBatchYear: batchCounts.map((b) => ({
        batchYear: b.batchYear,
        count: b._count.userId,
      })),
    };
  }
}
