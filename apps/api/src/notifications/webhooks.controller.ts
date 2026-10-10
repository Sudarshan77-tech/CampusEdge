import {
  Controller,
  Post,
  Headers,
  Body,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Prisma } from '@campusedge/database';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from './notifications.service';
import { EmailSuppressionReason } from '@campusedge/shared';

export interface ResendWebhookPayload {
  id?: string;
  type?: string;
  data?: {
    to?: string[] | string;
    email?: string;
    bounce_type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verifies Svix webhook signature.
   */
  private verifySvixSignature(
    secret: string,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
    body: unknown,
  ): boolean {
    try {
      // Svix timestamp tolerance (5 minutes)
      const timestampSec = parseInt(svixTimestamp, 10);
      const nowSec = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSec - timestampSec) > 300) {
        this.logger.warn(`Svix timestamp out of tolerance: ${svixTimestamp}`);
        return false;
      }

      // Prepare key
      const cleanSecret = secret.startsWith('whsec_') ? secret.substring(6) : secret;
      const keyBuffer = Buffer.from(cleanSecret, 'base64');

      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      const toSign = `${svixId}.${svixTimestamp}.${payload}`;

      const computedHmac = crypto
        .createHmac('sha256', keyBuffer.length > 0 ? keyBuffer : secret)
        .update(toSign)
        .digest('base64');

      // svixSignature format: "v1,signature1 v1,signature2"
      const passedSignatures = svixSignature
        .split(' ')
        .map((sig) => (sig.startsWith('v1,') ? sig.substring(3) : sig));

      return passedSignatures.some((sig) => {
        try {
          const sigBuf = Buffer.from(sig, 'base64');
          const expBuf = Buffer.from(computedHmac, 'base64');
          return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
        } catch {
          return false;
        }
      });
    } catch (err: unknown) {
      this.logger.error(`Svix signature verification failed: ${err}`);
      return false;
    }
  }

  @Public()
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Resend inbound delivery webhooks (bounces, complaints)' })
  async handleResendWebhook(
    @Headers('svix-id') svixId: string | undefined,
    @Headers('svix-timestamp') svixTimestamp: string | undefined,
    @Headers('svix-signature') svixSignature: string | undefined,
    @Body() body: ResendWebhookPayload,
  ) {
    const webhookSecret = this.configService.get<string>('RESEND_WEBHOOK_SECRET');

    // If webhook secret configured, strictly verify Svix signature
    if (webhookSecret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        throw new UnauthorizedException('Missing required Svix webhook headers');
      }

      const isValid = this.verifySvixSignature(
        webhookSecret,
        svixId,
        svixTimestamp,
        svixSignature,
        body,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid Svix webhook signature');
      }
    }

    const eventId = svixId || body?.id || `resend_${Date.now()}_${Math.random()}`;
    const eventType = body?.type || 'unknown';

    // 1. Idempotency Check via WebhookEvent
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: 'resend',
          eventId,
        },
      },
    });

    if (existing) {
      this.logger.log(`Resend webhook event ${eventId} already processed.`);
      return { success: true, message: 'Already processed' };
    }

    // Record webhook event entry
    await this.prisma.webhookEvent.create({
      data: {
        provider: 'resend',
        eventId,
        eventType,
        payload: (body ?? {}) as Prisma.InputJsonValue,
        processed: false,
      },
    });

    // 2. Process Delivery Feedback
    try {
      const recipientList: string[] = [];
      const dataTo = body?.data?.to;
      if (Array.isArray(dataTo)) {
        recipientList.push(...dataTo);
      } else if (typeof dataTo === 'string') {
        recipientList.push(dataTo);
      } else if (body?.data?.email) {
        recipientList.push(body.data.email);
      }

      if (eventType === 'email.bounced') {
        for (const email of recipientList) {
          await this.notificationsService.recordSuppression(
            email,
            EmailSuppressionReason.BOUNCE,
            `Resend delivery bounce event: ${body?.data?.bounce_type || 'Hard bounce'}`,
          );
          this.logger.warn(`Added ${email} to email suppressions due to bounce`);
        }
      } else if (eventType === 'email.complained') {
        for (const email of recipientList) {
          await this.notificationsService.recordSuppression(
            email,
            EmailSuppressionReason.COMPLAINT,
            'Recipient registered spam complaint with email provider',
          );
          this.logger.warn(`Added ${email} to email suppressions due to spam complaint`);
        }
      }

      // Mark event as processed
      await this.prisma.webhookEvent.update({
        where: {
          provider_eventId: {
            provider: 'resend',
            eventId,
          },
        },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return { success: true, eventType };
    } catch (err: unknown) {
      this.logger.error(`Error processing webhook event ${eventId}: ${err}`);
      throw err;
    }
  }
}
