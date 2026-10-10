import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';

@Injectable()
export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') || 'notifications@campusedge.io';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured. Falling back to local capture.');
      return {
        providerMessageId: `mock_${Date.now()}`,
        status: 'SENT',
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      };

      if (options.idempotencyKey) {
        headers['Idempotency-Key'] = options.idempotencyKey;
      }

      const payload = {
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        headers: {
          'List-Unsubscribe': `<${options.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-CampusEdge-Category': options.category,
        },
      };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        this.logger.error(`Resend API Error (${res.status}): ${errorBody}`);
        return {
          providerMessageId: '',
          status: 'FAILED',
          error: `Resend HTTP ${res.status}: ${errorBody}`,
        };
      }

      const data = (await res.json()) as { id: string };

      return {
        providerMessageId: data.id,
        status: 'SENT',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email via Resend: ${errorMsg}`);
      return {
        providerMessageId: '',
        status: 'FAILED',
        error: errorMsg,
      };
    }
  }
}
