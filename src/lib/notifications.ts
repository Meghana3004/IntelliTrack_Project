import { prisma } from "@/lib/prisma";
import { publishNotification } from "@/lib/notifications-bus";

interface CreateNotificationInput {
  userId: string;
  type: string;
  message: string;
  relatedExceptionId?: string | null;
}

/** Creates a Notification row and pushes it live to that user's SSE stream. */
export async function notifyUser({ userId, type, message, relatedExceptionId }: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      message,
      relatedExceptionId: relatedExceptionId ?? null,
    },
  });

  publishNotification({
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    message: notification.message,
    relatedExceptionId: notification.relatedExceptionId,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  });

  return notification;
}
