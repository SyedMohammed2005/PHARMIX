import { getInventoryIntelligence } from "@/services/inventory-intelligence.service";
import { getPredictionMonitoring } from "@/services/prediction-monitoring.service";

type InventoryDecision =
  | "RESTOCK_NOW"
  | "RESTOCK_SOON"
  | "MONITOR"
  | "NO_ACTION";

interface InventoryDecisionOptions {
  latitude: number;
  longitude: number;
  days?: number;
}

function getDecision({
  currentStock,
  reorderPoint,
  stockCoverageDays,
  forecastDays,
  trend,
  riskLevel,
}: {
  currentStock: number;
  reorderPoint: number;
 stockCoverageDays: number | null;
  forecastDays: number;
  trend: string | null;
  riskLevel: string;
}): InventoryDecision {
  if (currentStock <= 0) {
    return "RESTOCK_NOW";
  }

  if (riskLevel === "CRITICAL") {
    return "RESTOCK_NOW";
  }

  if (currentStock <= reorderPoint) {
    return "RESTOCK_SOON";
  }

    if (
        trend === "INCREASING" &&
        stockCoverageDays !== null &&
        stockCoverageDays < forecastDays
    ) {
        return "RESTOCK_SOON";
    }

  if (trend === "INCREASING") {
    return "MONITOR";
  }

  return "NO_ACTION";
}

function getDecisionReason(
  decision: InventoryDecision,
  trend: string | null,
  growthPercentage: number | null,
  stockCoverageDays: number | null,
  currentStock: number,
  reorderPoint: number
): string {
  switch (decision) {
    case "RESTOCK_NOW":
      return currentStock <= 0
        ? "The product is currently out of stock. Immediate replenishment is required."
        : "The product has a critical inventory risk. Immediate replenishment is required.";

    case "RESTOCK_SOON":
      if (currentStock <= reorderPoint) {
        return `Current stock is at or below the reorder point of ${reorderPoint} units. Restocking should be planned soon.`;
      }

      return `Demand is increasing${growthPercentage !== null ? ` by ${growthPercentage.toFixed(2)}%` : ""}, while current stock covers approximately ${stockCoverageDays !== null
  ? stockCoverageDays.toFixed(2)
  : "unavailable"} days. Restocking should be planned soon.`;

    case "MONITOR":
      return `Demand is increasing${growthPercentage !== null ? ` by ${growthPercentage.toFixed(2)}%` : ""}, but current stock still provides approximately ${stockCoverageDays !== null
  ? stockCoverageDays.toFixed(2)
  : "unavailable"} days of coverage. Continue monitoring demand.`;

    case "NO_ACTION":
      return `Demand is ${trend?.toLowerCase() ?? "stable"} and current inventory does not require immediate action.`;
  }
}

export async function getInventoryDecisions({
  latitude,
  longitude,
  days = 7,
}: InventoryDecisionOptions) {
  const forecastDays = Math.min(
    Math.max(Number(days) || 7, 1),
    30
  );

  const [inventoryIntelligence, monitoring] =
    await Promise.all([
      getInventoryIntelligence({
        latitude,
        longitude,
        days: forecastDays,
      }),
      getPredictionMonitoring({
        days: forecastDays,
      }),
    ]);

  const monitoringMap = new Map(
    monitoring.map((product) => [
      product.productId,
      product,
    ])
  );

  return inventoryIntelligence.products.map((product) => {
    const prediction =
      monitoringMap.get(product.productId);

    const trend =
      prediction?.trend ?? null;

    const decision = getDecision({
      currentStock: product.currentStock,
      reorderPoint: product.reorderPoint,
      stockCoverageDays:
        product.stockCoverageDays,
      forecastDays,
      trend: trend?.direction ?? null,
      riskLevel: product.riskLevel,
    });

    return {
      productId: product.productId,
      productName: product.productName,

      decision,

      reason: getDecisionReason(
        decision,
        trend?.direction ?? null,
        trend?.growthPercentage ?? null,
        product.stockCoverageDays,
        product.currentStock,
        product.reorderPoint
      ),

      forecast: {
        days: forecastDays,
        predictedDailyDemand:
          product.predictedDailyDemand,
        predictedDemand:
          product.predictedDemand,
      },

      inventory: {
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint,
        stockCoverageDays:
          product.stockCoverageDays,
      },

      demand: {
        trend: trend?.direction ?? null,
        growthPercentage:
          trend?.growthPercentage ?? null,
      },

      risk: {
        level: product.riskLevel,
        score: product.riskScore,
        priority: product.priority,
      },
    };
  });
}