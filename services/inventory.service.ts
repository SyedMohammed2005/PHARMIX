import { prisma } from "@/lib/prisma";
import { createInventorySchema } from "@/lib/validations/inventory";
import { createAuditLog } from "@/services/audit.service";
import { createNotification } from "@/services/notification.service";

import {
  AuditAction,
  NotificationSeverity,
  NotificationType,
} from "../src/generated/prisma/client";

import { z } from "zod";

type CreateInventoryInput = z.infer<
  typeof createInventorySchema
>;

type UpdateInventoryInput = {
  quantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
};

const inventoryInclude = {
  product: {
    include: {
      category: true,
      supplier: true,
    },
  },
};

export async function getInventory() {
  return prisma.inventory.findMany({
    include: inventoryInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createInventory(
  data: CreateInventoryInput,
  userId: string,
) {
  // Check product exists
  const product = await prisma.product.findUnique({
    where: {
      id: data.productId,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check duplicate inventory
  const existingInventory =
    await prisma.inventory.findUnique({
      where: {
        productId: data.productId,
      },
    });

  if (existingInventory) {
    throw new Error(
      "Inventory already exists for this product",
    );
  }

  // Validate stock limits
  if (
    data.maximumStock !== undefined &&
    data.maximumStock < data.minimumStock
  ) {
    throw new Error(
      "Maximum stock cannot be less than minimum stock",
    );
  }

  // Create inventory
  const inventory = await prisma.inventory.create({
    data: {
      productId: data.productId,
      quantity: data.quantity,
      minimumStock: data.minimumStock,
      maximumStock: data.maximumStock,
      reorderPoint: data.reorderPoint,
    },
    include: inventoryInclude,
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    entity: "Inventory",
    entityId: inventory.id,
    description: `Inventory was created for product "${product.name}"`,
    afterData: inventory,
  });

  return inventory;
}

export async function updateInventory(
  id: string,
  data: UpdateInventoryInput,
  userId: string,
) {
  // Find existing inventory
  const existingInventory =
    await prisma.inventory.findUnique({
      where: {
        id,
      },
      include: inventoryInclude,
    });

  if (!existingInventory) {
    return null;
  }

  // Calculate final values
  const minimumStock =
    data.minimumStock ??
    existingInventory.minimumStock;

  const maximumStock =
    data.maximumStock ??
    existingInventory.maximumStock;

  const quantity =
    data.quantity ??
    existingInventory.quantity;

  const reorderPoint =
    data.reorderPoint ??
    existingInventory.reorderPoint;

  // Determine previous and new low-stock states
  const wasLowStock =
    existingInventory.reorderPoint !== null &&
    existingInventory.quantity <=
      existingInventory.reorderPoint;

  const isLowStock =
    reorderPoint !== null &&
    quantity <= reorderPoint;

  const enteredLowStock =
    !wasLowStock && isLowStock;

  // Validate minimum and maximum stock
  if (
    maximumStock !== null &&
    maximumStock < minimumStock
  ) {
    throw new Error(
      "Maximum stock cannot be less than minimum stock",
    );
  }

  // Validate quantity
  if (
    maximumStock !== null &&
    quantity > maximumStock
  ) {
    throw new Error(
      "Quantity cannot exceed maximum stock",
    );
  }

  // Validate reorder point
  if (
    reorderPoint !== null &&
    reorderPoint < minimumStock
  ) {
    throw new Error(
      "Reorder point cannot be less than minimum stock",
    );
  }

  if (
    reorderPoint !== null &&
    maximumStock !== null &&
    reorderPoint > maximumStock
  ) {
    throw new Error(
      "Reorder point cannot be greater than maximum stock",
    );
  }

  // Update inventory
  const updatedInventory =
    await prisma.inventory.update({
      where: {
        id,
      },
      data,
      include: inventoryInclude,
    });

  // Determine whether this is a stock adjustment
  const quantityChanged =
    data.quantity !== undefined &&
    data.quantity !== existingInventory.quantity;

  const auditAction = quantityChanged
    ? AuditAction.STOCK_ADJUSTMENT
    : AuditAction.UPDATE;

  // Build audit description
  const description = quantityChanged
    ? `Inventory quantity for product "${existingInventory.product.name}" was adjusted from ${existingInventory.quantity} to ${updatedInventory.quantity}`
    : `Inventory settings for product "${existingInventory.product.name}" were updated`;

  // Create audit log
  await createAuditLog({
    userId,
    action: auditAction,
    entity: "Inventory",
    entityId: updatedInventory.id,
    description,
    beforeData: existingInventory,
    afterData: updatedInventory,
  });

  // Create low-stock notification only when
  // inventory enters the low-stock state
  if (enteredLowStock) {
    await createNotification({
      userId,
      type: NotificationType.LOW_STOCK,
      severity: NotificationSeverity.WARNING,
      title: "Low stock detected",
      message: `${existingInventory.product.name} has reached or fallen below its reorder point. Current stock: ${quantity}. Reorder point: ${reorderPoint}.`,
      entity: "Inventory",
      entityId: updatedInventory.id,
    });
  }

  return updatedInventory;
}