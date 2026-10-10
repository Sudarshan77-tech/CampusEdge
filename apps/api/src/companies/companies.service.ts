import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Role,
  CurrentUser,
  normalizeCompanyName,
  CreateCompanyDto,
  UpdateCompanyDto,
  VerifyCompanyDto,
  MergeCompanyDto,
  CompanyQueryDto,
  CompanyStatus,
} from '@campusedge/shared';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List companies with visibility controls:
   * Super Admins can see all.
   * College staff/students see VERIFIED companies plus companies created by their own college.
   */
  async list(user: CurrentUser, query: CompanyQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (user.role !== Role.SUPER_ADMIN) {
      if (user.collegeId) {
        where.OR = [{ status: CompanyStatus.VERIFIED }, { createdByCollegeId: user.collegeId }];
      } else {
        where.status = CompanyStatus.VERIFIED;
      }
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const searchNorm = normalizeCompanyName(query.search);
      where.AND = [
        {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { normalizedName: { contains: searchNorm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { drives: true, experiences: true },
          },
        },
      }),
      this.prisma.company.count({ where }),
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
   * Search / duplicate check helper for companies.
   */
  async search(query: string, user: CurrentUser) {
    const norm = normalizeCompanyName(query);
    const where: Record<string, unknown> = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { normalizedName: { contains: norm, mode: 'insensitive' } },
      ],
    };

    if (user.role !== Role.SUPER_ADMIN && user.collegeId) {
      where.AND = [
        {
          OR: [{ status: CompanyStatus.VERIFIED }, { createdByCollegeId: user.collegeId }],
        },
      ];
    }

    return this.prisma.company.findMany({
      where,
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a company (starts as PENDING_REVIEW if created by college).
   * Exact matches are returned idempotently rather than duplicating.
   */
  async create(user: CurrentUser, dto: CreateCompanyDto) {
    const normalized = normalizeCompanyName(dto.name);
    if (!normalized) {
      throw new ConflictException('Company name must contain alphanumeric characters');
    }

    // 1. Check exact match
    const existing = await this.prisma.company.findUnique({
      where: { normalizedName: normalized },
    });

    if (existing) {
      return {
        company: existing,
        isExisting: true,
        message: 'Matched existing company in catalog',
      };
    }

    // 2. Check similar candidates
    const similar = await this.prisma.company.findMany({
      where: {
        normalizedName: { contains: normalized, mode: 'insensitive' },
      },
      take: 3,
    });

    // 3. Generate base slug
    const baseSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    let slug = baseSlug || 'company';
    let counter = 1;
    while (await this.prisma.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.name.trim(),
        normalizedName: normalized,
        slug,
        website: dto.website || null,
        industry: dto.industry || null,
        logoUrl: dto.logoUrl || null,
        status:
          user.role === Role.SUPER_ADMIN ? CompanyStatus.VERIFIED : CompanyStatus.PENDING_REVIEW,
        createdByCollegeId: user.collegeId || null,
      },
    });

    return {
      company,
      isExisting: false,
      similar: similar.length > 0 ? similar : undefined,
    };
  }

  /**
   * Get single company detail with visibility check.
   */
  async findById(id: string, user: CurrentUser) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        mergedInto: true,
        _count: {
          select: { drives: true, experiences: true },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (
      user.role !== Role.SUPER_ADMIN &&
      company.status !== CompanyStatus.VERIFIED &&
      company.createdByCollegeId !== user.collegeId
    ) {
      throw new ForbiddenException('You do not have access to view this company');
    }

    return company;
  }

  /**
   * Super Admin verify or reject company.
   */
  async verify(id: string, dto: VerifyCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.company.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });
  }

  /**
   * Super Admin merge Company A into Company B.
   * Transactionally repoints all Drives and Experiences across all colleges,
   * then marks Company A as MERGED into B.
   */
  async merge(sourceId: string, dto: MergeCompanyDto) {
    const targetId = dto.targetCompanyId;
    if (sourceId === targetId) {
      throw new ConflictException('Cannot merge a company into itself');
    }

    const [source, target] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: sourceId } }),
      this.prisma.company.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) throw new NotFoundException('Source company not found');
    if (!target) throw new NotFoundException('Target company not found');

    return this.prisma.$transaction(async (tx) => {
      // Repoint drives
      const repointedDrives = await tx.drive.updateMany({
        where: { companyId: sourceId },
        data: { companyId: targetId },
      });

      // Repoint experiences
      const repointedExperiences = await tx.experience.updateMany({
        where: { companyId: sourceId },
        data: { companyId: targetId },
      });

      // Mark source as MERGED
      const mergedSource = await tx.company.update({
        where: { id: sourceId },
        data: {
          status: CompanyStatus.MERGED,
          mergedIntoId: targetId,
        },
      });

      return {
        success: true,
        source: mergedSource,
        target,
        repointedDrivesCount: repointedDrives.count,
        repointedExperiencesCount: repointedExperiences.count,
      };
    });
  }

  /**
   * Super Admin list pending review companies.
   */
  async listPending(query: CompanyQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where: { status: CompanyStatus.PENDING_REVIEW },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({
        where: { status: CompanyStatus.PENDING_REVIEW },
      }),
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
   * Super Admin update company.
   */
  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    const data: Record<string, unknown> = {};
    if (dto.name) {
      data.name = dto.name.trim();
      data.normalizedName = normalizeCompanyName(dto.name);
    }
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.industry !== undefined) data.industry = dto.industry;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;

    return this.prisma.company.update({
      where: { id },
      data,
    });
  }
}
