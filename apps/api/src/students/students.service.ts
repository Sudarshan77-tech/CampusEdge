import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  UpdateStudentProfileDto,
  CreateDataRequestDto,
  DataRequestStatus,
  CurrentUser,
} from '@campusedge/shared';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(user: CurrentUser) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId },
      include: {
        branch: true,
        college: { select: { id: true, name: true, slug: true } },
        studentSkills: {
          include: { skill: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!studentProfile) {
      throw new NotFoundException('Student profile not found. Please complete onboarding.');
    }

    // Compute profile completion percentage
    let points = 0;
    const maxPoints = 6;
    if (studentProfile.branchId) points++;
    if (studentProfile.batchYear) points++;
    if (studentProfile.cgpa) points++;
    if (studentProfile.enrollmentNumber) points++;
    if (studentProfile.targetRole) points++;
    if (studentProfile.studentSkills.length > 0) points++;

    const completionPercentage = Math.round((points / maxPoints) * 100);

    return {
      ...studentProfile,
      completionPercentage,
    };
  }

  async updateMyProfile(user: CurrentUser, dto: UpdateStudentProfileDto) {
    const current = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId },
    });
    if (!current) throw new NotFoundException('Student profile not found');

    // Validate branch belongs to current.collegeId
    const branch = await this.prisma.branch.findUnique({
      where: {
        id_collegeId: {
          id: dto.branchId,
          collegeId: current.collegeId,
        },
      },
    });
    if (!branch || !branch.isActive) {
      throw new BadRequestException('Selected branch is invalid for your college');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.studentProfile.update({
        where: { userId: user.userId },
        data: {
          branchId: dto.branchId,
          degree: dto.degree,
          batchYear: dto.batchYear,
          cgpa: dto.cgpa,
          activeBacklogs: dto.activeBacklogs,
          enrollmentNumber: dto.enrollmentNumber?.trim() || null,
          targetRole: dto.targetRole?.trim() || null,
        },
      });

      if (dto.skills) {
        await tx.studentSkill.deleteMany({
          where: { studentId: user.userId },
        });

        for (const s of dto.skills) {
          await tx.studentSkill.create({
            data: {
              studentId: user.userId,
              skillId: s.skillId,
              collegeId: current.collegeId,
              proficiency: s.proficiency,
            },
          });
        }
      }

      return updatedProfile;
    });
  }

  async listSkillsCatalog() {
    return this.prisma.skill.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async createDataRequest(user: CurrentUser, dto: CreateDataRequestDto) {
    return this.prisma.dataRequest.create({
      data: {
        userId: user.userId,
        type: dto.type,
        status: DataRequestStatus.OPEN,
      },
    });
  }

  async listDataRequests(user: CurrentUser) {
    return this.prisma.dataRequest.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
