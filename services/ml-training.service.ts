import { prisma } from "@/lib/prisma";
import { getTrainingData } from "@/services/training-data.service";

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL ||
  "http://localhost:8000";

const ML_SERVICE_TIMEOUT = Number(
  process.env.ML_SERVICE_TIMEOUT || 10000
);

type MLTrainingRow = {
  sales_last_7_days: number;
  sales_last_30_days: number;
  average_daily_demand_7: number;
  average_daily_demand_30: number;
  demand_trend: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  target_demand: number;
};

function transformTrainingRow(
  row: Awaited<
    ReturnType<typeof getTrainingData>
  >[number]
): MLTrainingRow {
  const targetDemand =
    row.future7DayDemand / 7;

  return {
    sales_last_7_days: row.salesLast7Days,
    sales_last_30_days: row.salesLast30Days,
    average_daily_demand_7: row.averageDailyDemand7,
    average_daily_demand_30: row.averageDailyDemand30,
    demand_trend: row.demandTrend,
    current_stock: row.historicalStock,
    minimum_stock: row.minimumStock,
    maximum_stock:
      row.maximumStock ??
      row.historicalStock,
    reorder_point: row.reorderPoint,
    target_demand:
      Number(targetDemand.toFixed(2)),
  };
}

async function callMLService(
  endpoint: string,
  body: unknown
) {
  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, ML_SERVICE_TIMEOUT);

  try {
    const response = await fetch(
      `${ML_SERVICE_URL}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(
        `ML service returned ${response.status}`
      );
    }

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.message ||
          `ML service ${endpoint} failed`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Prepare training data for ALL products.
 *
 * The ML model is currently a single generalized
 * XGBoost model, so training must use a combined
 * dataset instead of training one product at a time.
 */
export async function prepareCombinedTrainingData(): Promise<
  MLTrainingRow[]
> {
  const products =
    await prisma.product.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

  const productTrainingData =
    await Promise.all(
      products.map(async (product) => {
        const trainingData =
          await getTrainingData(product.id);

        return trainingData.map(
          transformTrainingRow
        );
      })
    );

  return productTrainingData.flat();
}

export async function evaluateTrainingData() {
  const trainingData =
    await prepareCombinedTrainingData();

  if (trainingData.length < 10) {
    throw new Error(
      `Not enough combined training data. At least 10 records are required, but only ${trainingData.length} records are available.`
    );
  }

  return callMLService(
    "/evaluate",
    {
      trainingData,
    }
  );
}

export async function trainMLModel() {
  const trainingData =
    await prepareCombinedTrainingData();

  if (trainingData.length < 10) {
    throw new Error(
      `Not enough combined training data. At least 10 records are required, but only ${trainingData.length} records are available.`
    );
  }

  const evaluation =
    await callMLService(
      "/evaluate",
      {
        trainingData,
      }
    );

  const training =
    await callMLService(
      "/train",
      trainingData
    );

  return {
    success: true,
    trainingRecords:
      trainingData.length,
    evaluation,
    training,
  };
}