import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  InternalNotificationsController,
} from './notifications.controller';
import { WebhooksController } from './webhooks.controller';
import { UnsubscribeService } from './unsubscribe.service';
import { EMAIL_PROVIDER } from './email-provider.interface';
import { CaptureProvider } from './capture.provider';
import { ResendProvider } from './resend.provider';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController, InternalNotificationsController, WebhooksController],
  providers: [
    NotificationsService,
    UnsubscribeService,
    CaptureProvider,
    ResendProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('RESEND_API_KEY');
        if (apiKey) {
          return new ResendProvider(config);
        }
        return new CaptureProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [NotificationsService, EMAIL_PROVIDER, UnsubscribeService],
})
export class NotificationsModule {}
