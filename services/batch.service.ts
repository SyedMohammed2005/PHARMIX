import { prisma } from "@/lib/prisma";

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

export async function createBatch(data: {
  batchNumber: string;
  productId: string;
  manufactureDate: Date;
  expiryDate: Date;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}) {
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

  return prisma.batch.create({
    data,
    include: {
      product: true,
    },
  });
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
) {
  return prisma.batch.update({
    where: {
      id,
    },
    data,
    include: {
      product: true,
    },
  });
}

export async function deleteBatch(id: string) {
  return prisma.batch.delete({
    where: {
      id,
    },
  });
}

export async function getExpiringBatches(days = 30) {
  const today = new Date();

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

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