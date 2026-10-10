import { NotificationCategory } from '@campusedge/shared';

export interface SendEmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text: string;
  category: NotificationCategory;
  idempotencyKey?: string;
  unsubscribeUrl: string;
}

export interface SendEmailResult {
  providerMessageId: string;
  status: 'SENT' | 'FAILED';
  error?: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';
