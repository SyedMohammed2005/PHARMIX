import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/services/audit.service";
import { createNotification } from "@/services/notification.service";

import {
  AuditAction,
  NotificationSeverity,
  NotificationType,
} from "../src/generated/prisma/client";

export async function getBatches() {
  return prisma.batch.findMany({
    orderBy: {
      expiryDate: "asc",
    },
    include: {
      product: true,
    },
  });
}

export async function getBatchById(id: string) {
  return prisma.batch.findUnique({
    where: {
      id,
    },
    include: {
      product: true,
    },
  });
}

export async function createBatch(
  data: {
    batchNumber: string;
    productId: string;
    manufactureDate: Date;
    expiryDate: Date;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  },
  userId: string,
) {
  const product = await prisma.product.findUnique({
    where: {
      id: data.productId,
    },
  });

  if (!product) {
    const error = new Error("Product not found");
    error.name = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const existingBatch = await prisma.batch.findUnique({
    where: {
      batchNumber: data.batchNumber,
    },
  });

  if (existingBatch) {
    const error = new Error(
      "Batch with this batch number already exists",
    );
    error.name = "DUPLICATE_BATCH";
    throw error;
  }

  const batch = await prisma.batch.create({
    data,
    include: {
      product: true,
    },
  });

  await createAuditLog({
    userId,
    action: AuditAction.BATCH_CREATED,
    entity: "Batch",
    entityId: batch.id,
    description: `Batch "${batch.batchNumber}" was created for product "${batch.product.name}"`,
    afterData: batch,
  });

  return batch;
}

export async function updateBatch(
  id: string,
  data: {
    batchNumber?: string;
    manufactureDate?: Date;
    expiryDate?: Date;
    quantity?: number;
    purchasePrice?: number;
    sellingPrice?: number;
  },
  userId: string,
) {
  const existingBatch = await prisma.batch.findUnique({
    where: {
      id,
    },
    include: {
      product: true,
    },
  });

  if (!existingBatch) {
    return null;
  }

  if (
    data.batchNumber &&
    data.batchNumber !== existingBatch.batchNumber
  ) {
    const duplicateBatch =
      await prisma.batch.findUnique({
        where: {
          batchNumber: data.batchNumber,
        },
      });

    if (
      duplicateBatch &&
      duplicateBatch.id !== id
    ) {
      const error = new Error(
        "Batch with this batch number already exists",
      );
      error.name = "DUPLICATE_BATCH";
      throw error;
    }
  }

  const updatedBatch = await prisma.batch.update({
    where: {
      id,
    },
    data,
    include: {
      product: true,
    },
  });

  await createAuditLog({
    userId,
    action: AuditAction.BATCH_UPDATED,
    entity: "Batch",
    entityId: updatedBatch.id,
    description: `Batch "${updatedBatch.batchNumber}" was updated for product "${updatedBatch.product.name}"`,
    beforeData: existingBatch,
    afterData: updatedBatch,
  });

  return updatedBatch;
}

export async function deleteBatch(
  id: string,
  userId: string,
) {
  const existingBatch = await prisma.batch.findUnique({
    where: {
      id,
    },
    include: {
      product: true,
    },
  });

  if (!existingBatch) {
    return null;
  }

  await prisma.batch.delete({
    where: {
      id,
    },
  });

  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    entity: "Batch",
    entityId: existingBatch.id,
    description: `Batch "${existingBatch.batchNumber}" was deleted from product "${existingBatch.product.name}"`,
    beforeData: existingBatch,
  });

  return true;
}

export async function getExpiringBatches(
  days = 30,
) {
  const today = new Date();
  const futureDate = new Date(today);

  futureDate.setDate(
    futureDate.getDate() + days,
  );

  return prisma.batch.findMany({
    where: {
      expiryDate: {
        gte: today,
        lte: futureDate,
      },
      quantity: {
        gt: 0,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      expiryDate: "asc",
    },
  });
}

export async function getExpiredBatches() {
  const today = new Date();

  return prisma.batch.findMany({
    where: {
      expiryDate: {
        lt: today,
      },
      quantity: {
        gt: 0,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      expiryDate: "asc",
    },
  });
}

export async function createExpiryRiskNotification(
  batchId: string,
  userId: string,
  days = 30,
) {
  const batch = await prisma.batch.findUnique({
    where: {
      id: batchId,
    },
    include: {
      product: true,
    },
  });

  if (!batch) {
    return null;
  }

  if (batch.quantity <= 0) {
    return null;
  }

  const today = new Date();

  const expiryTime =
    batch.expiryDate.getTime();

  const todayTime =
    today.getTime();

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const daysUntilExpiry = Math.ceil(
    (expiryTime - todayTime) /
      millisecondsPerDay,
  );

  if (
    daysUntilExpiry < 0 ||
    daysUntilExpiry > days
  ) {
    return null;
  }

  const existingNotification =
    await prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.EXPIRY_RISK,
        entity: "Batch",
        entityId: batch.id,
        isRead: false,
      },
    });
if (existingNotification) {
  return null;
}
  const severity =
    daysUntilExpiry <= 7
      ? NotificationSeverity.CRITICAL
      : NotificationSeverity.WARNING;

  return createNotification({
    userId,
    type: NotificationType.EXPIRY_RISK,
    severity,
    title: "Batch expiry risk",
    message:
      daysUntilExpiry === 0
        ? `${batch.product.name} batch "${batch.batchNumber}" expires today. Remaining quantity: ${batch.quantity}.`
        : `${batch.product.name} batch "${batch.batchNumber}" expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Remaining quantity: ${batch.quantity}.`,
    entity: "Batch",
    entityId: batch.id,
  });
}

export async function generateExpiryRiskNotifications(
  userId: string,
  days = 30,
) {
  const expiringBatches =
    await getExpiringBatches(days);

  const notifications = [];

  for (const batch of expiringBatches) {
    const notification =
      await createExpiryRiskNotification(
        batch.id,
        userId,
        days,
      );

    if (notification) {
      notifications.push(notification);
    }
  }

  return {
    checkedBatches: expiringBatches.length,
    notificationsCreated: notifications.length,
    notifications,
  };
}
