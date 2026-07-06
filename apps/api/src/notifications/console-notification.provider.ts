import { Injectable, Logger } from '@nestjs/common';
import type {
  NotificationPayload,
  NotificationProvider,
} from './notification-provider.js';

@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async send(payload: NotificationPayload) {
    this.logger.log(JSON.stringify({ event: 'notification.send', payload }));
  }
}
