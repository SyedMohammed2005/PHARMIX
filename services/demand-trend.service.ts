import { prisma } from "@/lib/prisma";

type DemandTrendDirection =
  | "INCREASING"
  | "STABLE"
  | "DECREASING";

interface DemandTrendOptions {
  weeks?: number;
  productId?: string;
}

interface WeeklyDemand {
  weekNumber: number;
  startDate: string;
  endDate: string;
  unitsSold: number;
}

function getTrendDirection(
  growthPercentage: number
): DemandTrendDirection {
  if (growthPercentage > 10) {
    return "INCREASING";
  }

  if (growthPercentage < -10) {
    return "DECREASING";
  }

  return "STABLE";
}

export async function getDemandTrends({
  weeks = 12,
  productId,
}: DemandTrendOptions = {}) {
  const totalWeeks = Math.min(
    Math.max(Number(weeks) || 12, 2),
    52
  );

  const now = new Date();

  const historyStart = new Date(now);

  historyStart.setDate(
    historyStart.getDate() - totalWeeks * 7
  );

  historyStart.setHours(0, 0, 0, 0);

  const products = await prisma.product.findMany({
    where: productId
      ? {
          id: productId,
        }
      : undefined,

    select: {
      id: true,
      name: true,
      genericName: true,
      brand: true,

      category: {
        select: {
          name: true,
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });

  if (products.length === 0) {
    return [];
  }

  const productIds = products.map(
    (product) => product.id
  );

  const sales = await prisma.saleItem.findMany({
    where: {
      productId: {
        in: productIds,
      },

      sale: {
        createdAt: {
          gte: historyStart,
          lte: now,
        },
      },
    },

    select: {
      productId: true,
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

  /*
   * Aggregate sales into:
   *
   * productId -> weekIndex -> quantity
   *
   * This avoids repeatedly scanning the complete
   * sales array for every product/week combination.
   */
  const weeklySalesMap = new Map<
    string,
    Map<number, number>
  >();

  for (const sale of sales) {
    const productMap =
      weeklySalesMap.get(sale.productId) ??
      new Map<number, number>();

    const elapsedMilliseconds =
      sale.sale.createdAt.getTime() -
      historyStart.getTime();

    const weekIndex = Math.min(
      Math.floor(
        elapsedMilliseconds /
          (7 * 24 * 60 * 60 * 1000)
      ),
      totalWeeks - 1
    );

    productMap.set(
      weekIndex,
      (productMap.get(weekIndex) ?? 0) +
        sale.quantity
    );

    weeklySalesMap.set(
      sale.productId,
      productMap
    );
  }

  return products.map((product) => {
    const productWeeklySales =
      weeklySalesMap.get(product.id) ??
      new Map<number, number>();

    const weeklyDemand: WeeklyDemand[] = [];

    for (
      let weekIndex = 0;
      weekIndex < totalWeeks;
      weekIndex++
    ) {
      const startDate = new Date(
        historyStart
      );

      startDate.setDate(
        startDate.getDate() +
          weekIndex * 7
      );

      const endDate = new Date(startDate);

      endDate.setDate(
        endDate.getDate() + 7
      );

      weeklyDemand.push({
        weekNumber: weekIndex + 1,
        startDate:
          startDate.toISOString(),
        endDate:
          endDate.toISOString(),
        unitsSold:
          productWeeklySales.get(
            weekIndex
          ) ?? 0,
      });
    }

    const totalUnitsSold =
      weeklyDemand.reduce(
        (total, week) =>
          total + week.unitsSold,
        0
      );

    const averageWeeklyDemand =
      totalUnitsSold / totalWeeks;

    const midpoint =
      Math.floor(totalWeeks / 2);

    const previousWeeks =
      weeklyDemand.slice(0, midpoint);

    const recentWeeks =
      weeklyDemand.slice(midpoint);

    const previousTotal =
      previousWeeks.reduce(
        (total, week) =>
          total + week.unitsSold,
        0
      );

    const recentTotal =
      recentWeeks.reduce(
        (total, week) =>
          total + week.unitsSold,
        0
      );

    const previousAverage =
      previousTotal /
      previousWeeks.length;

    const recentAverage =
      recentTotal /
      recentWeeks.length;

    const growthPercentage =
      previousAverage === 0
        ? recentAverage > 0
          ? 100
          : 0
        : ((recentAverage -
            previousAverage) /
            previousAverage) *
          100;

    const trend =
      getTrendDirection(
        growthPercentage
      );

    return {
      productId: product.id,
      productName: product.name,
      genericName:
        product.genericName,
      brand: product.brand,
      category:
        product.category.name,

      period: {
        weeks: totalWeeks,
      },

      summary: {
        totalUnitsSold,
        averageWeeklyDemand:
          Number(
            averageWeeklyDemand.toFixed(2)
          ),
        previousAverageDemand:
          Number(
            previousAverage.toFixed(2)
          ),
        recentAverageDemand:
          Number(
            recentAverage.toFixed(2)
          ),
        growthPercentage:
          Number(
            growthPercentage.toFixed(2)
          ),
        trend,
      },

      weeklyDemand,
    };
  });
}