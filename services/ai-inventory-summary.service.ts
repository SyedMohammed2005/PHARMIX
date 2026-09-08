import { getInventoryRecommendations } from "@/services/inventory-recommendation.service";

interface AIInventorySummaryOptions {
  latitude: number;
  longitude: number;
  days?: number;
}

export async function getAIInventorySummary({
  latitude,
  longitude,
  days = 7,
}: AIInventorySummaryOptions) {
  const result = await getInventoryRecommendations({
    latitude,
    longitude,
    days,
  });

  const products = result.products;

  const criticalProducts = products.filter(
    (product) => product.risk.level === "CRITICAL"
  );

  const restockNowProducts = products.filter(
    (product) => product.decision === "RESTOCK_NOW"
  );

  const restockSoonProducts = products.filter(
    (product) => product.decision === "RESTOCK_SOON"
  );

  const monitorProducts = products.filter(
    (product) => product.decision === "MONITOR"
  );

  const healthyProducts = products.filter(
    (product) => product.decision === "NO_ACTION"
  );

  const totalPredictedDemand = products.reduce(
    (total, product) =>
      total + product.forecast.predictedDemand,
    0
  );

  const totalRecommendedUnits = products.reduce(
    (total, product) =>
      total +
      product.recommendation.recommendedRestockQuantity,
    0
  );

  const highestRiskProduct =
    products.length > 0
      ? [...products].sort(
          (a, b) => b.risk.score - a.risk.score
        )[0]
      : null;

  const highestDemandProduct =
    products.length > 0
      ? [...products].sort(
          (a, b) =>
            b.forecast.predictedDemand -
            a.forecast.predictedDemand
        )[0]
      : null;

  return {
    forecast: {
      days,
    },

    summary: {
      totalProducts: products.length,
      criticalProducts: criticalProducts.length,
      restockNow: restockNowProducts.length,
      restockSoon: restockSoonProducts.length,
      monitor: monitorProducts.length,
      healthy: healthyProducts.length,
      totalPredictedDemand,
      totalRecommendedUnits,
    },

    priorities: {
      highestRiskProduct,
      highestDemandProduct,
    },

    products,
  };
}