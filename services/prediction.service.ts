import { prisma } from "@/lib/prisma";

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000";
  export async function checkMLServiceHealth() {
  try {
    const response = await fetch(
      `${ML_SERVICE_URL}/health`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      return {
        available: false,
        status: "unhealthy",
      };
    }

    const data = await response.json();

    return {
      available: data.success === true,
      status: data.status || "unknown",
      service: data.service || "Pharmix ML Service",
    };
  } catch (error) {
    console.error(
      "ML service health check failed:",
      error
    );

    return {
      available: false,
      status: "unavailable",
    };
  }
}

type DemandPredictionParams = {
  days: number;
  productId?: string;
};

async function predictWithMLService(features: {
  salesLast7Days: number;
  salesLast30Days: number;
  averageDailyDemand7: number;
  averageDailyDemand30: number;
  demandTrend: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const response = await fetch(
      `${ML_SERVICE_URL}/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          sales_last_7_days:
            features.salesLast7Days,
          sales_last_30_days:
            features.salesLast30Days,
          average_daily_demand_7:
            features.averageDailyDemand7,
          average_daily_demand_30:
            features.averageDailyDemand30,
          demand_trend:
            features.demandTrend,
          current_stock:
            features.currentStock,
          minimum_stock:
            features.minimumStock,
          maximum_stock:
            features.maximumStock,
          reorder_point:
            features.reorderPoint,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `ML service returned ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "ML prediction failed"
      );
    }

    return data.prediction;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getDemandPredictions({
  days,
  productId,
}: DemandPredictionParams) {
  if (days <= 0) {
    throw new Error(
      "Prediction days must be greater than 0"
    );
  }

  /*
   * We need 30 days of history because
   * our ML model uses 7-day and 30-day features.
   */
  const startDate = new Date();

  startDate.setDate(
    startDate.getDate() - Math.max(days, 30)
  );

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

  /*
   * Get all inventory records needed for prediction.
   */
  const inventories = await prisma.inventory.findMany({
    where: {
      ...(productId ? { productId } : {}),
    },
  });

  const inventoryMap = new Map(
    inventories.map((inventory) => [
      inventory.productId,
      inventory,
    ])
  );

  /*
   * Group sales by product and calculate
   * both 7-day and 30-day demand.
   */
  const grouped = new Map<
    string,
    {
      productId: string;
      productName: string;
      salesLast7Days: number;
      salesLast30Days: number;
    }
  >();

  const now = new Date();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() - 7
  );

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(
    thirtyDaysAgo.getDate() - 30
  );

  for (const item of sales) {
    const existing = grouped.get(item.productId);

    if (!existing) {
      grouped.set(item.productId, {
        productId: item.productId,
        productName: item.product.name,
        salesLast7Days: 0,
        salesLast30Days: 0,
      });
    }

    const product = grouped.get(item.productId)!;

    if (item.sale.createdAt >= sevenDaysAgo) {
      product.salesLast7Days += item.quantity;
    }

    if (item.sale.createdAt >= thirtyDaysAgo) {
      product.salesLast30Days += item.quantity;
    }
  }

  /*
   * Generate ML predictions.
   */
  const predictions = await Promise.all(
    Array.from(grouped.values()).map(
      async (item) => {
        const inventory = inventoryMap.get(
          item.productId
        );

        const averageDailyDemand7 =
          item.salesLast7Days / 7;

        const averageDailyDemand30 =
          item.salesLast30Days / 30;

        let demandTrend = 0;

        if (averageDailyDemand30 > 0) {
          demandTrend =
            averageDailyDemand7 /
            averageDailyDemand30;
        }

        const features = {
          salesLast7Days:
            item.salesLast7Days,

          salesLast30Days:
            item.salesLast30Days,

          averageDailyDemand7:
            Number(
              averageDailyDemand7.toFixed(2)
            ),

          averageDailyDemand30:
            Number(
              averageDailyDemand30.toFixed(2)
            ),

          demandTrend:
            Number(
              demandTrend.toFixed(2)
            ),

          currentStock:
            inventory?.quantity ?? 0,

          minimumStock:
            inventory?.minimumStock ?? 0,

          maximumStock:
            inventory?.maximumStock ?? 0,

          reorderPoint:
            inventory?.reorderPoint ?? 0,
        };

       let mlPrediction;

try {
  mlPrediction =
    await predictWithMLService(
      features
    );
} catch (error) {
  console.error(
    "ML prediction failed. Using fallback:",
    error
  );

  mlPrediction =
    createFallbackPrediction(features);
}

return {
  productId: item.productId,

  productName:
    item.productName,

  features,
  
  prediction: {
    predictedDailyDemand:
      mlPrediction.predictedDailyDemand,

    predicted7DayDemand:
      mlPrediction.predicted7DayDemand,

    currentStock:
      mlPrediction.currentStock,

    stockCoverageDays:
      mlPrediction.stockCoverageDays,

    recommendation:
      mlPrediction.recommendation,

    recommendedRestockQuantity:
      mlPrediction.recommendedRestockQuantity,

    explanation:
      mlPrediction.explanation,

    model:
      mlPrediction.model,
  },

        };
      }
    )
  );

  return predictions;
}

function createFallbackPrediction(features: {
  averageDailyDemand30: number;
  currentStock: number;
}) {
  const predictedDailyDemand =
    features.averageDailyDemand30;

  const predicted7DayDemand = Number(
    (predictedDailyDemand * 7).toFixed(2)
  );

  let stockCoverageDays = 0;

  if (predictedDailyDemand > 0) {
    stockCoverageDays = Number(
      (
        features.currentStock /
        predictedDailyDemand
      ).toFixed(2)
    );
  }

  let recommendation = "SUFFICIENT_STOCK";

  if (
    features.currentStock <
    predicted7DayDemand
  ) {
    recommendation = "RESTOCK_REQUIRED";
  } else if (
    features.currentStock <=
    predicted7DayDemand * 1.2
  ) {
    recommendation = "LOW_STOCK_RISK";
  }

  const recommendedRestockQuantity =
    recommendation === "RESTOCK_REQUIRED"
      ? Number(
          (
            predicted7DayDemand -
            features.currentStock
          ).toFixed(2)
        )
      : 0;

  let explanation = "";

  if (recommendation === "RESTOCK_REQUIRED") {
    explanation =
      "ML service is unavailable. A baseline demand calculation indicates that current stock is below expected demand.";
  } else if (recommendation === "LOW_STOCK_RISK") {
    explanation =
      "ML service is unavailable. A baseline demand calculation indicates that inventory is close to expected demand.";
  } else {
    explanation =
      "ML service is unavailable. A baseline demand calculation indicates that current stock is sufficient.";
  }

  return {
    predictedDailyDemand,
    predicted7DayDemand,
    currentStock: features.currentStock,
    stockCoverageDays,
    recommendation,
    recommendedRestockQuantity,
    explanation,
    model: {
      name: "Baseline Demand Calculation",
      version: "fallback-1.0.0",
    },
  };
}