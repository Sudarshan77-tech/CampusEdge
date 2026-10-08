import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateCollegeDto,
  UpdateCollegeDto,
  UpdateUserStatusDto,
  Role,
  UserStatus,
  InvitationStatus,
  CollegeStatus,
} from '@campusedge/shared';
import { JwtStrategy } from '../auth/jwt.strategy';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
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

  // --- College Management ---

  async listColleges(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { state: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { userProfiles: true, branches: true },
          },
        },
      }),
      this.prisma.college.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getCollege(id: string) {
    const college = await this.prisma.college.findUnique({
      where: { id },
      include: {
        branches: true,
        invitations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { userProfiles: true, branches: true },
        },
      },
    });
    if (!college) throw new NotFoundException('College not found');
    return college;
  }

  async createCollege(dto: CreateCollegeDto) {
    const existing = await this.prisma.college.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`College with slug "${dto.slug}" already exists`);
    }

    return this.prisma.college.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        city: dto.city,
        state: dto.state,
        status: CollegeStatus.ACTIVE,
        emailDomains: dto.emailDomains || [],
        requireStudentApproval: dto.requireStudentApproval ?? false,
        contactEmail: dto.contactEmail || null,
      },
    });
  }

  async updateCollege(id: string, dto: UpdateCollegeDto) {
    await this.getCollege(id);

    if (dto.slug) {
      const existing = await this.prisma.college.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    return this.prisma.college.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug.toLowerCase().trim() }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        ...(dto.status && { status: dto.status }),
        ...(dto.emailDomains && { emailDomains: dto.emailDomains }),
        ...(dto.requireStudentApproval !== undefined && {
          requireStudentApproval: dto.requireStudentApproval,
        }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
      },
    });
  }

  // --- College Admin Invitations ---

  async inviteCollegeAdmin(collegeId: string, email: string, invitedBy: string) {
    const college = await this.getCollege(collegeId);
    const cleanEmail = email.toLowerCase().trim();

    // Check existing pending invitation
    const existingInvite = await this.prisma.invitation.findFirst({
      where: {
        email: cleanEmail,
        collegeId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    // Set 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        collegeId,
        email: cleanEmail,
        role: Role.COLLEGE_ADMIN,
        invitedBy,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
    });

    // Send Supabase Admin Invitation / Magic Link
    try {
      await this.supabase.auth.admin.inviteUserByEmail(cleanEmail, {
        data: {
          college_id: collegeId,
          college_name: college.name,
        },
        redirectTo: 'http://localhost:3000/auth/callback',
      });
    } catch (err) {
      this.logger.warn(`Supabase invite email delivery notice: ${(err as Error).message}`);
    }

    return invitation;
  }

  async listCollegeAdmins(collegeId: string) {
    const [activeAdmins, pendingInvites] = await Promise.all([
      this.prisma.userProfile.findMany({
        where: { collegeId, role: Role.COLLEGE_ADMIN },
        select: { id: true, email: true, fullName: true, status: true, createdAt: true },
      }),
      this.prisma.invitation.findMany({
        where: { collegeId, status: InvitationStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { activeAdmins, pendingInvites };
  }

  async revokeInvitation(collegeId: string, invitationId: string) {
    const invite = await this.prisma.invitation.findFirst({
      where: { id: invitationId, collegeId },
    });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only revoke PENDING invitations');
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  // --- Users & Audit ---

  async listUsers(
    page = 1,
    limit = 20,
    filters?: { collegeId?: string; role?: Role; status?: UserStatus; search?: string },
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(filters?.collegeId && { collegeId: filters.collegeId }),
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { email: { contains: filters.search, mode: 'insensitive' as const } },
          { fullName: { contains: filters.search, mode: 'insensitive' as const } },
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
          college: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.userProfile.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.userProfile.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User profile not found');

    const updated = await this.prisma.userProfile.update({
      where: { id: userId },
      data: { status: dto.status },
    });

    // Invalidate cache immediately
    this.jwtStrategy.invalidateCache(userId);

    return updated;
  }

  async listAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          college: { select: { id: true, name: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, limit };
  }
}
