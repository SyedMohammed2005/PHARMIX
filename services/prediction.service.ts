import { prisma } from "@/lib/prisma";

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000";

const ML_SERVICE_TIMEOUT = Number(
  process.env.ML_SERVICE_TIMEOUT || 3000
);

const ML_SERVICE_RETRIES = Number(
  process.env.ML_SERVICE_RETRIES || 2
);

const ML_HEALTH_TIMEOUT = 1500;

type DemandPredictionFeatures = {
  salesLast7Days: number;
  salesLast30Days: number;
  averageDailyDemand7: number;
  averageDailyDemand30: number;
  demandTrend: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
};

type MLPrediction = {
  predictedDailyDemand: number;
  explanation: string;
  model: {
    name: string;
    version: string;
  };
};

type DemandPredictionParams = {
  days: number;
  productId?: string;
};

/**
 * Checks whether the Python ML service is available.
 *
 * A short timeout is intentionally used here because this
 * health check should never make the pharmacy API slow.
 */
export async function checkMLServiceHealth() {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, ML_HEALTH_TIMEOUT);

  try {
    const response = await fetch(
      `${ML_SERVICE_URL}/health`,
      {
        method: "GET",
        signal: controller.signal,
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
      service:
        data.service || "Pharmix ML Service",
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
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends prediction features to the Python ML service.
 */
async function predictWithMLService(
  features: DemandPredictionFeatures
): Promise<MLPrediction> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, ML_SERVICE_TIMEOUT);

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
        data.message ||
          "ML prediction failed"
      );
    }

    if (
      !data.prediction ||
      typeof data.prediction.predictedDailyDemand !==
        "number"
    ) {
      throw new Error(
        "ML service returned an invalid prediction"
      );
    }

    return data.prediction;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Retries ML prediction when the ML service is
 * temporarily unavailable.
 *
 * Retries are deliberately limited so the pharmacy
 * API does not become slow when the ML service fails.
 */
async function predictWithRetry(
  features: DemandPredictionFeatures
): Promise<MLPrediction> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= ML_SERVICE_RETRIES;
    attempt++
  ) {
    try {
      return await predictWithMLService(
        features
      );
    } catch (error) {
      lastError = error;

      console.error(
        `ML prediction attempt ${attempt} failed:`,
        error
      );

      if (
        attempt < ML_SERVICE_RETRIES
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );
      }
    }
  }

  throw lastError;
}

/**
 * Returns the start of a calendar day in IST,
 * represented as a UTC Date.
 *
 * Example:
 * 2026-09-05 00:00 IST
 * becomes
 * 2026-09-04 18:30 UTC.
 */
function getISTCalendarDayStart(
  date: Date
): Date {
  const dateParts =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

  const year = Number(
    dateParts.find(
      (part) => part.type === "year"
    )?.value
  );

  const month = Number(
    dateParts.find(
      (part) => part.type === "month"
    )?.value
  );

  const day = Number(
    dateParts.find(
      (part) => part.type === "day"
    )?.value
  );

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error(
      "Failed to calculate India calendar date"
    );
  }

  // Midnight IST = previous day 18:30 UTC.
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      -5,
      -30,
      0,
      0
    )
  );
}

/**
 * Generates demand predictions for pharmacy products.
 *
 * Historical demand uses calendar days in Asia/Kolkata:
 *
 * 7-day window:
 * today + previous 6 calendar days
 *
 * 30-day window:
 * today + previous 29 calendar days
 */
