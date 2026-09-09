import { getInventoryRecommendations } from "@/services/inventory-recommendation.service";

interface WhatIfDemandOptions {
  latitude: number;
  longitude: number;
  days?: number;
  productId?: string;
  demandChangePercent?: number;
  stockAdjustmentUnits?: number;
}

export async function simulateDemandScenario({
  latitude,
  longitude,
  days = 7,
  productId,
  demandChangePercent = 0,
  stockAdjustmentUnits = 0,
}: WhatIfDemandOptions) {
  const recommendationResult = await getInventoryRecommendations({
    latitude,
    longitude,
    days,
  });

  const products = productId
    ? recommendationResult.products.filter(
        (product) => product.productId === productId,
      )
    : recommendationResult.products;

  const demandMultiplier = 1 + demandChangePercent / 100;

  const simulations = products.map((product) => {
    const currentStock = product.inventory.currentStock;
    const reorderPoint = product.inventory.reorderPoint;

    const baseDailyDemand = product.forecast.predictedDailyDemand;

    const simulatedDailyDemand = Math.max(
      baseDailyDemand * demandMultiplier,
      0,
    );

    const simulatedStock = Math.max(
      currentStock + stockAdjustmentUnits,
      0,
    );

    const simulatedForecastDemand =
      simulatedDailyDemand * days;

    const simulatedCoverageDays =
      simulatedDailyDemand > 0
        ? simulatedStock / simulatedDailyDemand
        : null;

    const targetStock = Math.ceil(
      simulatedForecastDemand + reorderPoint,
    );

    const recommendedRestockQuantity = Math.max(
      targetStock - simulatedStock,
      0,
    );

    let simulatedDecision:
      | "RESTOCK_NOW"
      | "RESTOCK_SOON"
      | "MONITOR"
      | "NO_ACTION";

    if (simulatedStock <= 0) {
      simulatedDecision = "RESTOCK_NOW";
    } else if (simulatedStock <= reorderPoint) {
      simulatedDecision = "RESTOCK_SOON";
    } else if (
      simulatedCoverageDays !== null &&
      simulatedCoverageDays < days
    ) {
      simulatedDecision = "RESTOCK_SOON";
    } else if (
      demandChangePercent > 10
    ) {
      simulatedDecision = "MONITOR";
    } else {
      simulatedDecision = "NO_ACTION";
    }

    return {
      productId: product.productId,
      productName: product.productName,

      base: {
        currentStock,
        predictedDailyDemand: baseDailyDemand,
        predictedDemand: product.forecast.predictedDemand,
      },

      scenario: {
        demandChangePercent,
        stockAdjustmentUnits,
        days,
      },

      simulated: {
        dailyDemand: Number(
          simulatedDailyDemand.toFixed(2),
        ),
        forecastDemand: Number(
          simulatedForecastDemand.toFixed(2),
        ),
        stock: simulatedStock,
        coverageDays:
          simulatedCoverageDays === null
            ? null
            : Number(
                simulatedCoverageDays.toFixed(2),
              ),
      },

      inventory: {
        reorderPoint,
        targetStock,
        recommendedRestockQuantity,
      },

      decision: simulatedDecision,
    };
  });

  return {
    scenario: {
      days,
      productId: productId ?? null,
      demandChangePercent,
      stockAdjustmentUnits,
    },
    products: simulations,
  };
}