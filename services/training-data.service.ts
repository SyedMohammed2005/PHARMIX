import { prisma } from "@/lib/prisma";

type TrainingRow = {
  productId: string;
  salesLast7Days: number;
  salesLast30Days: number;
  averageDailyDemand7: number;
  averageDailyDemand30: number;
  demandTrend: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
  reorderPoint: number;
  future7DayDemand: number;
};

export async function getTrainingData(
  productId: string
): Promise<TrainingRow[]> {
  const sales = await prisma.saleItem.findMany({
    where: {
      productId,
    },
    select: {
      quantity: true,
      sale: {
        select: {
          createdAt: true,
        },
      },
    },
    orderBy: {
      sale: {
        createdAt: "asc",
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

  if (!inventory || sales.length === 0) {
    return [];
  }

  const rows: TrainingRow[] = [];

  const firstSaleDate = sales[0].sale.createdAt;
  const lastSaleDate =
    sales[sales.length - 1].sale.createdAt;

  const windowStart = new Date(firstSaleDate);

  while (
    windowStart.getTime() + 30 * 24 * 60 * 60 * 1000 <=
    lastSaleDate.getTime()
  ) {
    const featureStart = new Date(windowStart);

    const featureEnd = new Date(featureStart);
    featureEnd.setDate(featureEnd.getDate() + 30);

    const targetEnd = new Date(featureEnd);
    targetEnd.setDate(targetEnd.getDate() + 7);

    const featureSales = sales.filter((sale) => {
      const date = sale.sale.createdAt;

      return (
        date >= featureStart &&
        date < featureEnd
      );
    });

    const futureSales = sales.filter((sale) => {
      const date = sale.sale.createdAt;

      return (
        date >= featureEnd &&
        date < targetEnd
      );
    });

    const salesLast30Days = featureSales.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );

    const sevenDayStart = new Date(featureEnd);
    sevenDayStart.setDate(
      sevenDayStart.getDate() - 7
    );

    const salesLast7Days = featureSales
      .filter(
        (sale) =>
          sale.sale.createdAt >= sevenDayStart
      )
      .reduce(
        (sum, sale) => sum + sale.quantity,
        0
      );

    const future7DayDemand = futureSales.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );

    const averageDailyDemand7 =
      salesLast7Days / 7;

    const averageDailyDemand30 =
      salesLast30Days / 30;

    const demandTrend =
      averageDailyDemand30 === 0
        ? 0
        : averageDailyDemand7 /
          averageDailyDemand30;

    rows.push({
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

      currentStock: inventory.quantity,

      minimumStock: inventory.minimumStock,

      maximumStock: inventory.maximumStock,

      reorderPoint: inventory.reorderPoint,

      future7DayDemand,
    });

    windowStart.setDate(
      windowStart.getDate() + 7
    );
  }

  return rows;
}