export async function getDemandPredictions({
  days,
  productId,
}: DemandPredictionParams) {
  if (days <= 0) {
    throw new Error(
      "Prediction days must be greater than 0"
    );
  }

  const now = new Date();

  /*
   * Get the beginning of today in India time.
   */
  const todayStartIST =
    getISTCalendarDayStart(now);

  /*
   * 7 calendar days including today.
   *
   * Example:
   * Sep 5 → Aug 30 through Sep 5
   */
  const sevenDaysAgo =
    new Date(todayStartIST);

  sevenDaysAgo.setUTCDate(
    sevenDaysAgo.getUTCDate() - 6
  );

  /*
   * 30 calendar days including today.
   *
   * Example:
   * Sep 5 → Aug 7 through Sep 5
   */
  const thirtyDaysAgo =
    new Date(todayStartIST);

  thirtyDaysAgo.setUTCDate(
    thirtyDaysAgo.getUTCDate() - 29
  );

  /*
   * We need at least 30 calendar days of
   * history because the ML model uses both
   * 7-day and 30-day demand features.
   *
   * If the requested forecast is longer than
   * 30 days, retrieve enough history for it.
   */
  const historyStartDate =
    new Date(todayStartIST);

  historyStartDate.setUTCDate(
    historyStartDate.getUTCDate() -
      Math.max(days, 30) +
      1
  );

  /*
   * Get sales history.
   */
  const sales =
    await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: historyStartDate,
          },
        },

        ...(productId
          ? { productId }
          : {}),
      },

      include: {
        product: true,
        sale: true,
      },

      orderBy: {
        sale: {
          createdAt: "asc",
        },
      },
    });

  /*
   * Get inventory records.
   */
  const inventories =
    await prisma.inventory.findMany({
      where: {
        ...(productId
          ? { productId }
          : {}),
      },
    });

  const inventoryMap = new Map(
    inventories.map((inventory) => [
      inventory.productId,
      inventory,
    ])
  );

  /*
   * Group sales by product.
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

  for (const item of sales) {
    if (!grouped.has(item.productId)) {
      grouped.set(item.productId, {
        productId: item.productId,
        productName:
          item.product.name,
        salesLast7Days: 0,
        salesLast30Days: 0,
      });
    }

    const product =
      grouped.get(item.productId)!;

    const saleDate =
      item.sale.createdAt;

    /*
     * Last 7 calendar days.
     */
    if (saleDate >= sevenDaysAgo) {
      product.salesLast7Days +=
        item.quantity;
    }

    /*
     * Last 30 calendar days.
     */
    if (saleDate >= thirtyDaysAgo) {
      product.salesLast30Days +=
        item.quantity;
    }
  }

  /*
   * Check the ML service ONCE.
   *
   * This is important for performance.
   *
   * If ML is down, every product immediately
   * uses the fallback instead of performing
   * multiple timeout + retry cycles.
   */
  const mlHealth =
    await checkMLServiceHealth();

  if (!mlHealth.available) {
    console.warn(
      "ML service unavailable. Using fallback predictions."
    );
  }

  /*
   * Generate predictions for all products.
   */
  const predictions =
    await Promise.all(
      Array.from(
        grouped.values()
      ).map(async (item) => {
        const inventory =
          inventoryMap.get(
            item.productId
          );

        /*
         * Historical demand averages.
         */
        const averageDailyDemand7 =
          item.salesLast7Days / 7;

        const averageDailyDemand30 =
          item.salesLast30Days / 30;

        /*
         * Demand trend:
         *
         * > 1 = increasing
         * = 1 = stable
         * < 1 = decreasing
         */
        let demandTrend = 0;

        if (
          averageDailyDemand30 > 0
        ) {
          demandTrend =
            averageDailyDemand7 /
            averageDailyDemand30;
        }

        /*
         * Features sent to ML.
         */
        const features: DemandPredictionFeatures =
          {
            salesLast7Days:
              item.salesLast7Days,

            salesLast30Days:
              item.salesLast30Days,

            averageDailyDemand7:
              Number(
                averageDailyDemand7.toFixed(
                  2
                )
              ),

            averageDailyDemand30:
              Number(
                averageDailyDemand30.toFixed(
                  2
                )
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

        let mlPrediction: MLPrediction;

        /*
         * If ML is unavailable, do NOT retry.
         * Immediately use the fallback.
         */
        if (!mlHealth.available) {
          mlPrediction =
            createFallbackPrediction(
              features,
              days
            );
        } else {
          try {
            mlPrediction =
              await predictWithRetry(
                features
              );
          } catch (error) {
            console.error(
              "ML prediction failed. Using fallback:",
              error
            );

            mlPrediction =
              createFallbackPrediction(
                features,
                days
              );
          }
        }

        /*
         * ML predicts DAILY demand.
         */
        const predictedDailyDemand =
          Number(
            Number(
              mlPrediction.predictedDailyDemand
            ).toFixed(2)
          );

        /*
         * Convert daily demand into the
         * requested forecast horizon.
         */
        const predictedDemand =
          Number(
            (
              predictedDailyDemand *
              days
            ).toFixed(2)
          );

        /*
         * Keep the 7-day prediction for
         * compatibility with existing APIs/UI.
         */
        const predicted7DayDemand =
          Number(
            (
              predictedDailyDemand *
              7
            ).toFixed(2)
          );

        /*
         * Stock coverage.
         */
        let stockCoverageDays = 0;

        if (
          predictedDailyDemand > 0
        ) {
          stockCoverageDays =
            Number(
              (
                features.currentStock /
                predictedDailyDemand
              ).toFixed(2)
            );
        }

        /*
         * Stock recommendation.
         */
        let recommendation =
          "SUFFICIENT_STOCK";

        if (
          features.currentStock <
          predictedDemand
        ) {
          recommendation =
            "RESTOCK_REQUIRED";
        } else if (
          features.currentStock <=
          predictedDemand * 1.2
        ) {
          recommendation =
            "LOW_STOCK_RISK";
        }

        /*
         * Recommended restock quantity.
         */
        const recommendedRestockQuantity =
          recommendation ===
          "RESTOCK_REQUIRED"
            ? Number(
                (
                  predictedDemand -
                  features.currentStock
                ).toFixed(2)
              )
            : 0;

        return {
          productId:
            item.productId,

          productName:
            item.productName,

          features,

          prediction: {
            forecastDays: days,

            predictedDailyDemand,

            predictedDemand,

            predicted7DayDemand,

            currentStock:
              features.currentStock,

            stockCoverageDays,

            recommendation,

            recommendedRestockQuantity,

            explanation:
  `Predicted daily demand is ${predictedDailyDemand.toFixed(2)} units. ` +
  `Current stock covers approximately ${stockCoverageDays.toFixed(2)} days. ` +
  (
    recommendation === "RESTOCK_REQUIRED"
      ? "Current stock is below the predicted demand. Restocking is required."
      : recommendation === "LOW_STOCK_RISK"
        ? "Current stock is close to the predicted demand. Restocking may be required soon."
        : "Current stock is sufficient for the predicted demand. No immediate restocking is required."
  ),
            model:
              mlPrediction.model,
          },
        };
      })
    );

  return predictions;
}

/**
 * Fallback prediction used when the Python
 * ML service is unavailable.
 *
 * Uses the 30-day average daily demand
 * as a baseline estimate.
 */
function createFallbackPrediction(
  features: {
    averageDailyDemand30: number;
    currentStock: number;
  },
  days: number
): MLPrediction {
  const predictedDailyDemand =
    Number(
      features.averageDailyDemand30.toFixed(
        2
      )
    );

  const predictedDemand =
    Number(
      (
        predictedDailyDemand *
        days
      ).toFixed(2)
    );

  const predicted7DayDemand =
    Number(
      (
        predictedDailyDemand *
        7
      ).toFixed(2)
    );

  let stockCoverageDays = 0;

  if (
    predictedDailyDemand > 0
  ) {
    stockCoverageDays =
      Number(
        (
          features.currentStock /
          predictedDailyDemand
        ).toFixed(2)
      );
  }

  let recommendation =
    "SUFFICIENT_STOCK";

  if (
    features.currentStock <
    predictedDemand
  ) {
    recommendation =
      "RESTOCK_REQUIRED";
  } else if (
    features.currentStock <=
    predictedDemand * 1.2
  ) {
    recommendation =
      "LOW_STOCK_RISK";
  }

  const recommendedRestockQuantity =
    recommendation ===
    "RESTOCK_REQUIRED"
      ? Number(
          (
            predictedDemand -
            features.currentStock
          ).toFixed(2)
        )
      : 0;

  let explanation = "";

  if (
    recommendation ===
    "RESTOCK_REQUIRED"
  ) {
    explanation =
      "ML service is unavailable. A baseline demand calculation indicates that current stock is below expected demand for the selected forecast horizon.";
  } else if (
    recommendation ===
    "LOW_STOCK_RISK"
  ) {
    explanation =
      "ML service is unavailable. A baseline demand calculation indicates that inventory is close to expected demand for the selected forecast horizon.";
  } else {
    explanation =
      "ML service is unavailable. A baseline demand calculation indicates that current stock is sufficient for the selected forecast horizon.";
  }

  return {
    predictedDailyDemand,

    explanation,

    model: {
      name:
        "Baseline Demand Calculation",
      version: "fallback-1.0.0",
    },
  };
}

