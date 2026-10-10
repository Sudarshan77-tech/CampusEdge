import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  evaluateEligibility,
  ApplicationQueryDto,
  ApplyDriveDto,
  UpdateApplicationStatusDto,
  BulkUpdateApplicationStatusDto,
  ApplicationStatus,
  ConsentType,
  DriveStatus,
  DriveCategory,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Student registers for a drive.
   * Performs server-side eligibility check, deadline check, one-offer policy check,
   * and records PLACEMENT_SHARING consent and application in a single transaction.
   */
  async apply(
    user: CurrentUser,
    driveId: string,
    dto: ApplyDriveDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    // 1. Fetch student profile with academics
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId },
      include: { userProfile: true, college: true },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    if (student.userProfile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your student account is not active');
    }

    // 2. Fetch drive with eligibility criteria
    const drive = await this.prisma.drive.findFirst({
      where: { id: driveId, collegeId: user.collegeId },
      include: {
        eligibility: {
          include: { eligibleBranches: true },
        },
      },
    });
    if (!drive) throw new NotFoundException('Placement drive not found');

    // 3. Fetch existing application for this drive
    const existingApp = await this.prisma.driveApplication.findUnique({
      where: {
        driveId_studentId: { driveId, studentId: user.userId },
      },
    });
    const isRegistered = existingApp !== null && existingApp.status !== ApplicationStatus.WITHDRAWN;

    // 4. Fetch existing selected offers for one-offer policy
    const existingOffers = await this.prisma.driveApplication.findMany({
      where: {
        studentId: user.userId,
        collegeId: user.collegeId,
        status: ApplicationStatus.SELECTED,
      },
      include: { drive: true },
    });

    // 5. Evaluate eligibility pure engine
    const eligibilityResult = evaluateEligibility(
      {
        id: student.userId,
        status: student.userProfile.status,
        cgpa: Number(student.cgpa),
        activeBacklogs: student.activeBacklogs,
        degree: student.degree,
        batchYear: student.batchYear,
        branchId: student.branchId,
      },
      {
        id: drive.id,
        category: drive.category as DriveCategory,
        status: drive.status as DriveStatus,
        registrationDeadline: drive.registrationDeadline,
      },
      {
        minCgpa: drive.eligibility?.minCgpa ? Number(drive.eligibility.minCgpa) : null,
        maxActiveBacklogs: drive.eligibility?.maxActiveBacklogs ?? null,
        allowedDegrees: drive.eligibility?.allowedDegrees ?? null,
        allowedBatchYears: drive.eligibility?.allowedBatchYears ?? null,
        allowedBranchIds: drive.eligibility?.eligibleBranches.map((eb) => eb.branchId) ?? null,
      },
      {
        isRegistered,
        enforceOneOfferPolicy: student.college.enforceOneOfferPolicy,
        existingOffers: existingOffers.map((eo) => ({
          driveId: eo.driveId,
          category: eo.drive.category as DriveCategory,
        })),
      },
    );

    if (!eligibilityResult.eligible) {
      throw new ConflictException(eligibilityResult.reasons.join('; '));
    }

    // 6. Execute atomic application and consent record creation
    return this.prisma.$transaction(async (tx) => {
      // Create ConsentRecord
      await tx.consentRecord.create({
        data: {
          userId: user.userId,
          driveId: drive.id,
          consentType: ConsentType.PLACEMENT_SHARING,
          policyVersion: dto.policyVersion || '1.0',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });

      // Upsert application
      return tx.driveApplication.upsert({
        where: {
          driveId_studentId: { driveId, studentId: user.userId },
        },
        create: {
          driveId,
          studentId: user.userId,
          collegeId: user.collegeId!,
          status: ApplicationStatus.REGISTERED,
        },
        update: {
          status: ApplicationStatus.REGISTERED,
          rowVersion: { increment: 1 },
        },
      });
    });
  }

  /**
   * Student withdraws application before registration deadline.
   */
  async withdraw(user: CurrentUser, driveId: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');

    const drive = await this.prisma.drive.findFirst({
      where: { id: driveId, collegeId: user.collegeId },
    });
    if (!drive) throw new NotFoundException('Drive not found');

    if (drive.registrationDeadline && new Date(drive.registrationDeadline) < new Date()) {
      throw new ConflictException('Cannot withdraw after the registration deadline has passed');
    }

    const application = await this.prisma.driveApplication.findUnique({
      where: {
        driveId_studentId: { driveId, studentId: user.userId },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.driveApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.WITHDRAWN,
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * List student's own applications.
   */
  async myApplications(user: CurrentUser) {
    return this.prisma.driveApplication.findMany({
      where: { studentId: user.userId },
      include: {
        drive: {
          include: { company: true, season: true },
        },
        offeredRole: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Placement Cell: list applicants for a drive with filters.
   */
  async list(collegeId: string, query: ApplicationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { collegeId };

    if (query.driveId) where.driveId = query.driveId;
    if (query.status) where.status = query.status;
    if (query.branchId) {
      where.student = { branchId: query.branchId };
    }

    if (query.search) {
      where.student = {
        OR: [
          { enrollmentNumber: { contains: query.search, mode: 'insensitive' } },
          { userProfile: { fullName: { contains: query.search, mode: 'insensitive' } } },
          { userProfile: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.driveApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              userProfile: { select: { fullName: true, email: true } },
              branch: true,
            },
          },
          offeredRole: true,
          drive: { select: { id: true, title: true, company: { select: { name: true } } } },
        },
      }),
      this.prisma.driveApplication.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update applicant status singly with optimistic locking.
   */
  async updateStatus(
    collegeId: string,
    updaterId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.prisma.driveApplication.findFirst({
      where: { id: applicationId, collegeId },
    });
    if (!application) throw new NotFoundException('Application not found');

    if (application.rowVersion !== dto.rowVersion) {
      throw new ConflictException(
        'Application was updated concurrently. Please refresh and retry.',
      );
    }

    if (dto.status === ApplicationStatus.SELECTED) {
      if (dto.offeredRoleId) {
        const role = await this.prisma.driveRole.findFirst({
          where: { id: dto.offeredRoleId, driveId: application.driveId, collegeId },
        });
        if (!role) {
          throw new ConflictException('Offered role does not belong to this drive');
        }
      }
    }

    return this.prisma.driveApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        offeredRoleId: dto.offeredRoleId !== undefined ? dto.offeredRoleId : undefined,
        offeredCtcLpa:
          dto.offeredCtcLpa !== undefined
            ? dto.offeredCtcLpa !== null
              ? new Prisma.Decimal(dto.offeredCtcLpa)
              : null
            : undefined,
        statusUpdatedBy: updaterId,
        statusUpdatedAt: new Date(),
        rowVersion: { increment: 1 },
      },
      include: {
        student: {
          include: {
            userProfile: { select: { fullName: true, email: true } },
            branch: true,
          },
        },
        offeredRole: true,
      },
    });
  }

  /**
   * Bulk update applicant status.
   */
  async bulkUpdateStatus(
    collegeId: string,
    updaterId: string,
    driveId: string,
    dto: BulkUpdateApplicationStatusDto,
  ) {
    const result = await this.prisma.driveApplication.updateMany({
      where: {
        id: { in: dto.applicationIds },
        driveId,
        collegeId,
      },
      data: {
        status: dto.status,
        statusUpdatedBy: updaterId,
        statusUpdatedAt: new Date(),
        rowVersion: { increment: 1 },
      },
    });

    return {
      success: true,
      updatedCount: result.count,
    };
  }

  /**
   * Export applicants CSV with statutory consent verification and formula injection sanitization.
   */
  async exportCsv(collegeId: string, driveId: string) {
    // 1. Fetch applications
    const applications = await this.prisma.driveApplication.findMany({
      where: { driveId, collegeId },
      include: {
        student: {
          include: {
            userProfile: true,
            branch: true,
          },
        },
        offeredRole: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Fetch student IDs who have active PLACEMENT_SHARING consent for this drive
    const consents = await this.prisma.consentRecord.findMany({
      where: {
        driveId,
        consentType: ConsentType.PLACEMENT_SHARING,
      },
      select: { userId: true },
    });
    const consentedUserIds = new Set(consents.map((c) => c.userId));

    // 3. Filter only consented students
    const exportableApps = applications.filter((app) => consentedUserIds.has(app.studentId));

    // 4. Formula injection sanitization helper
    const sanitizeCell = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      // If starts with =, +, -, @, prepend single quote
      if (/^[=+\-@]/.test(str)) {
        return `'${str}`;
      }
      // Escape quotes for CSV
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Full Name',
      'Enrollment Number',
      'Email',
      'Degree',
      'Branch',
      'Batch Year',
      'CGPA',
      'Active Backlogs',
      'Application Status',
      'Offered Role',
      'Offered CTC (LPA)',
    ];

    const rows = exportableApps.map((app) => [
      sanitizeCell(app.student.userProfile.fullName),
      sanitizeCell(app.student.enrollmentNumber || ''),
      sanitizeCell(app.student.userProfile.email),
      sanitizeCell(app.student.degree),
      sanitizeCell(app.student.branch.name),
      sanitizeCell(app.student.batchYear),
      sanitizeCell(app.student.cgpa),
      sanitizeCell(app.student.activeBacklogs),
      sanitizeCell(app.status),
      sanitizeCell(app.offeredRole?.title || ''),
      sanitizeCell(app.offeredCtcLpa ? app.offeredCtcLpa.toString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return {
      csv: csvContent,
      totalApplicants: applications.length,
      consentedApplicants: exportableApps.length,
    };
  }
}
