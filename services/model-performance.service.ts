import { evaluateDemandModel } from "@/services/model-evaluation.service";

type PerformanceLevel =
  | "EXCELLENT"
  | "GOOD"
  | "ACCEPTABLE"
  | "NEEDS_IMPROVEMENT";

function getPerformanceLevel(
  mae: number,
  rmse: number
): PerformanceLevel {
  if (mae <= 0.5 && rmse <= 1) {
    return "EXCELLENT";
  }

  if (mae <= 1 && rmse <= 1.5) {
    return "GOOD";
  }

  if (mae <= 2 && rmse <= 3) {
    return "ACCEPTABLE";
  }

  return "NEEDS_IMPROVEMENT";
}

function getPerformanceMessage(
  level: PerformanceLevel
): string {
  switch (level) {
    case "EXCELLENT":
      return "The demand prediction model is performing exceptionally well.";

    case "GOOD":
      return "The demand prediction model is performing well and is suitable for current forecasting.";

    case "ACCEPTABLE":
      return "The demand prediction model is usable, but further training data may improve its predictions.";

    case "NEEDS_IMPROVEMENT":
      return "The demand prediction model needs improvement before relying heavily on its forecasts.";
  }
}

export async function getModelPerformance() {
  const evaluation =
    await evaluateDemandModel();

  const metrics = evaluation.evaluation;

  const mae = Number(metrics.mae);
  const rmse = Number(metrics.rmse);

  const performanceLevel =
    getPerformanceLevel(mae, rmse);

  return {
    model: evaluation.metadata.model,
    version: evaluation.metadata.version,

    evaluation: {
      mae,
      rmse,
      trainingRecords:
        evaluation.trainingRecords,
      testRecords:
        evaluation.testRecords,
    },

    performance: {
      level: performanceLevel,
      message:
        getPerformanceMessage(
          performanceLevel
        ),
    },

    evaluatedAt:
      evaluation.metadata.trainedAt,
  };
}