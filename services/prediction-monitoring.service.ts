import { getDemandPredictions } from "@/services/prediction.service";
import { getDemandTrends } from "@/services/demand-trend.service";

interface PredictionMonitoringOptions {
  days?: number;
}

export async function getPredictionMonitoring({
  days = 7,
}: PredictionMonitoringOptions = {}) {
  const forecastDays = Math.min(
    Math.max(Number(days) || 7, 1),
    30
  );

  const [predictions, trends] = await Promise.all([
    getDemandPredictions({
      days: forecastDays,
    }),
    getDemandTrends({
      weeks: 12,
    }),
  ]);

  const trendMap = new Map(
    trends.map((trend) => [
      trend.productId,
      trend,
    ])
  );

  return predictions.map((prediction) => {
    const trend = trendMap.get(
      prediction.productId
    );

    return {
      productId: prediction.productId,
      productName: prediction.productName,

      forecast: {
        days: prediction.prediction.forecastDays,
        predictedDailyDemand:
          prediction.prediction.predictedDailyDemand,
        predictedDemand:
          prediction.prediction.predictedDemand,
        predicted7DayDemand:
          prediction.prediction.predicted7DayDemand,
      },

      inventory: {
        currentStock:
          prediction.prediction.currentStock,
        stockCoverageDays:
          prediction.prediction.stockCoverageDays,
       minimumStock:
  prediction.features.minimumStock,

maximumStock:
  prediction.features.maximumStock,

reorderPoint:
  prediction.features.reorderPoint,
      },

      prediction: {
        recommendation:
          prediction.prediction.recommendation,
        model:
          prediction.prediction.model,
        explanation:
          prediction.prediction.explanation,
      },

      trend: trend
        ? {
            direction:
              trend.summary.trend,
            growthPercentage:
              trend.summary.growthPercentage,
            averageWeeklyDemand:
              trend.summary.averageWeeklyDemand,
            recentAverageDemand:
              trend.summary.recentAverageDemand,
            previousAverageDemand:
              trend.summary.previousAverageDemand,
          }
        : null,
    };
  });
}