import { getInventoryRecommendations } from "@/services/inventory-recommendation.service";
import {
  getExpiringBatches,
  getExpiredBatches,
} from "@/services/batch.service";

interface InventoryAlertOptions {
  latitude: number;
  longitude: number;
  days?: number;
}

type AlertType =
  | "STOCKOUT"
  | "RESTOCK_REQUIRED"
  | "LOW_STOCK"
  | "DEMAND_INCREASE"
  | "EXPIRY_RISK";

type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export async function getInventoryAlerts({
  latitude,
  longitude,
  days = 7,
}: InventoryAlertOptions) {
  const [recommendationResult, expiringBatches, expiredBatches] =
    await Promise.all([
      getInventoryRecommendations({
        latitude,
        longitude,
        days,
      }),
      getExpiringBatches(30),
      getExpiredBatches(),
    ]);

  const alerts = [];

  // -----------------------------------------
  // Inventory / AI alerts
  // -----------------------------------------

  for (const product of recommendationResult.products) {
    const {
      productId,
      productName,
      decision,
      inventory,
      demand,
      risk,
    } = product;

    // 1. STOCKOUT
    if (inventory.currentStock <= 0) {
      alerts.push({
        alertId: `STOCKOUT-${productId}`,
        productId,
        productName,
        type: "STOCKOUT" as AlertType,
        severity: "CRITICAL" as AlertSeverity,
        message: `${productName} is currently out of stock.`,
        recommendedAction: "Restock immediately.",
      });

      continue;
    }

    // 2. RESTOCK REQUIRED
    if (decision === "RESTOCK_NOW") {
      alerts.push({
        alertId: `RESTOCK-${productId}`,
        productId,
        productName,
        type: "RESTOCK_REQUIRED" as AlertType,
        severity: "HIGH" as AlertSeverity,
        message: `${productName} requires immediate replenishment.`,
        recommendedAction: `Replenish ${product.recommendation.recommendedRestockQuantity} units.`,
      });

      continue;
    }

    // 3. LOW STOCK
    if (inventory.currentStock <= inventory.reorderPoint) {
      alerts.push({
        alertId: `LOW-STOCK-${productId}`,
        productId,
        productName,
        type: "LOW_STOCK" as AlertType,
        severity: "MEDIUM" as AlertSeverity,
        message: `${productName} has reached or fallen below its reorder point.`,
        recommendedAction: `Review replenishment for at least ${product.recommendation.recommendedRestockQuantity} units.`,
      });
    }

    // 4. DEMAND INCREASE
  if (
  demand.trend === "INCREASING" &&
  demand.growthPercentage !== null &&
  demand.growthPercentage > 10
){
      alerts.push({
        alertId: `DEMAND-${productId}`,
        productId,
        productName,
        type: "DEMAND_INCREASE" as AlertType,
       severity:
  demand.growthPercentage !== null &&
  demand.growthPercentage >= 25
    ? "HIGH"
    : "MEDIUM",
     message: `${productName} demand is increasing by ${demand.growthPercentage?.toFixed(2) ?? "0.00"}%.`,
        recommendedAction:
          "Monitor demand and consider increasing replenishment.",
      });
    }
  }

  // -----------------------------------------
  // Expiry alerts
  // -----------------------------------------

  for (const batch of expiredBatches) {
    alerts.push({
      alertId: `EXPIRED-${batch.id}`,
      productId: batch.productId,
      productName: batch.product.name,
      type: "EXPIRY_RISK" as AlertType,
      severity: "CRITICAL" as AlertSeverity,
      message: `Batch ${batch.batchNumber} of ${batch.product.name} has expired.`,
      recommendedAction:
        "Remove the expired batch from sale and review disposal/return procedures.",
    });
  }

  for (const batch of expiringBatches) {
    alerts.push({
      alertId: `EXPIRING-${batch.id}`,
      productId: batch.productId,
      productName: batch.product.name,
      type: "EXPIRY_RISK" as AlertType,
      severity: "HIGH" as AlertSeverity,
      message: `Batch ${batch.batchNumber} of ${batch.product.name} is expiring within 30 days.`,
      recommendedAction:
        "Prioritize the batch for sale or review supplier return options.",
    });
  }

  return {
    alerts,
    summary: {
      totalAlerts: alerts.length,
      critical: alerts.filter(
        (alert) => alert.severity === "CRITICAL",
      ).length,
      high: alerts.filter(
        (alert) => alert.severity === "HIGH",
      ).length,
      medium: alerts.filter(
        (alert) => alert.severity === "MEDIUM",
      ).length,
      low: alerts.filter(
        (alert) => alert.severity === "LOW",
      ).length,
    },
  };
}