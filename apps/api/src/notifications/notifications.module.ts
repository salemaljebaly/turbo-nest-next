import { Module } from '@nestjs/common';
import { ConsoleNotificationProvider } from './console-notification.provider.js';
import { NOTIFICATION_PROVIDER } from './notification-provider.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  providers: [
    NotificationsService,
    ConsoleNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      useExisting: ConsoleNotificationProvider,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
