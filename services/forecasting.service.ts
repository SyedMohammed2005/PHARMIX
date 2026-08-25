import { prisma } from "@/lib/prisma";

export async function getForecastingFeatures(productId: string) {
  const now = new Date();

  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 30);

  const start7 = new Date(now);
  start7.setDate(start7.getDate() - 7);

  const sales = await prisma.saleItem.findMany({
    where: {
      productId,
      sale: {
        createdAt: {
          gte: start30,
        },
      },
    },
    select: {
      quantity: true,
      createdAt: true,
      sale: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  const inventory = await prisma.inventory.findUnique({
    where: {
      productId,
    },
    select: {
      quantity: true,
      minimumStock: true,
      maximumStock: true,
      reorderPoint: true,
    },
  });

  let salesLast7Days = 0;
  let salesLast30Days = 0;

  for (const saleItem of sales) {
    const saleDate = saleItem.sale.createdAt;

    salesLast30Days += saleItem.quantity;

    if (saleDate >= start7) {
      salesLast7Days += saleItem.quantity;
    }
  }

  const averageDailyDemand30 =
    salesLast30Days / 30;

  const averageDailyDemand7 =
    salesLast7Days / 7;

  const demandTrend =
    averageDailyDemand30 === 0
      ? 0
      : averageDailyDemand7 / averageDailyDemand30;

  return {
    productId,

    salesLast7Days,
    salesLast30Days,

    averageDailyDemand7: Number(
      averageDailyDemand7.toFixed(2)
    ),

    averageDailyDemand30: Number(
      averageDailyDemand30.toFixed(2)
    ),

    demandTrend: Number(
      demandTrend.toFixed(2)
    ),

    currentStock: inventory?.quantity ?? 0,

    minimumStock:
      inventory?.minimumStock ?? 0,

    maximumStock:
      inventory?.maximumStock ?? null,

    reorderPoint:
      inventory?.reorderPoint ?? 0,
  };
}

export async function getAllForecastingFeatures() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
    },
  });

  const features = await Promise.all(
    products.map((product) =>
      getForecastingFeatures(product.id)
    )
  );

  return features;
}