import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  NotificationCategory,
  NotificationChannel,
  EmailOutboxStatus,
  EmailSuppressionReason,
  NOTIFICATION_CATEGORIES,
  DAILY_EMAIL_CAP_PER_USER,
  isCurrentlyQuietHours,
  QueryNotificationsDto,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';
import { PrismaService } from '../prisma.service';
import { EMAIL_PROVIDER, EmailProvider } from './email-provider.interface';
import { UnsubscribeService } from './unsubscribe.service';

export interface UserCategoryPreference {
  category: NotificationCategory;
  name: string;
  description: string;
  canOptOut: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface EnqueueNotificationOptions {
  userId: string;
  collegeId?: string;
  category: NotificationCategory;
  title: string;
  body: string;
  linkUrl?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
  forceInApp?: boolean;
  forceEmail?: boolean;
  emailDetails?: {
    subject: string;
    html: string;
    text: string;
  };
}

const BACKOFF_MINUTES = [1, 5, 30, 120, 480]; // 1m, 5m, 30m, 2h, 8h

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    private readonly unsubscribeService: UnsubscribeService,
  ) {}

  /**
   * Calculate next 07:00 IST (UTC + 5:30) timestamp for quiet hours deferral.
   */
  calculateNextQuietHoursEnd(from: Date = new Date()): Date {
    // Current time in IST (shift +5h30m)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(from.getTime() + istOffsetMs);

    const istHour = istTime.getUTCHours();
    const istTarget = new Date(istTime);
    istTarget.setUTCHours(7, 0, 0, 0);

    // If IST hour is already >= 7 (e.g. 22:00 IST), next 7:00 IST is tomorrow
    if (istHour >= 7) {
      istTarget.setUTCDate(istTarget.getUTCDate() + 1);
    }

    // Convert IST target back to UTC
    return new Date(istTarget.getTime() - istOffsetMs);
  }

  getNextRetryDate(attempts: number): Date {
    const idx = Math.min(attempts - 1, BACKOFF_MINUTES.length - 1);
    const minutes = BACKOFF_MINUTES[Math.max(0, idx)] ?? 5;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Enqueue notification: persists in-app notification and email outbox according to preferences.
   */
  async enqueueNotification(options: EnqueueNotificationOptions): Promise<{
    inAppCreated: boolean;
    emailQueued: boolean;
  }> {
    const {
      userId,
      collegeId,
      category,
      title,
      body,
      linkUrl,
      dedupeKey,
      metadata = {},
      forceInApp = false,
      forceEmail = false,
      emailDetails,
    } = options;

    const categoryConfig = NOTIFICATION_CATEGORIES[category];
    let inAppCreated = false;
    let emailQueued = false;

    // Check user preference for this category
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId_category: { userId, category } },
    });

    const allowInApp =
      forceInApp || (preference ? preference.inAppEnabled : (categoryConfig?.defaultInApp ?? true));
    const allowEmail =
      forceEmail || (preference ? preference.emailEnabled : (categoryConfig?.defaultEmail ?? true));

    // 1. Process In-App Notification
    if (allowInApp) {
      let isDuplicate = false;
      if (dedupeKey) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId,
            dedupeKey,
            createdAt: { gte: twoHoursAgo },
          },
        });
        if (existing) {
          isDuplicate = true;
          this.logger.debug(`In-app notification skipped due to dedupeKey: ${dedupeKey}`);
        }
      }

      if (!isDuplicate) {
        await this.prisma.notification.create({
          data: {
            userId,
            collegeId,
            category,
            channel: NotificationChannel.IN_APP,
            title,
            body,
            linkUrl,
            dedupeKey,
            metadata: (metadata ?? {}) as Prisma.InputJsonValue,
          },
        });
        inAppCreated = true;
      }
    }

    // 2. Process Email Outbox
    if (emailDetails && allowEmail) {
      const user = await this.prisma.userProfile.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (user?.email) {
        // Check suppression
        const suppressed = await this.prisma.emailSuppression.findFirst({
          where: { email: user.email },
        });

        if (suppressed) {
          this.logger.warn(
            `Email to ${user.email} skipped due to suppression: ${suppressed.reason}`,
          );
        } else {
          // Check dedupe key for email
          let isEmailDuplicate = false;
          if (dedupeKey) {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const existingOutbox = await this.prisma.emailOutbox.findFirst({
              where: {
                userId,
                dedupeKey,
                createdAt: { gte: twoHoursAgo },
              },
            });
            if (existingOutbox) {
              isEmailDuplicate = true;
              this.logger.debug(`Email outbox skipped due to dedupeKey: ${dedupeKey}`);
            }
          }

          if (!isEmailDuplicate) {
            // Check Daily Cap for non-security categories
            const isSecurityCategory =
              category === NotificationCategory.ACCOUNT_SECURITY ||
              category === NotificationCategory.ACCOUNT_APPROVAL;

            let capExceeded = false;
            if (!isSecurityCategory) {
              const startOfTodayUtc = new Date();
              startOfTodayUtc.setUTCHours(0, 0, 0, 0);

              const sentCountToday = await this.prisma.emailOutbox.count({
                where: {
                  userId,
                  status: EmailOutboxStatus.SENT,
                  sentAt: { gte: startOfTodayUtc },
                  category: {
                    notIn: [
                      NotificationCategory.ACCOUNT_SECURITY,
                      NotificationCategory.ACCOUNT_APPROVAL,
                    ],
                  },
                },
              });

              if (sentCountToday >= DAILY_EMAIL_CAP_PER_USER) {
                capExceeded = true;
                this.logger.warn(
                  `User ${userId} reached daily email cap (${DAILY_EMAIL_CAP_PER_USER}). Skipping non-critical email.`,
                );
              }
            }

            if (!capExceeded) {
              // Check quiet hours
              let nextAttemptAt: Date | undefined = undefined;
              if (!categoryConfig?.bypassQuietHours && isCurrentlyQuietHours()) {
                nextAttemptAt = this.calculateNextQuietHoursEnd();
                this.logger.log(
                  `Quiet hours active: queuing email for category ${category} with deferred attempt at ${nextAttemptAt.toISOString()}`,
                );
              }

              await this.prisma.emailOutbox.create({
                data: {
                  userId,
                  collegeId,
                  recipientEmail: user.email,
                  recipientName: user.fullName,
                  category,
                  subject: emailDetails.subject,
                  bodyHtml: emailDetails.html,
                  bodyText: emailDetails.text,
                  status: EmailOutboxStatus.PENDING,
                  attempts: 0,
                  maxAttempts: 5,
                  nextAttemptAt,
                  dedupeKey,
                  metadata: (metadata ?? {}) as Prisma.InputJsonValue,
                },
              });
              emailQueued = true;
            }
          }
        }
      }
    }

    return { inAppCreated, emailQueued };
  }

  /**
   * Process email outbox batch.
   * Concurrency-safe worker with stuck row recovery and exponential backoff retry.
   */
  async processOutbox(batchSize: number = 20): Promise<{
    processedCount: number;
    sentCount: number;
    failedCount: number;
    cancelledCount: number;
  }> {
    const startTime = Date.now();
    let sentCount = 0;
    let failedCount = 0;
    let cancelledCount = 0;

    // 1. Stuck row recovery: reclaim rows in SENDING for > 5 minutes back to PENDING
    const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const reclaimed = await this.prisma.emailOutbox.updateMany({
      where: {
        status: EmailOutboxStatus.SENDING,
        updatedAt: { lt: stuckThreshold },
      },
      data: {
        status: EmailOutboxStatus.PENDING,
      },
    });

    if (reclaimed.count > 0) {
      this.logger.warn(`Reclaimed ${reclaimed.count} stuck email outbox rows to PENDING`);
    }

    // 2. Fetch batch candidate IDs with concurrency-safety
    const now = new Date();
    let candidateIds: string[] = [];

    try {
      // Use raw SQL FOR UPDATE SKIP LOCKED on PostgreSQL
      const rawRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM email_outbox
        WHERE status = 'PENDING'::email_outbox_status_enum
          AND (next_attempt_at IS NULL OR next_attempt_at <= ${now})
        ORDER BY created_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      `;
      candidateIds = rawRows.map((r) => r.id);
    } catch {
      // Fallback for environments where raw lock query is unsupported (e.g., unit test mocks)
      const pendingRows = await this.prisma.emailOutbox.findMany({
        where: {
          status: EmailOutboxStatus.PENDING,
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        orderBy: { createdAt: 'asc' },
        take: batchSize,
        select: { id: true },
      });
      candidateIds = pendingRows.map((r) => r.id);
    }

    if (candidateIds.length === 0) {
      return { processedCount: 0, sentCount: 0, failedCount: 0, cancelledCount: 0 };
    }

    // 3. Mark batch as SENDING
    await this.prisma.emailOutbox.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        status: EmailOutboxStatus.SENDING,
        lastAttemptAt: now,
      },
    });

    const items = await this.prisma.emailOutbox.findMany({
      where: { id: { in: candidateIds } },
    });

    // 4. Process each email
    for (const item of items) {
      let targetEmail = item.recipientEmail;
      let targetName = item.recipientName;

      // Resolve fresh recipient email at send time
      if (item.userId) {
        const freshUser = await this.prisma.userProfile.findUnique({
          where: { id: item.userId },
          select: { email: true, fullName: true },
        });
        if (freshUser?.email) {
          targetEmail = freshUser.email;
          targetName = freshUser.fullName;
        }
      }

      // Check recipient suppression
      const suppression = await this.prisma.emailSuppression.findFirst({
        where: { email: targetEmail },
      });

      if (suppression) {
        await this.prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            status: EmailOutboxStatus.SUPPRESSED,
            lastError: `Recipient email is suppressed: ${suppression.reason}`,
          },
        });
        cancelledCount++;
        continue;
      }

      // Generate unsubscribe token & link
      const itemCategory = item.category as unknown as NotificationCategory;
      const unsubscribeUrl = item.userId
        ? this.unsubscribeService.createUnsubscribeUrl(item.userId, itemCategory)
        : this.unsubscribeService.createUnsubscribeUrl('anonymous', itemCategory);

      try {
        const sendResult = await this.emailProvider.send({
          to: targetEmail,
          recipientName: targetName || undefined,
          subject: item.subject,
          html: item.bodyHtml,
          text: item.bodyText,
          category: itemCategory,
          idempotencyKey: item.id,
          unsubscribeUrl,
        });

        if (sendResult.status === 'SENT') {
          await this.prisma.emailOutbox.update({
            where: { id: item.id },
            data: {
              status: EmailOutboxStatus.SENT,
              sentAt: new Date(),
              providerMessageId: sendResult.providerMessageId,
              attempts: item.attempts + 1,
              lastError: null,
            },
          });
          sentCount++;
        } else {
          throw new Error(sendResult.error || 'Provider returned failed status');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const nextAttempts = item.attempts + 1;
        const maxAttempts = item.maxAttempts || 5;
        const isFinalFailure = nextAttempts >= maxAttempts;
        const nextRetry = isFinalFailure ? null : this.getNextRetryDate(nextAttempts);

        await this.prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            attempts: nextAttempts,
            status: isFinalFailure ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
            nextAttemptAt: nextRetry,
            lastError: errorMessage,
          },
        });
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Outbox batch completed: ${items.length} processed (${sentCount} sent, ${failedCount} failed, ${cancelledCount} cancelled) in ${duration}ms`,
    );

    return {
      processedCount: items.length,
      sentCount,
      failedCount,
      cancelledCount,
    };
  }

  // ---------------------------------------------------------------------------
  // In-App Notification Query & Read Handlers
  // ---------------------------------------------------------------------------

  async getMyNotifications(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<{
    notifications: Record<string, unknown>[];
    total: number;
    unreadCount: number;
    limit: number;
    offset: number;
  }> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      notifications: notifications as Record<string, unknown>[],
      total,
      unreadCount,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  // ---------------------------------------------------------------------------
  // Notification Preferences
  // ---------------------------------------------------------------------------

  async getMyPreferences(userId: string): Promise<UserCategoryPreference[]> {
    const stored = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const storedMap = new Map(stored.map((p) => [p.category, p]));
    const result: UserCategoryPreference[] = [];

    for (const cat of Object.values(NotificationCategory)) {
      const meta = NOTIFICATION_CATEGORIES[cat];
      const record = storedMap.get(cat);

      result.push({
        category: cat,
        name: meta?.name || cat,
        description: meta?.description || '',
        canOptOut: meta?.canOptOut ?? true,
        inAppEnabled: record ? record.inAppEnabled : (meta?.defaultInApp ?? true),
        emailEnabled: record ? record.emailEnabled : (meta?.defaultEmail ?? true),
      });
    }

    return result;
  }

  async updateMyPreferences(
    userId: string,
    collegeId: string | undefined,
    preferences: {
      category: NotificationCategory;
      inAppEnabled: boolean;
      emailEnabled: boolean;
    }[],
  ): Promise<UserCategoryPreference[]> {
    for (const pref of preferences) {
      const meta = NOTIFICATION_CATEGORIES[pref.category];

      // If category cannot opt out, enforce true
      const effectiveInApp = meta && !meta.canOptOut ? true : pref.inAppEnabled;
      const effectiveEmail = meta && !meta.canOptOut ? true : pref.emailEnabled;

      await this.prisma.notificationPreference.upsert({
        where: {
          userId_category: {
            userId,
            category: pref.category,
          },
        },
        create: {
          userId,
          collegeId,
          category: pref.category,
          inAppEnabled: effectiveInApp,
          emailEnabled: effectiveEmail,
        },
        update: {
          inAppEnabled: effectiveInApp,
          emailEnabled: effectiveEmail,
        },
      });
    }

    return this.getMyPreferences(userId);
  }

  // ---------------------------------------------------------------------------
  // Unsubscribe & Suppression
  // ---------------------------------------------------------------------------

  async unsubscribeByToken(token: string): Promise<{
    success: boolean;
    message: string;
    email: string;
    category?: NotificationCategory;
  }> {
    const verified = this.unsubscribeService.verifyToken(token);
    if (!verified) {
      throw new BadRequestException('Invalid or expired unsubscribe link');
    }

    const user = await this.prisma.userProfile.findUnique({
      where: { id: verified.userId },
      select: { email: true, collegeId: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found for unsubscribe token');
    }

    if (verified.category) {
      // Opt out of specific category
      const meta = NOTIFICATION_CATEGORIES[verified.category];
      if (meta && !meta.canOptOut) {
        throw new BadRequestException(
          `Category ${verified.category} is required and cannot be opted out.`,
        );
      }

      await this.prisma.notificationPreference.upsert({
        where: {
          userId_category: {
            userId: verified.userId,
            category: verified.category,
          },
        },
        create: {
          userId: verified.userId,
          collegeId: user.collegeId,
          category: verified.category,
          inAppEnabled: true,
          emailEnabled: false,
        },
        update: {
          emailEnabled: false,
        },
      });

      return {
        success: true,
        message: `Successfully unsubscribed from ${meta?.name || verified.category} notifications.`,
        email: user.email,
        category: verified.category,
      };
    } else {
      // Global email suppression
      await this.prisma.emailSuppression.upsert({
        where: {
          email_reason: {
            email: user.email,
            reason: EmailSuppressionReason.UNSUBSCRIBE_ALL,
          },
        },
        create: {
          email: user.email,
          reason: EmailSuppressionReason.UNSUBSCRIBE_ALL,
          details: 'User unsubscribed via one-click unsubscribe link',
        },
        update: {
          details: 'User re-confirmed unsubscribe via one-click unsubscribe link',
        },
      });

      return {
        success: true,
        message: 'Successfully unsubscribed from all optional email notifications.',
        email: user.email,
      };
    }
  }

  async recordSuppression(
    email: string,
    reason: EmailSuppressionReason,
    details?: string,
  ): Promise<void> {
    await this.prisma.emailSuppression.upsert({
      where: {
        email_reason: {
          email,
          reason,
        },
      },
      create: {
        email,
        reason,
        details,
      },
      update: {
        details,
      },
    });
  }
}
