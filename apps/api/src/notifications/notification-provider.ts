export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
};

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
