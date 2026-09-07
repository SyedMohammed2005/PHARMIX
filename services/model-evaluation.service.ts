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
      Number(
        (row.future7DayDemand / 7).toFixed(2)
      ),
  };
}

async function callMLService(
  endpoint: string,
  body: unknown
) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    ML_SERVICE_TIMEOUT
  );

  try {
    const response = await fetch(
      `${ML_SERVICE_URL}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `ML service returned ${response.status}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function evaluateDemandModel() {
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

  const trainingData =
    (
      await Promise.all(
        products.map(async (product) => {
          const rows =
            await getTrainingData(
              product.id
            );

          return rows.map(
            transformTrainingRow
          );
        })
      )
    ).flat();

  if (trainingData.length < 10) {
    throw new Error(
      `At least 10 training records are required. Only ${trainingData.length} are available.`
    );
  }

  return callMLService(
    "/evaluate",
    {
      trainingData,
    }
  );
}