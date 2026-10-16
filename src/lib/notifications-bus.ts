import { EventEmitter } from "node:events";

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  message: string;
  relatedExceptionId: string | null;
  read: boolean;
  createdAt: string;
}

// Module-scoped singleton (see src/lib/prisma.ts for why this pattern is
// needed to survive Next.js dev-mode module reloads).
const globalForBus = globalThis as unknown as {
  notificationsBus: EventEmitter | undefined;
};

const bus = globalForBus.notificationsBus ?? new EventEmitter();
bus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") globalForBus.notificationsBus = bus;

function channel(userId: string) {
  return `notification:${userId}`;
}

export function publishNotification(notification: NotificationPayload) {
  bus.emit(channel(notification.userId), notification);
}

export function subscribeToNotifications(
  userId: string,
  listener: (notification: NotificationPayload) => void,
) {
  const event = channel(userId);
  bus.on(event, listener);
  return () => bus.off(event, listener);
}
