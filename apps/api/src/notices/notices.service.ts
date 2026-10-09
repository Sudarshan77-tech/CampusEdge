import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  Role,
  CreateNoticeDto,
  UpdateNoticeDto,
  NoticeQueryDto,
  NoticeStatus,
  NoticeAudience,
} from '@campusedge/shared';

const ALLOWED_MIME_TYPES: Record<string, number[]> = {
  // PDF: %PDF -> 0x25, 0x50, 0x44, 0x46
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  // PNG: 0x89, 0x50, 0x4E, 0x47
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  // JPG: 0xFF, 0xD8, 0xFF
  'image/jpeg': [0xff, 0xd8, 0xff],
  // DOCX / XLSX (ZIP-based): PK.. -> 0x50, 0x4B, 0x03, 0x04
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    0x50, 0x4b, 0x03, 0x04,
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4b, 0x03, 0x04],
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class NoticesService {
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const secretKey =
      this.config.get<string>('SUPABASE_SECRET_KEY') ||
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && secretKey) {
      this.supabase = createClient(supabaseUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }

  /**
   * Create a new notice for a college.
   */
  async create(collegeId: string, userId: string, dto: CreateNoticeDto) {
    return this.prisma.notice.create({
      data: {
        collegeId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        audience: dto.audience ?? NoticeAudience.ALL,
        targetBranchIds: dto.targetBranchIds ?? [],
        targetBatchYears: dto.targetBatchYears ?? [],
        driveId: dto.driveId ?? null,
        isPinned: dto.isPinned ?? false,
        status: dto.status ?? NoticeStatus.DRAFT,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        publishedAt: dto.status === NoticeStatus.PUBLISHED ? new Date() : null,
        createdBy: userId,
      },
      include: {
        attachments: true,
        drive: {
          select: { id: true, title: true, company: { select: { name: true } } },
        },
      },
    });
  }

  /**
   * Update notice details with optimistic concurrency check.
   */
  async update(id: string, collegeId: string, dto: UpdateNoticeDto) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, collegeId },
    });
    if (!notice) throw new NotFoundException('Notice not found');

    if (dto.rowVersion !== undefined && notice.rowVersion !== dto.rowVersion) {
      throw new BadRequestException('Notice was modified concurrently. Please refresh.');
    }

    const data: Record<string, unknown> = {
      rowVersion: { increment: 1 },
    };

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.body !== undefined) data.body = dto.body.trim();
    if (dto.audience !== undefined) data.audience = dto.audience;
    if (dto.targetBranchIds !== undefined) data.targetBranchIds = dto.targetBranchIds;
    if (dto.targetBatchYears !== undefined) data.targetBatchYears = dto.targetBatchYears;
    if (dto.driveId !== undefined) data.driveId = dto.driveId;
    if (dto.isPinned !== undefined) data.isPinned = dto.isPinned;
    if (dto.expiresAt !== undefined)
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === NoticeStatus.PUBLISHED && !notice.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    return this.prisma.notice.update({
      where: { id_collegeId: { id, collegeId } },
      data,
      include: {
        attachments: true,
        drive: {
          select: { id: true, title: true, company: { select: { name: true } } },
        },
      },
    });
  }

  /**
   * Delete notice.
   */
  async delete(id: string, collegeId: string) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, collegeId },
    });
    if (!notice) throw new NotFoundException('Notice not found');

    await this.prisma.notice.delete({
      where: { id_collegeId: { id, collegeId } },
    });

    return { success: true };
  }

  /**
   * Publish notice.
   */
  async publish(id: string, collegeId: string) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, collegeId },
    });
    if (!notice) throw new NotFoundException('Notice not found');

    return this.prisma.notice.update({
      where: { id_collegeId: { id, collegeId } },
      data: {
        status: NoticeStatus.PUBLISHED,
        publishedAt: new Date(),
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * Archive notice.
   */
  async archive(id: string, collegeId: string) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, collegeId },
    });
    if (!notice) throw new NotFoundException('Notice not found');

    return this.prisma.notice.update({
      where: { id_collegeId: { id, collegeId } },
      data: {
        status: NoticeStatus.ARCHIVED,
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * List notices:
   * - Students: only PUBLISHED and unexpired notices matching audience/branch/batch.
   * - College Admins: can see all statuses for their college.
   */
  async list(user: CurrentUser, query: NoticeQueryDto) {
    if (!user.collegeId) {
      throw new ForbiddenException('College context required to view notices');
    }

    const collegeId = user.collegeId;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      collegeId,
    };

    if (user.role === Role.STUDENT) {
      const now = new Date();
      where.status = NoticeStatus.PUBLISHED;
      where.AND = [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ];

      // Fetch student profile branch & batch
      const studentProfile = await this.prisma.studentProfile.findFirst({
        where: { userId: user.userId, collegeId },
      });

      if (studentProfile) {
        where.OR = [
          { audience: NoticeAudience.ALL },
          {
            AND: [
              { audience: NoticeAudience.BY_BRANCH },
              studentProfile.branchId
                ? { targetBranchIds: { has: studentProfile.branchId } }
                : { targetBranchIds: { isEmpty: true } },
            ],
          },
          {
            AND: [
              { audience: NoticeAudience.BY_BATCH_YEAR },
              studentProfile.batchYear
                ? { targetBatchYears: { has: studentProfile.batchYear } }
                : { targetBatchYears: { isEmpty: true } },
            ],
          },
        ];
      }
    } else {
      // College Staff / Admin
      if (query.status) where.status = query.status;
      if (query.audience) where.audience = query.audience;
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          attachments: true,
          drive: {
            select: { id: true, title: true, company: { select: { name: true } } },
          },
        },
      }),
      this.prisma.notice.count({ where }),
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
   * Find single notice.
   */
  async findById(id: string, user: CurrentUser) {
    if (!user.collegeId) {
      throw new ForbiddenException('College context required');
    }

    const notice = await this.prisma.notice.findFirst({
      where: { id, collegeId: user.collegeId },
      include: {
        attachments: true,
        drive: {
          select: { id: true, title: true, company: { select: { name: true } } },
        },
      },
    });

    if (!notice) throw new NotFoundException('Notice not found');

    if (user.role === Role.STUDENT && notice.status !== NoticeStatus.PUBLISHED) {
      throw new ForbiddenException('You do not have access to view this notice');
    }

    return notice;
  }

  /**
   * Upload an attachment to private storage and record in database.
   */
  async uploadAttachment(
    noticeId: string,
    collegeId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    // 1. Verify notice exists
    const notice = await this.prisma.notice.findFirst({
      where: { id: noticeId, collegeId },
    });
    if (!notice) throw new NotFoundException('Notice not found');

    // 2. Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the 10 MB limit');
    }

    // 3. Validate magic bytes
    this.validateMagicBytes(file.buffer, file.mimetype);

    // 4. Sanitize file name
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `colleges/${collegeId}/notices/${noticeId}/${Date.now()}-${sanitizedName}`;

    // 5. Upload to Supabase Storage if configured
    if (this.supabase) {
      const { error } = await this.supabase.storage
        .from('college-files')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw new BadRequestException(`Storage upload failed: ${error.message}`);
      }
    }

    // 6. Record attachment in DB
    return this.prisma.noticeAttachment.create({
      data: {
        noticeId,
        collegeId,
        storagePath,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
  }

  /**
   * Get signed URL to download attachment.
   */
  async getAttachmentSignedUrl(attachmentId: string, user: CurrentUser) {
    if (!user.collegeId) {
      throw new ForbiddenException('College context required');
    }

    const attachment = await this.prisma.noticeAttachment.findFirst({
      where: { id: attachmentId, collegeId: user.collegeId },
      include: { notice: true },
    });

    if (!attachment) throw new NotFoundException('Attachment not found');

    if (user.role === Role.STUDENT && attachment.notice.status !== NoticeStatus.PUBLISHED) {
      throw new ForbiddenException('You cannot download attachments for unpublished notices');
    }

    if (!this.supabase) {
      return {
        signedUrl: `/mock-storage/${attachment.storagePath}`,
        fileName: attachment.fileName,
      };
    }

    const { data, error } = await this.supabase.storage
      .from('college-files')
      .createSignedUrl(attachment.storagePath, 900); // 15 mins

    if (error || !data) {
      throw new BadRequestException(`Could not generate signed URL: ${error?.message}`);
    }

    return {
      signedUrl: data.signedUrl,
      fileName: attachment.fileName,
    };
  }

  /**
   * Helper to validate file magic bytes.
   */
  private validateMagicBytes(buffer: Buffer, mimeType: string) {
    const expected = ALLOWED_MIME_TYPES[mimeType];
    if (!expected) {
      throw new BadRequestException(
        `File type ${mimeType} is not supported. Allowed types: PDF, PNG, JPG, DOCX, XLSX`,
      );
    }

    if (buffer.length < expected.length) {
      throw new BadRequestException('File is corrupted or too small');
    }

    const matches = expected.every((byte, idx) => buffer[idx] === byte);
    if (!matches) {
      throw new BadRequestException(
        'File content does not match its declared type (magic byte check failed)',
      );
    }
  }
}
