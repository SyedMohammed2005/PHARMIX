import { prisma } from "@/lib/prisma";

type DemandPredictionParams = {
  days: number;
  productId?: string;
};

export async function getDemandPredictions({
  days,
  productId,
}: DemandPredictionParams) {
  if (days <= 0) {
    throw new Error("Prediction days must be greater than 0");
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sales = await prisma.saleItem.findMany({
    where: {
      sale: {
        createdAt: {
          gte: startDate,
        },
      },
      ...(productId ? { productId } : {}),
    },
    include: {
      product: true,
      sale: true,
    },
  });

  const grouped = new Map<
    string,
    {
      productId: string;
      productName: string;
      quantitySold: number;
    }
  >();

  for (const item of sales) {
    const existing = grouped.get(item.productId);

    if (existing) {
      existing.quantitySold += item.quantity;
    } else {
      grouped.set(item.productId, {
        productId: item.productId,
        productName: item.product.name,
        quantitySold: item.quantity,
      });
    }
  }

  const predictions = await Promise.all(
    Array.from(grouped.values()).map(async (item) => {
      const inventory = await prisma.inventory.findUnique({
        where: {
          productId: item.productId,
        },
      });

      const averageDailyDemand =
        item.quantitySold / days;

      const predictedDemand = Math.ceil(
        averageDailyDemand * days
      );

      const currentStock = inventory?.quantity ?? 0;

      let recommendation = "SUFFICIENT_STOCK";

      if (currentStock < predictedDemand) {
        recommendation = "RESTOCK_REQUIRED";
      } else if (
        currentStock <=
        predictedDemand * 1.2
      ) {
        recommendation = "LOW_STOCK_RISK";
      }

      return {
        productId: item.productId,
        productName: item.productName,
        days,
        quantitySold: item.quantitySold,
        averageDailyDemand: Number(
          averageDailyDemand.toFixed(2)
        ),
        predictedDemand,
        currentStock,
        recommendation,
      };
    })
  );

  return predictions;
}