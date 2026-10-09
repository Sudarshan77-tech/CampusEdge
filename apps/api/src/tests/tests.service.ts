import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  Role,
  ContentScope,
  TestGenerationMode,
  TestTemplateKind,
  TestTemplateStatus,
  TestScheduleStatus,
  TestScheduleAudience,
  ResultsReleasePolicy,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';

export interface CreateSectionRuleDto {
  topicId: string;
  subtopicId?: string | null;
  count: number;
  difficultyMin?: number;
  difficultyMax?: number;
}

export interface CreateSectionDto {
  sequence: number;
  title: string;
  marksPerQuestion: number;
  negativeMarks?: number;
  sectionTimeLimitMinutes?: number | null;
  questionCount: number;
  rules?: CreateSectionRuleDto[];
  fixedQuestionIds?: string[];
}

export interface CreateTestTemplateDto {
  collegeId?: string | null;
  title: string;
  description?: string;
  kind: TestTemplateKind;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number | null;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  calculatorAllowed?: boolean;
  companyId?: string | null;
  sections: CreateSectionDto[];
}

export interface CreateTestScheduleDto {
  templateId: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  audience?: TestScheduleAudience;
  targetBranchIds?: string[];
  targetBatchYears?: number[];
  resultsRelease?: ResultsReleasePolicy;
}

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new test template with sections and rules atomically.
   */
  async createTemplate(dto: CreateTestTemplateDto, user: CurrentUser) {
    let collegeId: string | null = null;

    if (user.role === Role.SUPER_ADMIN) {
      collegeId = dto.collegeId || null;
    } else if (user.role === Role.COLLEGE_ADMIN) {
      if (!user.collegeId) throw new ForbiddenException('College context required');
      collegeId = user.collegeId;
    } else {
      throw new ForbiddenException('Only administrators can create test templates');
    }

    if (!dto.sections || dto.sections.length === 0) {
      throw new BadRequestException('Test template must contain at least one section');
    }

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.testTemplate.create({
        data: {
          scope: collegeId ? ContentScope.COLLEGE : ContentScope.GLOBAL,
          collegeId,
          title: dto.title,
          description: dto.description || '',
          kind: dto.kind,
          durationMinutes: dto.durationMinutes,
          shuffleQuestions: dto.shuffleQuestions ?? true,
          shuffleOptions: dto.shuffleOptions ?? true,
          generationMode: dto.sections.some(
            (s) => s.fixedQuestionIds && s.fixedQuestionIds.length > 0,
          )
            ? TestGenerationMode.FIXED
            : TestGenerationMode.GENERATED,
          companyId: dto.companyId || null,
          status: TestTemplateStatus.PUBLISHED,
        },
      });

      for (const sec of dto.sections) {
        const section = await tx.testSection.create({
          data: {
            templateId: template.id,
            sequence: sec.sequence,
            title: sec.title,
            marksPerQuestion: sec.marksPerQuestion,
            negativeMarks: sec.negativeMarks ?? 0,
            sectionTimeLimitMinutes: sec.sectionTimeLimitMinutes ?? null,
            questionCount: sec.questionCount,
          },
        });

        if (sec.rules && sec.rules.length > 0) {
          await tx.testSectionRule.createMany({
            data: sec.rules.map((r) => ({
              sectionId: section.id,
              topicId: r.topicId,
              subtopicId: r.subtopicId || null,
              count: r.count,
              difficultyMin: r.difficultyMin ?? 1,
              difficultyMax: r.difficultyMax ?? 5,
            })),
          });
        }

        if (sec.fixedQuestionIds && sec.fixedQuestionIds.length > 0) {
          await tx.testSectionQuestion.createMany({
            data: sec.fixedQuestionIds.map((qid, idx) => ({
              sectionId: section.id,
              questionId: qid,
              position: idx + 1,
            })),
          });
        }
      }

      return tx.testTemplate.findUnique({
        where: { id: template.id },
        include: {
          sections: {
            include: {
              rules: true,
              fixedQuestions: true,
            },
          },
        },
      });
    });
  }

  /**
   * List test templates accessible to user.
   */
  async listTemplates(kind?: TestTemplateKind, user?: CurrentUser) {
    const where: Prisma.TestTemplateWhereInput = {
      status: TestTemplateStatus.PUBLISHED,
    };

    if (kind) {
      where.kind = kind;
    }

    if (user && user.role !== Role.SUPER_ADMIN && user.collegeId) {
      where.OR = [{ collegeId: null }, { collegeId: user.collegeId }];
    }

    return this.prisma.testTemplate.findMany({
      where,
      include: {
        sections: {
          select: {
            id: true,
            sequence: true,
            title: true,
            questionCount: true,
            marksPerQuestion: true,
            sectionTimeLimitMinutes: true,
          },
        },
        company: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single test template by ID.
   */
  async getTemplateById(id: string, user: CurrentUser) {
    const template = await this.prisma.testTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { sequence: 'asc' },
          include: {
            rules: {
              include: {
                topic: { select: { id: true, name: true, slug: true } },
              },
            },
            fixedQuestions: {
              select: { questionId: true, position: true },
            },
          },
        },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Test template not found');
    }

    if (
      user.role !== Role.SUPER_ADMIN &&
      template.collegeId &&
      template.collegeId !== user.collegeId
    ) {
      throw new ForbiddenException('Access denied to this test template');
    }

    return template;
  }

  /**
   * Create a scheduled test drive.
   */
  async createSchedule(dto: CreateTestScheduleDto, user: CurrentUser) {
    if (user.role === Role.STUDENT) {
      throw new ForbiddenException('Students cannot schedule tests');
    }

    const collegeId = user.collegeId;
    if (!collegeId) {
      throw new BadRequestException('College context required to schedule a test');
    }

    const template = await this.prisma.testTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('Schedule endsAt must be after startsAt');
    }

    return this.prisma.testSchedule.create({
      data: {
        collegeId,
        templateId: dto.templateId,
        title: dto.title,
        startsAt,
        endsAt,
        audience: dto.audience ?? TestScheduleAudience.ALL,
        targetBranchIds: dto.targetBranchIds ?? [],
        targetBatchYears: dto.targetBatchYears ?? [],
        resultsRelease: dto.resultsRelease ?? ResultsReleasePolicy.IMMEDIATE,
        status: TestScheduleStatus.SCHEDULED,
      },
      include: {
        template: {
          select: { id: true, title: true, durationMinutes: true },
        },
      },
    });
  }

  /**
   * List test schedules.
   */
  async listSchedules(user: CurrentUser) {
    const where: Prisma.TestScheduleWhereInput = {};

    if (user.role === Role.STUDENT) {
      if (!user.collegeId) return [];
      where.collegeId = user.collegeId;
      where.status = { in: [TestScheduleStatus.SCHEDULED, TestScheduleStatus.ACTIVE] };
    } else if (user.role === Role.COLLEGE_ADMIN) {
      where.collegeId = user.collegeId || undefined;
    }

    return this.prisma.testSchedule.findMany({
      where,
      include: {
        template: {
          select: { id: true, title: true, durationMinutes: true, kind: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  /**
   * Get test schedule by ID.
   */
  async getScheduleById(id: string, user: CurrentUser) {
    const schedule = await this.prisma.testSchedule.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            sections: {
              select: {
                id: true,
                sequence: true,
                title: true,
                questionCount: true,
                marksPerQuestion: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Test schedule not found');
    }

    if (user.role !== Role.SUPER_ADMIN && schedule.collegeId !== user.collegeId) {
      throw new ForbiddenException('Access denied to this test schedule');
    }

    return schedule;
  }
}
