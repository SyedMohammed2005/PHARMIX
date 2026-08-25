import { prisma } from "@/lib/prisma";

type TrainingRow = {
  productId: string;
  snapshotDate: string;

  salesLast7Days: number;
  salesLast30Days: number;

  averageDailyDemand7: number;
  averageDailyDemand30: number;

  demandTrend: number;

  stockAddedLast30Days: number;
  stockRemovedLast30Days: number;

  historicalStock: number;

  minimumStock: number;
  maximumStock: number | null;
  reorderPoint: number;

  future7DayDemand: number;
};

export async function getTrainingData(
  productId: string
): Promise<TrainingRow[]> {
  // Get product inventory configuration
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

  if (!inventory) {
    return [];
  }

  // Get sales history
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

  // Get stock transaction history
  const transactions =
    await prisma.stockTransaction.findMany({
      where: {
        inventory: {
          productId,
        },
      },
      select: {
        type: true,
        quantity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (sales.length === 0) {
    return [];
  }

  /*
   * We need at least 37 days of history:
   *
   * 30 days → features
   * 7 days  → future target
   */
  const firstSaleDate = sales[0].sale.createdAt;
  const lastSaleDate =
    sales[sales.length - 1].sale.createdAt;

  const minimumHistory =
    37 * 24 * 60 * 60 * 1000;

  if (
    lastSaleDate.getTime() -
      firstSaleDate.getTime() <
    minimumHistory
  ) {
    return [];
  }

  const rows: TrainingRow[] = [];

  /*
   * Move through history in 7-day steps.
   */
  let snapshotDate = new Date(firstSaleDate);

  while (true) {
    const featureEnd = new Date(snapshotDate);
    featureEnd.setDate(featureEnd.getDate() + 30);

    const targetEnd = new Date(featureEnd);
    targetEnd.setDate(targetEnd.getDate() + 7);

    /*
     * Stop when there isn't enough future data.
     */
    if (
      targetEnd.getTime() >
      lastSaleDate.getTime()
    ) {
      break;
    }

    const sevenDayStart = new Date(featureEnd);
    sevenDayStart.setDate(
      sevenDayStart.getDate() - 7
    );

    /*
     * Sales during feature period.
     */
    const featureSales = sales.filter((sale) => {
      const date = sale.sale.createdAt;

      return (
        date >= snapshotDate &&
        date < featureEnd
      );
    });

    /*
     * Sales during the last 7 days of
     * the 30-day feature window.
     */
    const recentSales = featureSales.filter(
      (sale) =>
        sale.sale.createdAt >= sevenDayStart
    );

    /*
     * Actual future demand.
     *
     * This becomes the ML target.
     */
    const futureSales = sales.filter((sale) => {
      const date = sale.sale.createdAt;

      return (
        date >= featureEnd &&
        date < targetEnd
      );
    });

    const salesLast30Days =
      featureSales.reduce(
        (sum, sale) =>
          sum + sale.quantity,
        0
      );

    const salesLast7Days =
      recentSales.reduce(
        (sum, sale) =>
          sum + sale.quantity,
        0
      );

    const future7DayDemand =
      futureSales.reduce(
        (sum, sale) =>
          sum + sale.quantity,
        0
      );

    /*
     * Demand calculations.
     */
    const averageDailyDemand7 =
      salesLast7Days / 7;

    const averageDailyDemand30 =
      salesLast30Days / 30;

    const demandTrend =
      averageDailyDemand30 === 0
        ? 0
        : averageDailyDemand7 /
          averageDailyDemand30;

    /*
     * Calculate stock movement during
     * the feature period.
     */
    const featureTransactions =
      transactions.filter((transaction) => {
        const date = transaction.createdAt;

        return (
          date >= snapshotDate &&
          date < featureEnd
        );
      });

    let stockAddedLast30Days = 0;
    let stockRemovedLast30Days = 0;

    for (const transaction of featureTransactions) {
      const quantity = Math.abs(
        transaction.quantity
      );

      if (
        transaction.type === "PURCHASE" ||
        transaction.type === "RETURN"
      ) {
        stockAddedLast30Days += quantity;
      }

      if (
        transaction.type === "SALE" ||
        transaction.type === "DAMAGE"
      ) {
        stockRemovedLast30Days += quantity;
      }

      if (
        transaction.type === "ADJUSTMENT"
      ) {
        if (transaction.quantity >= 0) {
          stockAddedLast30Days +=
            transaction.quantity;
        } else {
          stockRemovedLast30Days +=
            Math.abs(transaction.quantity);
        }
      }
    }

    /*
     * Reconstruct an approximate historical
     * stock position.
     *
     * Current stock is our starting point.
     */
    const netMovementAfterSnapshot =
      transactions
        .filter(
          (transaction) =>
            transaction.createdAt >=
            featureEnd
        )
        .reduce((sum, transaction) => {
          const quantity = Math.abs(
            transaction.quantity
          );

          if (
            transaction.type ===
              "PURCHASE" ||
            transaction.type === "RETURN"
          ) {
            return sum - quantity;
          }

          if (
            transaction.type === "SALE" ||
            transaction.type === "DAMAGE"
          ) {
            return sum + quantity;
          }

          if (
            transaction.type ===
            "ADJUSTMENT"
          ) {
            return (
              sum - transaction.quantity
            );
          }

          return sum;
        }, 0);

    const historicalStock =
      Math.max(
        inventory.quantity +
          netMovementAfterSnapshot,
        0
      );

    rows.push({
      productId,

      snapshotDate:
        snapshotDate.toISOString(),

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

      stockAddedLast30Days,

      stockRemovedLast30Days,

      historicalStock,

      minimumStock:
        inventory.minimumStock,

      maximumStock:
        inventory.maximumStock,

      reorderPoint:
        inventory.reorderPoint,

      future7DayDemand,
    });

    snapshotDate.setDate(
      snapshotDate.getDate() + 7
    );
  }

  return rows;
}