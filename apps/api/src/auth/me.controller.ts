import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  type CurrentUser as CurrentUserType,
  Role,
  UserStatus,
  ConsentType,
} from '@campusedge/shared';
import { PrismaService } from '../prisma.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(['me', 'auth/me'])
  @ApiOperation({
    summary: 'Get current authenticated user identity, tenant context, and onboarding status',
  })
  @ApiResponse({ status: 200, description: 'Current user profile details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: CurrentUserType) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: user.userId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            state: true,
            status: true,
            emailDomains: true,
            requireStudentApproval: true,
          },
        },
        consents: {
          select: {
            consentType: true,
            policyVersion: true,
            createdAt: true,
          },
        },
        studentProfile: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
            studentSkills: {
              include: {
                skill: { select: { id: true, name: true, category: true } },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    // Determine onboarding step
    let onboardingStep = 'COMPLETED';
    let profileCompletion = 100;

    if (profile.role === Role.STUDENT) {
      const recordedConsents = new Set(profile.consents.map((c) => c.consentType));
      const hasRequiredConsents =
        recordedConsents.has(ConsentType.TERMS) &&
        recordedConsents.has(ConsentType.PRIVACY) &&
        recordedConsents.has(ConsentType.DATA_PROCESSING);

      if (!profile.collegeId) {
        onboardingStep = 'CHOOSE_COLLEGE';
        profileCompletion = 10;
      } else if (!hasRequiredConsents) {
        onboardingStep = 'CONSENT';
        profileCompletion = 25;
      } else if (!profile.studentProfile?.onboardingCompletedAt) {
        onboardingStep = 'PROFILE_WIZARD';
        profileCompletion = 50;
      } else if (profile.status === UserStatus.PENDING_APPROVAL) {
        onboardingStep = 'WAITING_APPROVAL';
        profileCompletion = 90;
      } else if (profile.status === UserStatus.ACTIVE) {
        onboardingStep = 'COMPLETED';
        profileCompletion = 100;
      } else {
        onboardingStep = 'ONBOARDING';
        profileCompletion = 50;
      }
    }

    const profileData = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      status: profile.status,
      collegeId: profile.collegeId,
      college: profile.college,
      consents: profile.consents,
      studentProfile: profile.studentProfile,
      onboardingStep,
      profileCompletion,
    };

    return {
      success: true,
      data: profileData,
      ...profileData,
    };
  }
}
