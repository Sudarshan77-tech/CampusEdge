import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { NotificationCategory } from '@campusedge/shared';

export interface UnsubscribePayload {
  userId: string;
  category?: NotificationCategory;
  timestamp: number;
}

@Injectable()
export class UnsubscribeService {
  private readonly logger = new Logger(UnsubscribeService.name);
  private readonly secret: string;
  private readonly webOrigin: string;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('UNSUBSCRIBE_SIGNING_SECRET') ||
      'local-dev-unsub-secret-key-at-least-32-chars';
    this.webOrigin = this.configService.get<string>('WEB_ORIGIN') || 'http://localhost:3000';
  }

  generateToken(userId: string, category?: NotificationCategory): string {
    const timestamp = Date.now();
    const payloadStr = `${userId}:${category || 'ALL'}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', this.secret).update(payloadStr).digest('hex');

    const combined = `${payloadStr}:${hmac}`;
    return Buffer.from(combined).toString('base64url');
  }

  verifyToken(token: string): UnsubscribePayload | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');

      if (parts.length !== 4) {
        return null;
      }

      const [userId, categoryStr, timestampStr, signature] = parts;
      if (!userId || !categoryStr || !timestampStr || !signature) {
        return null;
      }

      const payloadStr = `${userId}:${categoryStr}:${timestampStr}`;
      const expectedHmac = crypto
        .createHmac('sha256', this.secret)
        .update(payloadStr)
        .digest('hex');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedHmac);

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null;
      }

      return {
        userId,
        category: categoryStr === 'ALL' ? undefined : (categoryStr as NotificationCategory),
        timestamp: parseInt(timestampStr, 10),
      };
    } catch (err: unknown) {
      this.logger.warn(`Failed to verify unsubscribe token: ${err}`);
      return null;
    }
  }

  createUnsubscribeUrl(userId: string, category?: NotificationCategory): string {
    const token = this.generateToken(userId, category);
    return `${this.webOrigin}/notifications/unsubscribe?token=${token}`;
  }
}
