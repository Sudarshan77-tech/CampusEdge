import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  NotificationCategory,
  NotificationChannel,
  EmailOutboxStatus,
  EmailSuppressionReason,
} from '@campusedge/shared';
import * as crypto from 'crypto';
import { NotificationsService } from './notifications.service';
import { UnsubscribeService } from './unsubscribe.service';
import { EMAIL_PROVIDER } from './email-provider.interface';
import { CaptureProvider } from './capture.provider';
import { PrismaService } from '../prisma.service';
import { WebhooksController } from './webhooks.controller';
import { assertNoDemographicsInEmailContent } from './templates/email-templates';

interface MockPrismaService {
  notification: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    updateMany: jest.Mock;
  };
  notificationPreference: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    upsert: jest.Mock;
  };
  emailOutbox: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  emailSuppression: {
    findFirst: jest.Mock;
    upsert: jest.Mock;
  };
  userProfile: {
    findUnique: jest.Mock;
  };
  webhookEvent: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  $queryRaw: jest.Mock;
}

describe('Notifications & Email Outbox Pipeline', () => {
  let service: NotificationsService;
  let unsubscribeService: UnsubscribeService;
  let captureProvider: CaptureProvider;
  let webhooksController: WebhooksController;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    captureProvider = new CaptureProvider();

    prisma = {
      notification: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'notif-1', ...data })),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      notificationPreference: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest
          .fn()
          .mockImplementation(({ create, update }) => Promise.resolve({ ...create, ...update })),
      },
      emailOutbox: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'outbox-1', ...data })),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'outbox-1', ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      emailSuppression: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'supp-1' }),
      },
      userProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'student@example.edu',
          fullName: 'Alice Student',
          collegeId: 'college-1',
        }),
      },
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'ev-1', ...data })),
        update: jest.fn().mockResolvedValue({ id: 'ev-1', processed: true }),
      },
      $queryRaw: jest.fn().mockRejectedValue(new Error('Use fallback in unit test')),
    };

    const configServiceMock = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
        if (key === 'UNSUBSCRIBE_SIGNING_SECRET')
          return 'test-signing-secret-at-least-32-chars-long';
        if (key === 'WEB_ORIGIN') return 'http://localhost:3000';
        if (key === 'RESEND_WEBHOOK_SECRET') return 'whsec_dGVzdC1zZWNyZXQtZm9yLXN2aXg=';
        if (key === 'INTERNAL_JOB_SECRET') return 'super-secret-job-key';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        NotificationsService,
        UnsubscribeService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: EMAIL_PROVIDER, useValue: captureProvider },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    unsubscribeService = module.get<UnsubscribeService>(UnsubscribeService);
    webhooksController = module.get<WebhooksController>(WebhooksController);
  });

  describe('Enqueuing Notifications', () => {
    it('enqueues in-app notification and email outbox row', async () => {
      const result = await service.enqueueNotification({
        userId: 'user-1',
        collegeId: 'college-1',
        category: NotificationCategory.DRIVE_PUBLISHED,
        title: 'New Drive: Google',
        body: 'Google drive open for registration',
        emailDetails: {
          subject: 'New Drive: Google',
          html: '<p>Google is hiring</p>',
          text: 'Google is hiring',
        },
      });

      expect(result.inAppCreated).toBe(true);
      expect(result.emailQueued).toBe(true);
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            channel: NotificationChannel.IN_APP,
            title: 'New Drive: Google',
          }),
        }),
      );
      expect(prisma.emailOutbox.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            recipientEmail: 'student@example.edu',
            status: EmailOutboxStatus.PENDING,
          }),
        }),
      );
    });

    it('skips email when user suppression exists', async () => {
      prisma.emailSuppression.findFirst.mockResolvedValueOnce({
        id: 'supp-1',
        email: 'student@example.edu',
        reason: EmailSuppressionReason.UNSUBSCRIBE_ALL,
      });

      const result = await service.enqueueNotification({
        userId: 'user-1',
        category: NotificationCategory.DRIVE_PUBLISHED,
        title: 'New Drive',
        body: 'Details',
        emailDetails: {
          subject: 'New Drive',
          html: '<p>Details</p>',
          text: 'Details',
        },
      });

      expect(result.inAppCreated).toBe(true);
      expect(result.emailQueued).toBe(false);
      expect(prisma.emailOutbox.create).not.toHaveBeenCalled();
    });

    it('skips non-critical email when daily cap of 6 emails is reached', async () => {
      prisma.emailOutbox.count.mockResolvedValueOnce(6);

      const result = await service.enqueueNotification({
        userId: 'user-1',
        category: NotificationCategory.DRIVE_PUBLISHED,
        title: 'New Drive',
        body: 'Details',
        emailDetails: {
          subject: 'New Drive',
          html: '<p>Details</p>',
          text: 'Details',
        },
      });

      expect(result.inAppCreated).toBe(true);
      expect(result.emailQueued).toBe(false);
    });

    it('bypasses daily cap for critical security notifications', async () => {
      prisma.emailOutbox.count.mockResolvedValueOnce(10); // user already received 10 emails

      const result = await service.enqueueNotification({
        userId: 'user-1',
        category: NotificationCategory.ACCOUNT_SECURITY,
        title: 'New login from unknown device',
        body: 'Security alert',
        emailDetails: {
          subject: 'Security Alert',
          html: '<p>Security</p>',
          text: 'Security',
        },
      });

      expect(result.inAppCreated).toBe(true);
      expect(result.emailQueued).toBe(true);
    });

    it('respects dedupeKey and prevents duplicate in-app and email entries', async () => {
      prisma.notification.findFirst.mockResolvedValueOnce({ id: 'existing-notif' });
      prisma.emailOutbox.findFirst.mockResolvedValueOnce({ id: 'existing-outbox' });

      const result = await service.enqueueNotification({
        userId: 'user-1',
        category: NotificationCategory.DRIVE_PUBLISHED,
        title: 'Drive',
        body: 'Details',
        dedupeKey: 'DRIVE_PUBLISHED:user-1:drive-123:once',
        emailDetails: {
          subject: 'Drive',
          html: '<p>Drive</p>',
          text: 'Drive',
        },
      });

      expect(result.inAppCreated).toBe(false);
      expect(result.emailQueued).toBe(false);
    });
  });

  describe('Outbox Worker & Concurrency Recovery', () => {
    it('reclaims stuck rows older than 5 minutes back to PENDING', async () => {
      prisma.emailOutbox.updateMany.mockResolvedValueOnce({ count: 3 });

      await service.processOutbox(20);

      expect(prisma.emailOutbox.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EmailOutboxStatus.SENDING,
          }),
          data: {
            status: EmailOutboxStatus.PENDING,
          },
        }),
      );
    });

    it('processes batch of pending rows, resolving fresh email and advancing to SENT', async () => {
      prisma.emailOutbox.findMany
        .mockResolvedValueOnce([{ id: 'row-1' }]) // candidate pending query
        .mockResolvedValueOnce([
          {
            id: 'row-1',
            userId: 'user-1',
            recipientEmail: 'old-stale@example.edu',
            category: NotificationCategory.APPLICATION_STATUS,
            subject: 'Shortlisted!',
            bodyHtml: '<p>You are shortlisted</p>',
            bodyText: 'You are shortlisted',
            status: EmailOutboxStatus.SENDING,
            attempts: 0,
            maxAttempts: 5,
          },
        ]);

      prisma.userProfile.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'fresh-alice@example.edu',
        fullName: 'Alice Updated',
      });

      const metrics = await service.processOutbox(10);

      expect(metrics.processedCount).toBe(1);
      expect(metrics.sentCount).toBe(1);
      expect(metrics.failedCount).toBe(0);

      // Verify email was sent to fresh email, not stale email
      expect(captureProvider.capturedEmails).toHaveLength(1);
      expect(captureProvider.capturedEmails[0]?.to).toBe('fresh-alice@example.edu');

      // Verify status set to SENT
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'row-1' },
          data: expect.objectContaining({
            status: EmailOutboxStatus.SENT,
            attempts: 1,
          }),
        }),
      );
    });

    it('cancels delivery if recipient became suppressed between queue and send', async () => {
      prisma.emailOutbox.findMany.mockResolvedValueOnce([{ id: 'row-2' }]).mockResolvedValueOnce([
        {
          id: 'row-2',
          userId: 'user-1',
          recipientEmail: 'student@example.edu',
          category: NotificationCategory.DRIVE_PUBLISHED,
          subject: 'Drive',
          bodyHtml: '<p>Drive</p>',
          bodyText: 'Drive',
          attempts: 0,
          maxAttempts: 5,
        },
      ]);

      prisma.emailSuppression.findFirst.mockResolvedValueOnce({
        id: 'supp-1',
        email: 'student@example.edu',
        reason: EmailSuppressionReason.BOUNCE,
      });

      const metrics = await service.processOutbox(10);

      expect(metrics.cancelledCount).toBe(1);
      expect(captureProvider.capturedEmails).toHaveLength(0);
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'row-2' },
          data: expect.objectContaining({
            status: EmailOutboxStatus.SUPPRESSED,
          }),
        }),
      );
    });

    it('calculates exponential backoff intervals on provider delivery failures', async () => {
      // 1m, 5m, 30m, 2h, 8h
      const retry1 = service.getNextRetryDate(1);
      const retry2 = service.getNextRetryDate(2);
      const retry3 = service.getNextRetryDate(3);
      const retry4 = service.getNextRetryDate(4);
      const retry5 = service.getNextRetryDate(5);

      const now = Date.now();
      expect(retry1.getTime() - now).toBeGreaterThanOrEqual(58 * 1000);
      expect(retry1.getTime() - now).toBeLessThanOrEqual(62 * 1000);

      expect(retry2.getTime() - now).toBeGreaterThanOrEqual(4.8 * 60 * 1000);
      expect(retry3.getTime() - now).toBeGreaterThanOrEqual(29 * 60 * 1000);
      expect(retry4.getTime() - now).toBeGreaterThanOrEqual(119 * 60 * 1000);
      expect(retry5.getTime() - now).toBeGreaterThanOrEqual(479 * 60 * 1000);
    });
  });

  describe('Unsubscribe & Token Verification', () => {
    it('generates HMAC signed unsubscribe tokens and verifies them', () => {
      const token = unsubscribeService.generateToken(
        'user-123',
        NotificationCategory.WEEKLY_DIGEST,
      );
      expect(typeof token).toBe('string');

      const payload = unsubscribeService.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user-123');
      expect(payload?.category).toBe(NotificationCategory.WEEKLY_DIGEST);
    });

    it('rejects tampered unsubscribe tokens', () => {
      const validToken = unsubscribeService.generateToken(
        'user-123',
        NotificationCategory.WEEKLY_DIGEST,
      );
      const decoded = Buffer.from(validToken, 'base64url').toString('utf8');
      const tampered = Buffer.from(decoded.replace('user-123', 'user-999')).toString('base64url');

      const payload = unsubscribeService.verifyToken(tampered);
      expect(payload).toBeNull();
    });

    it('processes category unsubscribe successfully', async () => {
      const token = unsubscribeService.generateToken(
        'user-1',
        NotificationCategory.DRIVE_PUBLISHED,
      );
      const res = await service.unsubscribeByToken(token);

      expect(res.success).toBe(true);
      expect(res.category).toBe(NotificationCategory.DRIVE_PUBLISHED);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_category: {
              userId: 'user-1',
              category: NotificationCategory.DRIVE_PUBLISHED,
            },
          },
          update: { emailEnabled: false },
        }),
      );
    });
  });

  describe('Security & Demographic Exclusion Guard', () => {
    it('throws error when demographic fields are included in email payloads', () => {
      expect(() => {
        assertNoDemographicsInEmailContent({
          companyName: 'Acme Corp',
          gender: 'Female', // FORBIDDEN!
        });
      }).toThrow(/Sensitive identity field 'gender' is strictly forbidden/);

      expect(() => {
        assertNoDemographicsInEmailContent({
          driveTitle: 'Campus Drive',
          caste: 'General', // FORBIDDEN!
        });
      }).toThrow(/Sensitive identity field 'caste' is strictly forbidden/);

      expect(() => {
        assertNoDemographicsInEmailContent({
          companyName: 'Acme Corp',
          religion: 'None', // FORBIDDEN!
        });
      }).toThrow(/Sensitive identity field 'religion' is strictly forbidden/);
    });

    it('permits valid educational and drive content without demographic keys', () => {
      expect(() => {
        assertNoDemographicsInEmailContent({
          companyName: 'Google',
          driveTitle: 'Software Engineer 2027',
          registrationDeadline: '2026-10-15',
          hoursRemaining: 24,
        });
      }).not.toThrow();
    });
  });

  describe('Webhook & Svix Inbound Verification', () => {
    it('verifies Svix signatures and suppresses bounced emails', async () => {
      const secret = 'whsec_dGVzdC1zZWNyZXQtZm9yLXN2aXg=';
      const cleanSecret = secret.substring(6);
      const keyBuffer = Buffer.from(cleanSecret, 'base64');
      const svixId = 'msg_test_12345';
      const svixTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = {
        type: 'email.bounced',
        data: {
          to: ['bounced-student@example.edu'],
          bounce_type: 'Permanent mailbox unavailable',
        },
      };

      const payload = JSON.stringify(body);
      const toSign = `${svixId}.${svixTimestamp}.${payload}`;
      const sig = crypto.createHmac('sha256', keyBuffer).update(toSign).digest('base64');
      const svixSignature = `v1,${sig}`;

      const response = await webhooksController.handleResendWebhook(
        svixId,
        svixTimestamp,
        svixSignature,
        body,
      );

      expect(response.success).toBe(true);
      expect(prisma.emailSuppression.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email_reason: {
              email: 'bounced-student@example.edu',
              reason: EmailSuppressionReason.BOUNCE,
            },
          },
        }),
      );
    });
  });
});
