import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { eq, notifications, type Database } from '@repo/db';
import { enqueueJob, QUEUE_NAMES } from '@repo/jobs';
import { DATABASE_TOKEN } from '../database/database.module.js';
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from './notification-provider.js';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    @Inject(NOTIFICATION_PROVIDER)
    private readonly provider: NotificationProvider,
  ) {}

  async queue(userId: string, title: string, body: string) {
    const id = randomUUID();
    await this.db.insert(notifications).values({
      id,
      userId,
      channel: 'console',
      title,
      body,
    });
    await enqueueJob(
      'notification.send',
      { notificationId: id },
      {
        queue: QUEUE_NAMES.notifications,
      },
    );
    return { id };
  }

  async send(notificationId: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));
    if (!notification) return;
    await this.provider.send(notification);
    await this.db
      .update(notifications)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }
}
