import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';

@Injectable()
export class CaptureProvider implements EmailProvider {
  private readonly logger = new Logger(CaptureProvider.name);
  public readonly capturedEmails: SendEmailOptions[] = [];

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    this.capturedEmails.push(options);

    const messageId = `capture_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(
      `[Captured Email] To: ${options.to} | Subject: "${options.subject}" | MessageId: ${messageId}`,
    );

    return {
      providerMessageId: messageId,
      status: 'SENT',
    };
  }

  clear(): void {
    this.capturedEmails.length = 0;
  }
}
