import { getDemandIntelligence } from "@/services/demand-intelligence.service";
import { getDemandPredictions } from "@/services/prediction.service";

interface InventoryIntelligenceOptions {
  latitude: number;
  longitude: number;
  days?: number;
}

type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type InventoryPriority =
  | "STOCKOUT"
  | "URGENT_RESTOCK"
  | "RESTOCK"
  | "MONITOR"
  | "HEALTHY";

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function getPriority(
  riskLevel: RiskLevel,
  currentStock: number,
): InventoryPriority {
  if (currentStock <= 0) return "STOCKOUT";

  if (riskLevel === "CRITICAL") return "URGENT_RESTOCK";
  if (riskLevel === "HIGH") return "RESTOCK";
  if (riskLevel === "MEDIUM") return "MONITOR";

  return "HEALTHY";
}

function calculateRiskScore({
  currentStock,
  reorderPoint,
  predictedDemand,
  recentSalesQuantity,
  seasonalRelevance,
  demandSignal,
}: {
  currentStock: number;
  reorderPoint: number;
  predictedDemand: number;
  recentSalesQuantity: number;
  seasonalRelevance: boolean;
  demandSignal: "LOW" | "MODERATE" | "HIGH";
}): number {
  let score = 0;

  // Immediate stockout risk.
  if (currentStock <= 0) {
    score += 100;
  } else {
    // Stock below reorder point.
    if (currentStock <= reorderPoint) {
      score += 40;
    }

    // Stock is close to reorder point.
    if (
      currentStock > reorderPoint &&
      currentStock <= reorderPoint * 1.5
    ) {
      score += 20;
    }

    // Compare available stock with forecast demand.
    if (predictedDemand > 0) {
     const forecastCoverageRatio =
  currentStock / predictedDemand;
     if (forecastCoverageRatio < 0.5) {
  score += 40;
} else if (forecastCoverageRatio < 1) {
  score += 30;
} else if (forecastCoverageRatio < 2) {
  score += 15;
}
    }
  }

  // Historical demand pressure.
  if (recentSalesQuantity >= 10) {
    score += 15;
  } else if (recentSalesQuantity >= 5) {
    score += 8;
  }

  // Seasonal demand pressure.
  if (seasonalRelevance) {
    if (demandSignal === "HIGH") {
      score += 20;
    } else if (demandSignal === "MODERATE") {
      score += 10;
    }
  }

  return Math.min(Math.round(score), 100);
}

export async function getInventoryIntelligence({
  latitude,
  longitude,
  days = 7,
}: InventoryIntelligenceOptions) {
  const forecastDays = Math.max(
    Number(days) || 7,
    1,
  );

  const [demandIntelligence, predictions] =
    await Promise.all([
      getDemandIntelligence({
        latitude,
        longitude,
      }),

      getDemandPredictions({
        days: forecastDays,
      }),
    ]);

  /*
   * Match predictions using the stable product ID.
   *
   * IMPORTANT:
   * Never match predictions using product names.
   */
  const predictionMap = new Map(
    predictions.map((prediction) => [
      prediction.productId,
      prediction,
    ]),
  );

  const products = demandIntelligence.products.map(
    (product) => {
      const prediction = predictionMap.get(
        product.productId,
      );

      /*
       * The ML service predicts DAILY demand.
       *
       * Convert that daily prediction into demand
       * for the selected forecast period.
       */
      const predictedDailyDemand =
        prediction?.prediction
          ?.predictedDailyDemand ?? 0;

      const predictedDemand =
        predictedDailyDemand * forecastDays;

      const recentSalesQuantity =
        product.recentSalesQuantity;

      /*
       * Use the actual reorder point from the
       * prediction features when available.
       *
       * The fallback remains 10 until the demand
       * intelligence layer exposes Inventory directly.
       */
      const reorderPoint =
        prediction?.features?.reorderPoint ?? 10;

      const riskScore = calculateRiskScore({
        currentStock:
          product.currentStock,

        reorderPoint,

        predictedDemand,

        recentSalesQuantity,

        seasonalRelevance:
          product.seasonalRelevance,

        demandSignal:
          product.demandSignal,
      });

      const riskLevel =
        getRiskLevel(riskScore);

      const priority = getPriority(
        riskLevel,
        product.currentStock,
      );

      /*
       * Stock coverage is calculated from DAILY
       * predicted demand.
       *
       * Example:
       * currentStock = 126
       * predictedDailyDemand = 10.13
       *
       * coverage = 126 / 10.13 = ~12.44 days
       */
      const stockCoverageDays =
        predictedDailyDemand > 0
          ? Number(
              (
                product.currentStock /
                predictedDailyDemand
              ).toFixed(2),
            )
          : null;

      let explanation =
        "Inventory level is currently healthy.";

      if (product.currentStock <= 0) {
        explanation =
          "The product is currently out of stock and requires immediate inventory attention.";
      } else if (
        product.currentStock <=
        reorderPoint
      ) {
        explanation =
          "Current stock is at or below the reorder point.";
      } else if (
        product.seasonalRelevance
      ) {
        explanation =
          `Seasonal demand signals indicate potential relevance during the current ${demandIntelligence.seasonalSignals.season} conditions.`;
      } else if (
        predictedDemand > 0 &&
        product.currentStock <
          predictedDemand
      ) {
        explanation =
          `Current stock may not fully cover the selected ${forecastDays}-day predicted demand.`;
      }

      return {
        productId:
          product.productId,

        productName:
          product.productName,

        category:
          product.category,

        currentStock:
          product.currentStock,

        reorderPoint,

        recentSalesQuantity,

        seasonalRelevance:
          product.seasonalRelevance,

        demandSignal:
          product.demandSignal,

        predictedDemand:
          Number(
            predictedDemand.toFixed(2),
          ),

        forecastDays,

        predictedDailyDemand:
          Number(
            predictedDailyDemand.toFixed(2),
          ),

        stockCoverageDays,

        riskScore,

        riskLevel,

        priority,

        explanation,
      };
    },
  );

  const sortedProducts =
    products.sort(
      (a, b) =>
        b.riskScore - a.riskScore,
    );

  return {
    weather:
      demandIntelligence.weather,

    seasonalSignals:
      demandIntelligence.seasonalSignals,

    forecast: {
      days: forecastDays,
    },

    summary: {
      totalProducts:
        products.length,

      criticalRiskProducts:
        products.filter(
          (product) =>
            product.riskLevel ===
            "CRITICAL",
        ).length,

      highRiskProducts:
        products.filter(
          (product) =>
            product.riskLevel ===
            "HIGH",
        ).length,

      mediumRiskProducts:
        products.filter(
          (product) =>
            product.riskLevel ===
            "MEDIUM",
        ).length,

      lowRiskProducts:
        products.filter(
          (product) =>
            product.riskLevel ===
            "LOW",
        ).length,

      stockoutProducts:
        products.filter(
          (product) =>
            product.priority ===
            "STOCKOUT",
        ).length,

      urgentRestockProducts:
        products.filter(
          (product) =>
            product.priority ===
            "URGENT_RESTOCK",
        ).length,
    },

    products:
      sortedProducts,
  };
}

