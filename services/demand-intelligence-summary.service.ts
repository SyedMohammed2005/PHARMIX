import { getInventoryIntelligence } from "@/services/inventory-intelligence.service";

interface DemandIntelligenceSummaryOptions {
  latitude: number;
  longitude: number;
  days?: number;
  topProducts?: number;
}

type DemandStatus =
  | "HIGH"
  | "MODERATE"
  | "LOW";

function getDemandStatus({
  highDemandProducts,
  moderateDemandProducts,
}: {
  highDemandProducts: number;
  moderateDemandProducts: number;
}): DemandStatus {
  if (highDemandProducts > 0) {
    return "HIGH";
  }

  if (moderateDemandProducts > 0) {
    return "MODERATE";
  }

  return "LOW";
}

export async function getDemandIntelligenceSummary({
  latitude,
  longitude,
  days = 7,
  topProducts = 5,
}: DemandIntelligenceSummaryOptions) {
  const forecastDays = Math.min(
    Math.max(Number(days) || 7, 1),
    90,
  );

  const limit = Math.min(
    Math.max(Number(topProducts) || 5, 1),
    20,
  );

  /*
   * Inventory intelligence already combines:
   *
   * Weather
   * Seasonal demand signals
   * Recent sales
   * ML demand prediction
   * Stock coverage
   * Inventory risk
   * Inventory priority
   *
   * Therefore we reuse that result instead of
   * calling the lower-level services again.
   */
  const intelligence =
    await getInventoryIntelligence({
      latitude,
      longitude,
      days: forecastDays,
    });

  const products =
    intelligence.products;

  /*
   * Demand-related product groups.
   */
  const highDemandProducts =
    products.filter(
      (product) =>
        product.demandSignal === "HIGH",
    );

  const moderateDemandProducts =
    products.filter(
      (product) =>
        product.demandSignal ===
        "MODERATE",
    );

  const seasonalProducts =
    products.filter(
      (product) =>
        product.seasonalRelevance,
    );

  /*
   * Inventory-related product groups.
   */
  const criticalInventoryProducts =
    products.filter(
      (product) =>
        product.riskLevel === "CRITICAL",
    );

  const stockoutProducts =
    products.filter(
      (product) =>
        product.priority === "STOCKOUT",
    );

  const urgentRestockProducts =
    products.filter(
      (product) =>
        product.priority ===
        "URGENT_RESTOCK",
    );

  const restockProducts =
    products.filter(
      (product) =>
        product.priority === "RESTOCK",
    );

  const monitorProducts =
    products.filter(
      (product) =>
        product.priority === "MONITOR",
    );

  const healthyProducts =
    products.filter(
      (product) =>
        product.priority === "HEALTHY",
    );

  /*
   * Total forecasted demand across all
   * products for the selected horizon.
   */
  const totalPredictedDemand =
    products.reduce(
      (total, product) =>
        total + product.predictedDemand,
      0,
    );

  /*
   * Total predicted demand per day.
   */
  const totalPredictedDailyDemand =
    products.reduce(
      (total, product) =>
        total +
        product.predictedDailyDemand,
      0,
    );

  /*
   * Products with the highest predicted demand.
   *
   * Predicted daily demand is the primary
   * ranking because products may have
   * different forecast horizons.
   *
   * Recent sales are used as a tie-breaker.
   */
  const topDemandProducts =
    [...products]
      .sort((a, b) => {
        if (
          b.predictedDailyDemand !==
          a.predictedDailyDemand
        ) {
          return (
            b.predictedDailyDemand -
            a.predictedDailyDemand
          );
        }

        if (
          b.recentSalesQuantity !==
          a.recentSalesQuantity
        ) {
          return (
            b.recentSalesQuantity -
            a.recentSalesQuantity
          );
        }

        return a.productName.localeCompare(
          b.productName,
        );
      })
      .slice(0, limit)
      .map((product) => ({
        productId:
          product.productId,

        productName:
          product.productName,

        category:
          product.category,

        predictedDemand:
          product.predictedDemand,

        predictedDailyDemand:
          product.predictedDailyDemand,

        recentSalesQuantity:
          product.recentSalesQuantity,

        demandSignal:
          product.demandSignal,

        seasonalRelevance:
          product.seasonalRelevance,

        currentStock:
          product.currentStock,

        stockCoverageDays:
          product.stockCoverageDays,

        riskScore:
          product.riskScore,

        riskLevel:
          product.riskLevel,

        priority:
          product.priority,
      }));

  /*
   * Seasonally relevant products.
   */
  const seasonalDemandProducts =
    seasonalProducts
      .sort((a, b) => {
        if (
          b.predictedDailyDemand !==
          a.predictedDailyDemand
        ) {
          return (
            b.predictedDailyDemand -
            a.predictedDailyDemand
          );
        }

        return (
          b.recentSalesQuantity -
          a.recentSalesQuantity
        );
      })
      .slice(0, limit)
      .map((product) => ({
        productId:
          product.productId,

        productName:
          product.productName,

        category:
          product.category,

        demandSignal:
          product.demandSignal,

        recentSalesQuantity:
          product.recentSalesQuantity,

        predictedDailyDemand:
          product.predictedDailyDemand,

        predictedDemand:
          product.predictedDemand,

        seasonalRelevance:
          product.seasonalRelevance,

        reason:
          product.explanation,
      }));

  /*
   * Critical inventory products.
   */
  const criticalProducts =
    criticalInventoryProducts
      .slice(0, limit)
      .map((product) => ({
        productId:
          product.productId,

        productName:
          product.productName,

        currentStock:
          product.currentStock,

        predictedDemand:
          product.predictedDemand,

        stockCoverageDays:
          product.stockCoverageDays,

        riskScore:
          product.riskScore,

        riskLevel:
          product.riskLevel,

        priority:
          product.priority,

        recommendation:
          product.priority ===
          "STOCKOUT"
            ? "RESTOCK_IMMEDIATELY"
            : "URGENT_REVIEW",
      }));

  /*
   * Overall demand status.
   *
   * This represents demand pressure,
   * not inventory risk.
   */
  const demandStatus =
    getDemandStatus({
      highDemandProducts:
        highDemandProducts.length,

      moderateDemandProducts:
        moderateDemandProducts.length,
    });

  /*
   * Generate business-level insights.
   */
  const insights: string[] = [];

  if (
    highDemandProducts.length > 0
  ) {
    insights.push(
      `${highDemandProducts.length} product${
        highDemandProducts.length === 1
          ? ""
          : "s"
      } currently have high demand signals.`,
    );
  }

  if (
    moderateDemandProducts.length > 0
  ) {
    insights.push(
      `${moderateDemandProducts.length} product${
        moderateDemandProducts.length === 1
          ? ""
          : "s"
      } currently have moderate demand signals.`,
    );
  }

  if (
    seasonalProducts.length > 0
  ) {
    insights.push(
      `${seasonalProducts.length} product${
        seasonalProducts.length === 1
          ? ""
          : "s"
      } show seasonal relevance during the current ${
        intelligence.seasonalSignals.season
      } conditions.`,
    );
  }

  if (
    stockoutProducts.length > 0
  ) {
    insights.push(
      `${stockoutProducts.length} product${
        stockoutProducts.length === 1
          ? ""
          : "s"
      } are currently out of stock and require immediate attention.`,
    );
  }

  if (
    urgentRestockProducts.length > 0
  ) {
    insights.push(
      `${urgentRestockProducts.length} product${
        urgentRestockProducts.length === 1
          ? ""
          : "s"
      } require urgent inventory replenishment.`,
    );
  }

  if (
    monitorProducts.length > 0
  ) {
    insights.push(
      `${monitorProducts.length} product${
        monitorProducts.length === 1
          ? ""
          : "s"
      } should be monitored because inventory risk is elevated.`,
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Current demand and inventory conditions are stable with no major issues detected.",
    );
  }

  return {
    demandStatus,

    environment: {
      weather:
        intelligence.weather,

      seasonalSignals:
        intelligence.seasonalSignals,
    },

    forecast: {
      days: forecastDays,
    },

    summary: {
      totalProducts:
        products.length,

      seasonallyRelevantProducts:
        seasonalProducts.length,

      highDemandSignalProducts:
        highDemandProducts.length,

      moderateDemandSignalProducts:
        moderateDemandProducts.length,

      totalPredictedDemand:
        Number(
          totalPredictedDemand.toFixed(2),
        ),

      totalPredictedDailyDemand:
        Number(
          totalPredictedDailyDemand.toFixed(
            2,
          ),
        ),

      criticalInventoryProducts:
        criticalInventoryProducts.length,

      stockoutProducts:
        stockoutProducts.length,

      urgentRestockProducts:
        urgentRestockProducts.length,

      restockProducts:
        restockProducts.length,

      monitorProducts:
        monitorProducts.length,

      healthyProducts:
        healthyProducts.length,
    },

    topDemandProducts,

    seasonalDemandProducts,

    criticalProducts,

    insights,
  };
}

