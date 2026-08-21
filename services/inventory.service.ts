import { prisma } from "@/lib/prisma";
import { createInventorySchema } from "@/lib/validations/inventory";
import { z } from "zod";

type CreateInventoryInput = z.infer<typeof createInventorySchema>;

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
  data: CreateInventoryInput
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
      "Inventory already exists for this product"
    );
  }

  // Validate stock limits
  if (
    data.maximumStock !== undefined &&
    data.maximumStock < data.minimumStock
  ) {
    throw new Error(
      "Maximum stock cannot be less than minimum stock"
    );
  }

  // Create inventory
  return prisma.inventory.create({
    data: {
      productId: data.productId,
      quantity: data.quantity,
      minimumStock: data.minimumStock,
      maximumStock: data.maximumStock,
      reorderPoint: data.reorderPoint,
    },
    include: inventoryInclude,
  });
}