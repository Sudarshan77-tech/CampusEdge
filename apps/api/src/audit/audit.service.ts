import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@campusedge/database';

export interface AuditEntry {
  actorId: string;
  collegeId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  requestId?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      const sanitizedMeta = entry.metadata ? this.sanitize(entry.metadata) : undefined;

      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          collegeId: entry.collegeId || null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId || null,
          metadata: sanitizedMeta ? (sanitizedMeta as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: entry.ipAddress || null,
          requestId: entry.requestId || null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${(err as Error).message}`);
    }
  }

  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'bearer', 'cookie'];
    const sanitized: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(obj)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        sanitized[k] = '[REDACTED]';
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        sanitized[k] = this.sanitize(v as Record<string, unknown>);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }
}
