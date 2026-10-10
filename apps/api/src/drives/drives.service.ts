import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Role,
  CurrentUser,
  canTransitionDrive,
  CreateDriveDto,
  UpdateDriveDto,
  TransitionDriveStatusDto,
  DriveQueryDto,
  DriveStatus,
  Degree,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';

@Injectable()
export class DrivesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a complete drive with nested roles, eligibility, and rounds in a single transaction.
   */
  async create(collegeId: string, userId: string, dto: CreateDriveDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify season exists for this college
      const season = await tx.placementSeason.findFirst({
        where: { id: dto.seasonId, collegeId },
      });
      if (!season) {
        throw new NotFoundException('Placement season not found for this college');
      }

      // 2. Verify company exists
      const company = await tx.company.findUnique({
        where: { id: dto.companyId },
      });
      if (!company) {
        throw new NotFoundException('Company not found in catalog');
      }

      // 3. Create the main Drive record
      const drive = await tx.drive.create({
        data: {
          collegeId,
          companyId: dto.companyId,
          seasonId: dto.seasonId,
          title: dto.title.trim(),
          description: dto.description || null,
          driveType: dto.driveType,
          category: dto.category,
          status: dto.status ?? DriveStatus.DRAFT,
          isHistorical: dto.isHistorical ?? false,
          visitDate: dto.visitDate ? new Date(dto.visitDate) : null,
          registrationOpensAt: dto.registrationOpensAt ? new Date(dto.registrationOpensAt) : null,
          registrationDeadline: dto.registrationDeadline
            ? new Date(dto.registrationDeadline)
            : null,
          venue: dto.venue || null,
          registeredCount: dto.registeredCount ?? null,
          shortlistedCount: dto.shortlistedCount ?? null,
          selectedCount: dto.selectedCount ?? null,
          createdBy: userId,
        },
      });

      // 4. Create Roles and Skills
      if (dto.roles && dto.roles.length > 0) {
        for (const roleDto of dto.roles) {
          const role = await tx.driveRole.create({
            data: {
              driveId: drive.id,
              collegeId,
              title: roleDto.title.trim(),
              jobType: roleDto.jobType,
              ctcLpaMin: new Prisma.Decimal(roleDto.ctcLpaMin),
              ctcLpaMax: new Prisma.Decimal(roleDto.ctcLpaMax),
              stipendMonthly: roleDto.stipendMonthly ?? null,
              location: roleDto.location || null,
              openings: roleDto.openings ?? null,
              bondMonths: roleDto.bondMonths ?? null,
              description: roleDto.description || null,
            },
          });

          if (roleDto.skillIds && roleDto.skillIds.length > 0) {
            await tx.driveRoleSkill.createMany({
              data: roleDto.skillIds.map((skillId) => ({
                driveRoleId: role.id,
                skillId,
                collegeId,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      // 5. Create Eligibility and Eligible Branches
      if (dto.eligibility) {
        await tx.driveEligibility.create({
          data: {
            driveId: drive.id,
            collegeId,
            minCgpa:
              dto.eligibility.minCgpa !== undefined && dto.eligibility.minCgpa !== null
                ? new Prisma.Decimal(dto.eligibility.minCgpa)
                : null,
            maxActiveBacklogs: dto.eligibility.maxActiveBacklogs ?? null,
            allowedDegrees: (dto.eligibility.allowedDegrees as Degree[]) ?? [],
            allowedBatchYears: dto.eligibility.allowedBatchYears ?? [],
            notes: dto.eligibility.notes || null,
          },
        });

        if (dto.eligibility.branchIds && dto.eligibility.branchIds.length > 0) {
          await tx.driveEligibleBranch.createMany({
            data: dto.eligibility.branchIds.map((branchId) => ({
              driveId: drive.id,
              branchId,
              collegeId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // 6. Create Rounds and Topics
      if (dto.rounds && dto.rounds.length > 0) {
        for (const roundDto of dto.rounds) {
          const round = await tx.driveRound.create({
            data: {
              driveId: drive.id,
              collegeId,
              sequence: roundDto.sequence,
              roundType: roundDto.roundType,
              title: roundDto.title.trim(),
              durationMinutes: roundDto.durationMinutes ?? null,
              difficulty: roundDto.difficulty ?? null,
              mode: roundDto.mode,
              platformNote: roundDto.platformNote || null,
            },
          });

          if (roundDto.topicIds && roundDto.topicIds.length > 0) {
            await tx.driveRoundTopic.createMany({
              data: roundDto.topicIds.map((topicId) => ({
                roundId: round.id,
                topicId,
                collegeId,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return this.findById(collegeId, drive.id);
    });
  }

  /**
   * List drives with filter constraints and student view rules.
   */
  async list(collegeId: string, user: CurrentUser, query: DriveQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { collegeId };

    // Students cannot view DRAFT drives
    if (user.role === Role.STUDENT) {
      where.status = { not: DriveStatus.DRAFT };
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.companyId) where.companyId = query.companyId;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { company: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.drive.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isHistorical: 'asc' }, { visitDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          company: true,
          season: true,
          roles: true,
          eligibility: {
            include: {
              eligibleBranches: {
                include: { branch: true },
              },
            },
          },
          _count: {
            select: { applications: true, rounds: true },
          },
        },
      }),
      this.prisma.drive.count({ where }),
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
   * Get single drive detail with all nested relations.
   */
  async findById(collegeId: string, id: string, user?: CurrentUser) {
    const drive = await this.prisma.drive.findFirst({
      where: { id, collegeId },
      include: {
        company: true,
        season: true,
        roles: {
          include: {
            skills: {
              include: { skill: true },
            },
          },
        },
        eligibility: {
          include: {
            eligibleBranches: {
              include: { branch: true },
            },
          },
        },
        rounds: {
          orderBy: { sequence: 'asc' },
          include: {
            topics: {
              include: { topic: true },
            },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!drive) {
      throw new NotFoundException('Drive not found');
    }

    if (user?.role === Role.STUDENT && drive.status === DriveStatus.DRAFT) {
      throw new NotFoundException('Drive not found');
    }

    return drive;
  }

  /**
   * Update drive basics and nested options with optimistic locking.
   */
  async update(collegeId: string, id: string, dto: UpdateDriveDto) {
    const current = await this.findById(collegeId, id);

    if (dto.rowVersion !== undefined && current.rowVersion !== dto.rowVersion) {
      throw new ConflictException(
        'Drive was modified by another transaction. Please refresh and retry.',
      );
    }

    return this.prisma.drive.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        driveType: dto.driveType,
        category: dto.category,
        visitDate:
          dto.visitDate !== undefined
            ? dto.visitDate
              ? new Date(dto.visitDate)
              : null
            : undefined,
        registrationOpensAt:
          dto.registrationOpensAt !== undefined
            ? dto.registrationOpensAt
              ? new Date(dto.registrationOpensAt)
              : null
            : undefined,
        registrationDeadline:
          dto.registrationDeadline !== undefined
            ? dto.registrationDeadline
              ? new Date(dto.registrationDeadline)
              : null
            : undefined,
        venue: dto.venue !== undefined ? dto.venue : undefined,
        registeredCount: dto.registeredCount !== undefined ? dto.registeredCount : undefined,
        shortlistedCount: dto.shortlistedCount !== undefined ? dto.shortlistedCount : undefined,
        selectedCount: dto.selectedCount !== undefined ? dto.selectedCount : undefined,
        rowVersion: { increment: 1 },
      },
      include: {
        company: true,
        season: true,
        roles: true,
        eligibility: true,
      },
    });
  }

  /**
   * Transition drive lifecycle status using pure validator.
   */
  async transitionStatus(collegeId: string, id: string, dto: TransitionDriveStatusDto) {
    const drive = await this.findById(collegeId, id);

    if (drive.rowVersion !== dto.rowVersion) {
      throw new ConflictException(
        'Drive status was modified concurrently. Please reload and retry.',
      );
    }

    const validation = canTransitionDrive(drive.status as DriveStatus, dto.status, {
      roleCount: drive.roles.length,
      hasEligibility: drive.eligibility !== null,
      registrationDeadline: drive.registrationDeadline,
      isHistorical: drive.isHistorical,
      applicationCount: drive._count.applications,
    });

    if (!validation.allowed) {
      throw new ConflictException(validation.reason || 'Invalid drive status transition');
    }

    return this.prisma.drive.update({
      where: { id },
      data: {
        status: dto.status,
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * Delete drive: only permitted if DRAFT with zero applications.
   */
  async delete(collegeId: string, id: string) {
    const drive = await this.findById(collegeId, id);

    if (drive.status !== DriveStatus.DRAFT || drive._count.applications > 0) {
      throw new ConflictException(
        'Only DRAFT drives with zero applications can be permanently deleted. Active drives must be transitioned to CANCELLED.',
      );
    }

    await this.prisma.drive.delete({
      where: { id },
    });

    return { success: true, message: 'Drive deleted successfully' };
  }

  /**
   * Calculate live eligible student count for a drive's criteria.
   */
  async getEligibleCount(collegeId: string, id: string) {
    const drive = await this.findById(collegeId, id);
    const eligibility = drive.eligibility;

    if (!eligibility) {
      // If no criteria, all active students are eligible
      const totalActive = await this.prisma.studentProfile.count({
        where: {
          collegeId,
          userProfile: { status: 'ACTIVE' },
        },
      });
      return { count: totalActive };
    }

    const where: Record<string, unknown> = {
      collegeId,
      userProfile: { status: 'ACTIVE' },
    };

    if (eligibility.minCgpa !== null) {
      where.cgpa = { gte: eligibility.minCgpa };
    }

    if (eligibility.maxActiveBacklogs !== null) {
      where.activeBacklogs = { lte: eligibility.maxActiveBacklogs };
    }

    if (eligibility.allowedDegrees && eligibility.allowedDegrees.length > 0) {
      where.degree = { in: eligibility.allowedDegrees };
    }

    if (eligibility.allowedBatchYears && eligibility.allowedBatchYears.length > 0) {
      where.batchYear = { in: eligibility.allowedBatchYears };
    }

    const branchIds = eligibility.eligibleBranches.map((eb) => eb.branchId);
    if (branchIds.length > 0) {
      where.branchId = { in: branchIds };
    }

    const count = await this.prisma.studentProfile.count({ where });
    return { count };
  }
}
