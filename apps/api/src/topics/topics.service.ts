import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTopicDto, UpdateTopicDto, TopicQueryDto } from '@campusedge/shared';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: TopicQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.topic.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  async create(dto: CreateTopicDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await this.prisma.topic.findFirst({
      where: {
        OR: [{ name: { equals: dto.name.trim(), mode: 'insensitive' } }, { slug }],
      },
    });

    if (existing) {
      throw new ConflictException(`Topic '${dto.name}' already exists`);
    }

    return this.prisma.topic.create({
      data: {
        name: dto.name.trim(),
        slug,
        category: dto.category,
      },
    });
  }

  async update(id: string, dto: UpdateTopicDto) {
    await this.findById(id);

    const data: Record<string, unknown> = {};
    if (dto.name) {
      data.name = dto.name.trim();
      data.slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (dto.category) data.category = dto.category;

    return this.prisma.topic.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.topic.delete({ where: { id } });
  }
}
