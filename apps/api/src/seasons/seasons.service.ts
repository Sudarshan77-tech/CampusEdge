import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSeasonDto, UpdateSeasonDto, SeasonQueryDto } from '@campusedge/shared';

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(collegeId: string, query: SeasonQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { collegeId };
    if (query.search) {
      where.label = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.placementSeason.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          _count: { select: { drives: true } },
        },
      }),
      this.prisma.placementSeason.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCurrent(collegeId: string) {
    return this.prisma.placementSeason.findFirst({
      where: { collegeId, isCurrent: true },
    });
  }

  async findById(collegeId: string, id: string) {
    const season = await this.prisma.placementSeason.findFirst({
      where: { id, collegeId },
      include: {
        _count: { select: { drives: true } },
      },
    });

    if (!season) {
      throw new NotFoundException('Placement season not found');
    }

    return season;
  }

  async create(collegeId: string, dto: CreateSeasonDto) {
    const existing = await this.prisma.placementSeason.findUnique({
      where: {
        collegeId_label: {
          collegeId,
          label: dto.label.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Season label '${dto.label}' already exists for this college`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.placementSeason.updateMany({
          where: { collegeId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.placementSeason.create({
        data: {
          collegeId,
          label: dto.label.trim(),
          batchYear: dto.batchYear,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          isCurrent: dto.isCurrent ?? false,
        },
      });
    });
  }

  async update(collegeId: string, id: string, dto: UpdateSeasonDto) {
    const current = await this.findById(collegeId, id);

    if (dto.rowVersion !== undefined && current.rowVersion !== dto.rowVersion) {
      throw new ConflictException(
        'Placement season was modified by another transaction. Please reload and retry.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.placementSeason.updateMany({
          where: { collegeId, isCurrent: true, id: { not: id } },
          data: { isCurrent: false },
        });
      }

      return tx.placementSeason.update({
        where: { id },
        data: {
          label: dto.label !== undefined ? dto.label.trim() : undefined,
          batchYear: dto.batchYear,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          isCurrent: dto.isCurrent,
          rowVersion: { increment: 1 },
        },
      });
    });
  }

  async setCurrent(collegeId: string, id: string) {
    await this.findById(collegeId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.placementSeason.updateMany({
        where: { collegeId, isCurrent: true },
        data: { isCurrent: false },
      });

      return tx.placementSeason.update({
        where: { id },
        data: {
          isCurrent: true,
          rowVersion: { increment: 1 },
        },
      });
    });
  }
}
