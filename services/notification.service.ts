import { prisma } from "@/lib/prisma";
import {
  NotificationSeverity,
  NotificationType,
  Prisma,
} from "../src/generated/prisma/client";

type CreateNotificationInput = {
  userId?: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  entity?: string;
  entityId?: string;
};

type GetNotificationsInput = {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  severity?: NotificationSeverity;
  page?: number;
  limit?: number;
};

export async function createNotification(
  data: CreateNotificationInput,
) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      entity: data.entity,
      entityId: data.entityId,
    },
  });
}

export async function getNotifications(
  filters: GetNotificationsInput = {},
) {
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(
    Math.max(filters.limit ?? 20, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const where: Prisma.NotificationWhereInput = {
    userId: filters.userId,
    isRead: filters.isRead,
    type: filters.type,
    severity: filters.severity,
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.notification.count({
      where,
    }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadNotificationCount(
  userId?: string,
) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function getNotificationById(
  id: string,
  userId?: string,
) {
  return prisma.notification.findFirst({
    where: {
      id,
      userId,
    },
  });
}

export async function markNotificationAsRead(
  id: string,
  userId?: string,
) {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

  if (!notification) {
    return null;
  }

  return prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      isRead: true,
    },
  });
}

export async function markAllNotificationsAsRead(
  userId: string,
) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}