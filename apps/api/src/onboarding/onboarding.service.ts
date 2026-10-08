import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ChooseCollegeDto,
  RecordConsentDto,
  UpdateStudentProfileDto,
  CollegeStatus,
  UserStatus,
  Role,
  CurrentUser,
  InvitationStatus,
} from '@campusedge/shared';
import { JwtStrategy } from '../auth/jwt.strategy';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtStrategy: JwtStrategy,
  ) {
    const supabaseUrl =
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL') ||
      this.configService.get<string>('SUPABASE_URL') ||
      '';
    const secretKey = this.configService.get<string>('SUPABASE_SECRET_KEY') || '';
    this.supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // --- Step 1: Choose College ---

  async chooseCollege(user: CurrentUser, dto: ChooseCollegeDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: user.userId },
    });
    if (!profile) throw new NotFoundException('User profile not found');

    if (profile.collegeId) {
      throw new BadRequestException(
        'College has already been selected. Changing college requires placement cell approval.',
      );
    }

    const college = await this.prisma.college.findUnique({
      where: { id: dto.collegeId },
    });
    if (!college) throw new NotFoundException('Selected college not found');
    if (college.status !== CollegeStatus.ACTIVE) {
      throw new BadRequestException('Selected college is not active on CampusEdge');
    }

    const updated = await this.prisma.userProfile.update({
      where: { id: user.userId },
      data: { collegeId: dto.collegeId },
    });

    this.jwtStrategy.invalidateCache(user.userId);
    return updated;
  }

  // --- Step 2: Record Consents ---

  async recordConsent(
    user: CurrentUser,
    dto: RecordConsentDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.prisma.consentRecord.create({
      data: {
        userId: user.userId,
        consentType: dto.consentType,
        policyVersion: dto.policyVersion,
        ipAddress: meta?.ipAddress || null,
        userAgent: meta?.userAgent || null,
      },
    });
  }

  async listConsents(user: CurrentUser) {
    return this.prisma.consentRecord.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Step 3: Complete Student Profile & Activate ---

  async saveStudentProfile(user: CurrentUser, dto: UpdateStudentProfileDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: user.userId },
      include: { college: true },
    });
    if (!profile) throw new NotFoundException('User profile not found');
    if (!profile.collegeId || !profile.college) {
      throw new BadRequestException('Please select a college before completing your profile');
    }

    const college = profile.college;

    // Validate branch exists and belongs to the user's selected college (Composite integrity)
    const branch = await this.prisma.branch.findUnique({
      where: {
        id_collegeId: {
          id: dto.branchId,
          collegeId: profile.collegeId,
        },
      },
    });
    if (!branch || !branch.isActive) {
      throw new BadRequestException('Selected branch is invalid or not active for your college');
    }

    // Check duplicate enrollment number within the same college
    if (dto.enrollmentNumber) {
      const existingEnrollment = await this.prisma.studentProfile.findFirst({
        where: {
          collegeId: profile.collegeId,
          enrollmentNumber: dto.enrollmentNumber.trim(),
          NOT: { userId: user.userId },
        },
      });
      if (existingEnrollment) {
        throw new ConflictException('Enrollment number is already registered at this college');
      }
    }

    // --- Activation Rule ---
    // A student becomes ACTIVE automatically ONLY if:
    // (1) College has email_domains configured,
    // (2) Student's verified email domain matches one,
    // (3) College require_student_approval is false.
    // Otherwise -> PENDING_APPROVAL.
    const userEmail = profile.email.toLowerCase();
    const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';

    const hasAllowedDomain =
      college.emailDomains &&
      college.emailDomains.length > 0 &&
      college.emailDomains.some((d) => d.toLowerCase().trim() === emailDomain);

    const autoActivate = hasAllowedDomain && !college.requireStudentApproval;

    const targetStatus = autoActivate ? UserStatus.ACTIVE : UserStatus.PENDING_APPROVAL;

    // Database transaction to upsert profile, skills, and update user status
    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert StudentProfile
      const studentProfile = await tx.studentProfile.upsert({
        where: { userId: user.userId },
        update: {
          branchId: dto.branchId,
          degree: dto.degree,
          batchYear: dto.batchYear,
          cgpa: dto.cgpa,
          activeBacklogs: dto.activeBacklogs,
          enrollmentNumber: dto.enrollmentNumber?.trim() || null,
          targetRole: dto.targetRole?.trim() || null,
          onboardingCompletedAt: new Date(),
        },
        create: {
          userId: user.userId,
          collegeId: profile.collegeId!,
          branchId: dto.branchId,
          degree: dto.degree,
          batchYear: dto.batchYear,
          cgpa: dto.cgpa,
          activeBacklogs: dto.activeBacklogs,
          enrollmentNumber: dto.enrollmentNumber?.trim() || null,
          targetRole: dto.targetRole?.trim() || null,
          onboardingCompletedAt: new Date(),
        },
      });

      // 2. Sync Student Skills
      if (dto.skills && dto.skills.length > 0) {
        // Remove existing skills
        await tx.studentSkill.deleteMany({
          where: { studentId: user.userId },
        });

        // Insert new skills
        for (const s of dto.skills) {
          await tx.studentSkill.create({
            data: {
              studentId: user.userId,
              skillId: s.skillId,
              collegeId: profile.collegeId!,
              proficiency: s.proficiency,
            },
          });
        }
      }

      // 3. Update User Status
      const updatedUser = await tx.userProfile.update({
        where: { id: user.userId },
        data: { status: targetStatus },
      });

      this.jwtStrategy.invalidateCache(user.userId);

      return {
        profile: studentProfile,
        userStatus: updatedUser.status,
        autoActivated: autoActivate,
      };
    });
  }

  // --- Step 4: Accept College Admin Invitation ---

  async acceptInvitation(user: CurrentUser) {
    if (!user.email) {
      throw new BadRequestException('User email required to accept invitation');
    }

    const cleanEmail = user.email.toLowerCase().trim();

    return this.prisma.$transaction(async (tx) => {
      const invite = await tx.invitation.findFirst({
        where: {
          email: cleanEmail,
          status: InvitationStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
      });

      if (!invite) {
        throw new NotFoundException('No active pending invitation found for your email address');
      }

      // 1. Mark invitation accepted
      await tx.invitation.update({
        where: { id: invite.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // 2. Grant COLLEGE_ADMIN role inside transaction
      const updatedProfile = await tx.userProfile.update({
        where: { id: user.userId },
        data: {
          role: Role.COLLEGE_ADMIN,
          collegeId: invite.collegeId,
          status: UserStatus.ACTIVE,
        },
      });

      // 3. Update Supabase Auth app_metadata
      try {
        await this.supabase.auth.admin.updateUserById(user.userId, {
          app_metadata: {
            role: Role.COLLEGE_ADMIN,
            college_id: invite.collegeId,
          },
        });
      } catch (err) {
        this.logger.warn(`Could not update Supabase app_metadata: ${(err as Error).message}`);
      }

      this.jwtStrategy.invalidateCache(user.userId);
      return updatedProfile;
    });
  }
}
