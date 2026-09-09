"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  CloudSun,
  FlaskConical,
  Package,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

/* ============================================================
   CONSTANTS
============================================================ */

const LATITUDE = 17.398945;
const LONGITUDE = 78.457085;
const FORECAST_DAYS = 7;

/* ============================================================
   DEMAND INTELLIGENCE
============================================================ */

type DemandIntelligenceResponse = {
  success: boolean;

  data: {
    demandStatus: string;

    environment: {
      weather: {
        latitude: number;
        longitude: number;
        timezone: string;
        temperature: number;
        humidity: number;
        precipitation: number;
        rain: number;
        weatherCode: number;
        fetchedAt: string;
      };

      seasonalSignals: {
        season: string;
        temperatureSignal: string;
        humiditySignal: string;
        rainfallSignal: string;
        weatherCondition: string;
        categories: string[];
        confidence: string;
        explanation: string;
      };
    };

    forecast: {
      days: number;
    };

    summary: {
      totalProducts: number;
      seasonallyRelevantProducts: number;
      highDemandSignalProducts: number;
      moderateDemandSignalProducts: number;
      totalPredictedDemand: number;
      totalPredictedDailyDemand: number;
      criticalInventoryProducts: number;
      stockoutProducts: number;
      urgentRestockProducts: number;
      restockProducts: number;
      monitorProducts: number;
      healthyProducts: number;
    };

    topDemandProducts: Array<{
      productId: string;
      productName: string;
      category: string;
      predictedDemand: number;
      predictedDailyDemand: number;
      recentSalesQuantity: number;
      demandSignal: string;
      seasonalRelevance: boolean;
      currentStock: number;
      stockCoverageDays: number | null;
      riskScore: number;
      riskLevel: string;
      priority: string;
    }>;

    seasonalDemandProducts: Array<{
      productId: string;
      productName: string;
      category: string;
      demandSignal: string;
      recentSalesQuantity: number;
      predictedDailyDemand: number;
      predictedDemand: number;
      seasonalRelevance: boolean;
      reason: string;
    }>;

    criticalProducts: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      predictedDemand: number;
      stockCoverageDays: number | null;
      riskScore: number;
      riskLevel: string;
      priority: string;
      recommendation: string;
    }>;

    insights: string[];
  };
};

/* ============================================================
   INVENTORY DECISIONS
============================================================ */

type InventoryDecision = {
  productId: string;
  productName: string;

  decision:
    | "RESTOCK_NOW"
    | "RESTOCK_SOON"
    | "MONITOR"
    | "NO_ACTION";

  reason: string;

  inventory: {
    currentStock: number;
    reorderPoint: number;
  };

  forecast: {
    days?: number;
    predictedDemand: number;
    predictedDailyDemand: number;
  };

  demand?: {
    trend: "INCREASING" | "DECREASING" | "STABLE" | null;
    growthPercentage: number | null;
  };

  risk: {
    score: number;
    level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    priority?: string;
  };
};

/* ============================================================
   INVENTORY RECOMMENDATIONS
============================================================ */

type InventoryRecommendation = {
  productId: string;
  productName: string;

  decision: string;

  inventory: {
    currentStock: number;
    reorderPoint: number;
  };

  forecast: {
    days: number;
    predictedDailyDemand: number;
    predictedDemand: number;
  };

  recommendation: {
    targetStock: number;
    recommendedRestockQuantity: number;
    urgency: "HIGH" | "MEDIUM" | "LOW";
    basis:
      | "INVENTORY_POLICY"
      | "DEMAND_FORECAST"
      | "COMBINED";
  };

  demand: {
    trend: "INCREASING" | "DECREASING" | "STABLE" | null;
    growthPercentage: number | null;
  };

  risk: {
    level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    score: number;
    priority: string;
  };

  reason: string;
};

/* ============================================================
   AI ALERTS
============================================================ */

type AIAlert = {
  id?: string;
  type:
    | "STOCKOUT"
    | "RESTOCK_REQUIRED"
    | "LOW_STOCK"
    | "DEMAND_INCREASE"
    | "EXPIRY_RISK"
    | string;

  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

  productId?: string | null;
  productName?: string | null;

  message?: string;
  reason?: string;
  title?: string;

  riskScore?: number;
};

/* ============================================================
   WHAT-IF SIMULATOR
============================================================ */

type WhatIfProduct = {
  productId: string;
  productName: string;

  decision?: string;

  currentStock?: number;
  simulatedStock?: number;

  reorderPoint?: number;

  predictedDailyDemand?: number;
  predictedDemand?: number;

  simulatedDailyDemand?: number;
  simulatedDemand?: number;

  stockCoverageDays?: number | null;
  simulatedStockCoverageDays?: number | null;

  recommendedRestockQuantity?: number;

  riskLevel?: string;
  riskScore?: number;

  demandChangePercent?: number;

  [key: string]: unknown;
};

type WhatIfResult = {
  forecast?: {
    days?: number;
  };

  demandChangePercent?: number;

  stockAdjustment?: number;

  products?: WhatIfProduct[];

  [key: string]: unknown;
};

/* ============================================================
   MAIN PAGE
============================================================ */

export default function AIDemandIntelligencePage() {
  const [data, setData] =
    useState<DemandIntelligenceResponse["data"] | null>(null);

  const [decisions, setDecisions] = useState<InventoryDecision[]>([]);

  const [recommendations, setRecommendations] =
    useState<InventoryRecommendation[]>([]);

  const [alerts, setAlerts] = useState<AIAlert[]>([]);

  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);

  const [whatIfChange, setWhatIfChange] = useState(20);

  const [whatIfStockAdjustment, setWhatIfStockAdjustment] =
    useState(0);

  const [whatIfLoading, setWhatIfLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ==========================================================
     LOAD ALL AI INTELLIGENCE
  ========================================================== */

  async function loadIntelligence(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      /* ------------------------------------------------------
         1. Demand Intelligence
      ------------------------------------------------------ */

      const intelligenceResponse = await fetch(
        `/api/ai/demand-intelligence?latitude=${LATITUDE}&longitude=${LONGITUDE}&days=${FORECAST_DAYS}&topProducts=5`,
        {
          cache: "no-store",
        },
      );

      if (!intelligenceResponse.ok) {
        throw new Error(
          "Failed to load AI demand intelligence",
        );
      }

      const intelligenceJson: DemandIntelligenceResponse =
        await intelligenceResponse.json();

      if (!intelligenceJson.success) {
        throw new Error(
          "AI intelligence request failed",
        );
      }

      setData(intelligenceJson.data);

      /* ------------------------------------------------------
         2. Inventory Decisions
      ------------------------------------------------------ */

      try {
        const decisionsResponse = await fetch(
          `/api/ai/inventory-decisions?latitude=${LATITUDE}&longitude=${LONGITUDE}&days=${FORECAST_DAYS}`,
          {
            cache: "no-store",
          },
        );

        if (decisionsResponse.ok) {
          const decisionsJson = await decisionsResponse.json();

          if (
            decisionsJson.success &&
            Array.isArray(decisionsJson.data?.products)
          ) {
            setDecisions(decisionsJson.data.products);
          } else {
            setDecisions([]);
          }
        }
      } catch (decisionError) {
        console.error(
          "Inventory decisions error:",
          decisionError,
        );

        setDecisions([]);
      }

      /* ------------------------------------------------------
         3. Inventory Recommendations
      ------------------------------------------------------ */

      try {
        const recommendationsResponse = await fetch(
          `/api/ai/inventory-recommendations?latitude=${LATITUDE}&longitude=${LONGITUDE}&days=${FORECAST_DAYS}`,
          {
            cache: "no-store",
          },
        );

        if (recommendationsResponse.ok) {
          const recommendationsJson =
            await recommendationsResponse.json();

          if (
            recommendationsJson.success &&
            Array.isArray(
              recommendationsJson.data?.products,
            )
          ) {
            setRecommendations(
              recommendationsJson.data.products,
            );
          } else {
            setRecommendations([]);
          }
        }
      } catch (recommendationError) {
        console.error(
          "Inventory recommendations error:",
          recommendationError,
        );

        setRecommendations([]);
      }

      /* ------------------------------------------------------
         4. AI Inventory Alerts
      ------------------------------------------------------ */

      try {
        const alertsResponse = await fetch(
          `/api/ai/inventory-alerts?latitude=${LATITUDE}&longitude=${LONGITUDE}&days=${FORECAST_DAYS}`,
          {
            cache: "no-store",
          },
        );

        if (alertsResponse.ok) {
          const alertsJson = await alertsResponse.json();

          const returnedAlerts =
            alertsJson.data?.alerts ??
            alertsJson.data?.products ??
            (Array.isArray(alertsJson.data)
              ? alertsJson.data
              : []);

          if (
            alertsJson.success &&
            Array.isArray(returnedAlerts)
          ) {
            setAlerts(returnedAlerts);
          } else {
            setAlerts([]);
          }
        }
      } catch (alertError) {
        console.error(
          "AI inventory alerts error:",
          alertError,
        );

        setAlerts([]);
      }

      /* ------------------------------------------------------
         5. What-if baseline
      ------------------------------------------------------ */

      await loadWhatIf(
        whatIfChange,
        whatIfStockAdjustment,
        false,
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* ==========================================================
     WHAT-IF SIMULATOR
  ========================================================== */

  async function loadWhatIf(
    demandChangePercent: number,
    stockAdjustment: number,
    updateLoading = true,
  ) {
    try {
      if (updateLoading) {
        setWhatIfLoading(true);
      }

      const response = await fetch(
        `/api/ai/what-if?latitude=${LATITUDE}&longitude=${LONGITUDE}&days=${FORECAST_DAYS}&demandChangePercent=${demandChangePercent}&stockAdjustment=${stockAdjustment}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to run what-if simulation",
        );
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(
          "What-if simulation request failed",
        );
      }

      setWhatIf(json.data);
    } catch (whatIfError) {
      console.error(
        "What-if simulator error:",
        whatIfError,
      );
    } finally {
      if (updateLoading) {
        setWhatIfLoading(false);
      }
    }
  }

  async function runWhatIfSimulation() {
    await loadWhatIf(
      whatIfChange,
      whatIfStockAdjustment,
      true,
    );
  }

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadIntelligence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <Brain className="h-7 w-7 animate-pulse text-emerald-600" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900">
                Analyzing pharmacy intelligence...
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Combining demand, inventory, weather and
                seasonal signals.
              </p>

              <div className="mx-auto mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     ERROR STATE
  ========================================================== */

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load AI intelligence
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error ??
                    "No intelligence data available."}
                </p>
              </div>
            </div>

            <button
              onClick={() => loadIntelligence(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     DATA ALIASES
  ========================================================== */

  const weather = data.environment.weather;

  const seasonal =
    data.environment.seasonalSignals;

  const summary = data.summary;

  const restockNowCount = decisions.filter(
    (item) => item.decision === "RESTOCK_NOW",
  ).length;

  const restockSoonCount = decisions.filter(
    (item) => item.decision === "RESTOCK_SOON",
  ).length;

  const monitorCount = decisions.filter(
    (item) => item.decision === "MONITOR",
  ).length;

  const noActionCount = decisions.filter(
    (item) => item.decision === "NO_ACTION",
  ).length;

  const recommendedUnits = recommendations.reduce(
    (total, item) =>
      total +
      item.recommendation.recommendedRestockQuantity,
    0,
  );

  const highUrgencyRecommendations =
    recommendations.filter(
      (item) =>
        item.recommendation.urgency === "HIGH",
    ).length;

  const criticalAlerts = alerts.filter(
    (item) => item.severity === "CRITICAL",
  ).length;

  const highAlerts = alerts.filter(
    (item) => item.severity === "HIGH",
  ).length;

  const mediumAlerts = alerts.filter(
    (item) => item.severity === "MEDIUM",
  ).length;

  const simulatedProducts = whatIf?.products ?? [];

  const simulatedRestockCount =
    simulatedProducts.filter(
      (item) =>
        item.decision === "RESTOCK_NOW" ||
        item.decision === "RESTOCK_SOON",
    ).length;

  const simulatedTotalRestock =
    simulatedProducts.reduce(
      (total, item) =>
        total +
        Number(
          item.recommendedRestockQuantity ?? 0,
        ),
      0,
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-emerald-100">
                      PHARMIX AI
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight">
                      Demand Intelligence
                    </h1>
                  </div>
                </div>

                <p className="max-w-2xl text-sm leading-6 text-emerald-50">
                  AI-powered pharmacy intelligence combining
                  sales history, demand forecasting, inventory
                  conditions, environmental signals and
                  operational recommendations.
                </p>
              </div>

              <button
                onClick={() => loadIntelligence(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh intelligence"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                Status: {data.demandStatus}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                {data.forecast.days}-day intelligence
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                Confidence: {seasonal.confidence}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                {weather.timezone}
              </span>
            </div>
          </div>

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 right-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        </section>

        {/* =====================================================
            EXECUTIVE OVERVIEW
        ====================================================== */}

        <section>
          <div className="mb-4">
            <p className="text-sm font-medium text-emerald-600">
              EXECUTIVE OVERVIEW
            </p>

            <h2 className="text-2xl font-bold text-gray-900">
              What is happening right now?
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              A high-level view of current demand and
              inventory conditions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={
                <Package className="h-5 w-5" />
              }
              label="Products analyzed"
              value={summary.totalProducts}
              description={`${summary.seasonallyRelevantProducts} seasonally relevant`}
            />

            <MetricCard
              icon={
                <TrendingUp className="h-5 w-5" />
              }
              label="Predicted demand"
              value={summary.totalPredictedDemand.toFixed(
                1,
              )}
              description={`${summary.totalPredictedDailyDemand.toFixed(2)} units/day`}
            />

            <MetricCard
              icon={
                <AlertTriangle className="h-5 w-5" />
              }
              label="Critical products"
              value={summary.criticalInventoryProducts}
              description={`${summary.stockoutProducts} stockouts`}
              danger
            />

            <MetricCard
              icon={
                <Bell className="h-5 w-5" />
              }
              label="AI alerts"
              value={alerts.length}
              description={`${criticalAlerts} critical · ${highAlerts} high`}
              danger={criticalAlerts > 0}
            />
          </div>
        </section>

        {/* =====================================================
            ENVIRONMENTAL INTELLIGENCE
        ====================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-100 p-3">
                <CloudSun className="h-6 w-6 text-sky-600" />
              </div>

              <div>
                <p className="text-sm font-medium text-sky-600">
                  ENVIRONMENTAL INTELLIGENCE
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  Weather & seasonal context
                </h2>
              </div>
            </div>

            <span className="hidden rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 sm:block">
              Live environment
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Temperature"
              value={`${weather.temperature.toFixed(
                1,
              )}°C`}
            />

            <InfoCard
              label="Humidity"
              value={`${weather.humidity}%`}
            />

            <InfoCard
              label="Season"
              value={seasonal.season}
            />

            <InfoCard
              label="Weather"
              value={seasonal.weatherCondition}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
                Temperature signal:{" "}
                {seasonal.temperatureSignal}
              </span>

              <span className="rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
                Humidity:{" "}
                {seasonal.humiditySignal}
              </span>

              <span className="rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
                Rainfall:{" "}
                {seasonal.rainfallSignal}
              </span>

              <span className="rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
                Precipitation:{" "}
                {weather.precipitation}
              </span>

              <span className="rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm">
                Confidence:{" "}
                {seasonal.confidence}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm leading-6 text-sky-900">
              {seasonal.explanation}
            </p>
          </div>

          {seasonal.categories.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Relevant health categories
              </p>

              <div className="flex flex-wrap gap-2">
                {seasonal.categories.map(
                  (category) => (
                    <span
                      key={category}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                    >
                      {category.replaceAll(
                        "_",
                        " ",
                      )}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </section>

        {/* =====================================================
            DEMAND FORECAST
        ====================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3">
              <Brain className="h-6 w-6 text-violet-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-violet-600">
                DEMAND FORECAST
              </p>

              <h2 className="text-xl font-bold text-gray-900">
                Highest predicted demand
              </h2>
            </div>
          </div>

          {data.topDemandProducts.length === 0 ? (
            <EmptyState
              icon={
                <Package className="h-8 w-8 text-gray-400" />
              }
              title="No demand forecast data available."
              description="More sales history may be required for demand prediction."
            />
          ) : (
            <div className="space-y-3">
              {data.topDemandProducts.map(
                (product) => (
                  <div
                    key={product.productId}
                    className="rounded-2xl border border-gray-100 p-4 transition hover:border-emerald-200 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {product.productName}
                          </h3>

                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                            {product.demandSignal}
                          </span>

                          {product.seasonalRelevance && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Seasonal
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {product.predictedDailyDemand.toFixed(
                            2,
                          )}{" "}
                          units/day ·{" "}
                          {product.predictedDemand.toFixed(
                            1,
                          )}{" "}
                          units /{" "}
                          {data.forecast.days} days
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Recent sales:{" "}
                          {product.recentSalesQuantity}{" "}
                          units · Category:{" "}
                          {product.category}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <SmallMetric
                          label="Stock"
                          value={
                            product.currentStock
                          }
                        />

                        <SmallMetric
                          label="Coverage"
                          value={
                            product.stockCoverageDays ===
                            null
                              ? "—"
                              : `${product.stockCoverageDays.toFixed(
                                  1,
                                )}d`
                          }
                        />

                        <SmallMetric
                          label="Risk"
                          value={`${product.riskLevel} (${product.riskScore})`}
                        />

                        <SmallMetric
                          label="Priority"
                          value={product.priority}
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            INVENTORY SITUATION
        ====================================================== */}

        <section>
          <div className="mb-4">
            <p className="text-sm font-medium text-emerald-600">
              INVENTORY INTELLIGENCE
            </p>

            <h2 className="text-2xl font-bold text-gray-900">
              Inventory situation
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="High demand signals"
              value={String(
                summary.highDemandSignalProducts,
              )}
            />

            <InfoCard
              label="Moderate demand signals"
              value={String(
                summary.moderateDemandSignalProducts,
              )}
            />

            <InfoCard
              label="Restock required"
              value={String(
                summary.restockProducts,
              )}
            />

            <InfoCard
              label="Urgent restock"
              value={String(
                summary.urgentRestockProducts,
              )}
            />
          </div>
        </section>

        {/* =====================================================
            AI DECISIONS
        ====================================================== */}

        <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>

              <div>
                <p className="text-sm font-medium text-indigo-600">
                  AI DECISIONS
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  What should the pharmacy do?
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Operational decisions generated from
                  demand and inventory signals.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                Restock now: {restockNowCount}
              </span>

              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">
                Restock soon: {restockSoonCount}
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                Monitor: {monitorCount}
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                No action: {noActionCount}
              </span>
            </div>
          </div>

          {decisions.length === 0 ? (
            <EmptyState
              icon={
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              }
              title="No inventory decisions available."
              description="The AI decision service did not return any products."
            />
          ) : (
            <div className="space-y-3">
              {decisions.map((item) => (
                <DecisionCard
                  key={item.productId}
                  decision={item}
                />
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            AI RECOMMENDATIONS
        ====================================================== */}

        <section className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-100 p-3">
                <Package className="h-6 w-6 text-cyan-600" />
              </div>

              <div>
                <p className="text-sm font-medium text-cyan-600">
                  AI RECOMMENDATIONS
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  Inventory replenishment plan
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Recommended quantities based on forecast
                  demand and inventory policy.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
                Recommended units:{" "}
                {recommendedUnits}
              </span>

              <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                High urgency:{" "}
                {highUrgencyRecommendations}
              </span>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <EmptyState
              icon={
                <Package className="h-8 w-8 text-gray-400" />
              }
              title="No inventory recommendations available."
              description="The recommendation service did not return any products."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {recommendations.map((item) => (
                <RecommendationCard
                  key={item.productId}
                  item={item}
                />
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            AI ALERTS
        ====================================================== */}

        <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-3">
                <Bell className="h-6 w-6 text-amber-600" />
              </div>

              <div>
                <p className="text-sm font-medium text-amber-600">
                  AI INVENTORY ALERTS
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  Issues requiring attention
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Prioritized alerts generated from inventory,
                  demand and expiry intelligence.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                Critical: {criticalAlerts}
              </span>

              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">
                High: {highAlerts}
              </span>

              <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-yellow-700">
                Medium: {mediumAlerts}
              </span>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

              <p className="mt-3 text-sm font-semibold text-emerald-800">
                No active AI inventory alerts.
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                The current intelligence cycle has not
                identified additional alert conditions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts
                .slice()
                .sort(
                  (a, b) =>
                    severityWeight(b.severity) -
                    severityWeight(a.severity),
                )
                .map((alert, index) => (
                  <AlertCard
                    key={
                      alert.id ??
                      `${alert.type}-${alert.productId}-${index}`
                    }
                    alert={alert}
                  />
                ))}
            </div>
          )}
        </section>

        {/* =====================================================
            CRITICAL PRODUCTS
        ====================================================== */}

        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-red-600">
                CRITICAL INVENTORY
              </p>

              <h2 className="text-xl font-bold text-gray-900">
                Products requiring attention
              </h2>
            </div>
          </div>

          {data.criticalProducts.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <p className="text-sm font-medium text-emerald-700">
                No critical inventory products.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.criticalProducts.map(
                (product) => (
                  <div
                    key={product.productId}
                    className="rounded-2xl border border-red-100 bg-red-50/50 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {product.productName}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          Current stock:{" "}
                          {product.currentStock} ·
                          Risk score:{" "}
                          {product.riskScore}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                          {product.riskLevel}
                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                          {product.priority}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                          {product.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            WHAT-IF SIMULATOR
        ====================================================== */}

        <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-3">
                <FlaskConical className="h-6 w-6 text-purple-600" />
              </div>

              <div>
                <p className="text-sm font-medium text-purple-600">
                  WHAT-IF SIMULATOR
                </p>

                <h2 className="text-xl font-bold text-gray-900">
                  Test future demand scenarios
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                  Simulate demand changes and stock adjustments
                  without changing pharmacy data.
                </p>
              </div>
            </div>

            <span className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700">
              Simulation only · No database writes
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="demand-change"
                  className="text-sm font-semibold text-gray-700"
                >
                  Demand change
                </label>

                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                  {whatIfChange > 0 ? "+" : ""}
                  {whatIfChange}%
                </span>
              </div>

              <input
                id="demand-change"
                type="range"
                min="-100"
                max="300"
                step="10"
                value={whatIfChange}
                onChange={(event) =>
                  setWhatIfChange(
                    Number(event.target.value),
                  )
                }
                className="w-full accent-purple-600"
              />

              <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                <span>-100%</span>
                <span>0%</span>
                <span>+100%</span>
                <span>+200%</span>
                <span>+300%</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="stock-adjustment"
                  className="text-sm font-semibold text-gray-700"
                >
                  Stock adjustment
                </label>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                  {whatIfStockAdjustment > 0
                    ? "+"
                    : ""}
                  {whatIfStockAdjustment} units
                </span>
              </div>

              <input
                id="stock-adjustment"
                type="range"
                min="-100"
                max="100"
                step="5"
                value={whatIfStockAdjustment}
                onChange={(event) =>
                  setWhatIfStockAdjustment(
                    Number(event.target.value),
                  )
                }
                className="w-full accent-slate-600"
              />

              <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                <span>-100</span>
                <span>0</span>
                <span>+100</span>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={runWhatIfSimulation}
                disabled={whatIfLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                <FlaskConical className="h-4 w-4" />

                {whatIfLoading
                  ? "Simulating..."
                  : "Run simulation"}
              </button>
            </div>
          </div>

          {whatIf && (
            <div className="mt-6 border-t border-purple-100 pt-6">
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <InfoCard
                  label="Simulated demand change"
                  value={`${whatIfChange > 0 ? "+" : ""}${whatIfChange}%`}
                />

                <InfoCard
                  label="Products needing restock"
                  value={String(
                    simulatedRestockCount,
                  )}
                />

                <InfoCard
                  label="Simulated restock units"
                  value={String(
                    simulatedTotalRestock,
                  )}
                />
              </div>

              {simulatedProducts.length > 0 ? (
                <div className="space-y-3">
                  {simulatedProducts.map(
                    (product) => (
                      <WhatIfCard
                        key={product.productId}
                        product={product}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-5 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No simulation products returned.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            SEASONAL DEMAND
        ====================================================== */}

        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-600">
                SEASONAL DEMAND
              </p>

              <h2 className="text-xl font-bold text-gray-900">
                Environmentally relevant products
              </h2>
            </div>
          </div>

          {data.seasonalDemandProducts.length ===
          0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-gray-700">
                No seasonal demand products detected.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.seasonalDemandProducts.map(
                (product) => (
                  <div
                    key={product.productId}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {product.productName}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {product.category}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {product.demandSignal}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SmallMetric
                        label="Daily demand"
                        value={`${product.predictedDailyDemand.toFixed(
                          2,
                        )}`}
                      />

                      <SmallMetric
                        label="Forecast"
                        value={`${product.predictedDemand.toFixed(
                          1,
                        )}`}
                      />
                    </div>

                    <p className="mt-4 text-xs leading-5 text-gray-600">
                      {product.reason}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            AI INSIGHTS
        ====================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-600">
                AI INSIGHTS
              </p>

              <h2 className="text-xl font-bold text-gray-900">
                Intelligence summary
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {data.insights.map(
              (insight, index) => (
                <div
                  key={`${insight}-${index}`}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {index + 1}
                  </div>

                  <p className="text-sm leading-6 text-gray-700">
                    {insight}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* =====================================================
            AI PIPELINE
        ====================================================== */}

        <section className="overflow-hidden rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Pharmix AI decision pipeline
            </h2>

            <p className="mx-auto mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Pharmix transforms environmental and historical
              pharmacy data into forecasts, risk signals,
              operational decisions, recommendations and
              alerts.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl gap-3 md:grid-cols-2 xl:grid-cols-6">
            <PipelineCard
              step="01"
              title="Environment"
              description="Weather & seasonal signals"
            />

            <PipelineCard
              step="02"
              title="Demand"
              description="Historical sales & ML forecast"
            />

            <PipelineCard
              step="03"
              title="Risk"
              description="Stock, coverage & demand risk"
            />

            <PipelineCard
              step="04"
              title="Decision"
              description="Operational action"
            />

            <PipelineCard
              step="05"
              title="Recommendation"
              description="Restock quantity & urgency"
            />

            <PipelineCard
              step="06"
              title="Alert"
              description="Prioritized attention"
            />
          </div>
        </section>

        {/* =====================================================
            FOOTER STATUS
        ====================================================== */}

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-xs text-gray-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span>
              Pharmix AI intelligence layer active
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            <span>
              Forecast: {data.forecast.days} days
            </span>

            <span>
              Products: {summary.totalProducts}
            </span>

            <span>
              Alerts: {alerts.length}
            </span>

            <span>
              Recommendations:{" "}
              {recommendedUnits} units
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   DECISION CARD
============================================================ */

function DecisionCard({
  decision,
}: {
  decision: InventoryDecision;
}) {
  const styles = {
    RESTOCK_NOW: {
      wrapper: "border-red-100 bg-red-50/50",
      icon: "bg-red-100 text-red-600",
      badge: "bg-red-100 text-red-700",
      label: "RESTOCK NOW",
      iconComponent: (
        <XCircle className="h-5 w-5" />
      ),
    },

    RESTOCK_SOON: {
      wrapper: "border-orange-100 bg-orange-50/50",
      icon: "bg-orange-100 text-orange-600",
      badge: "bg-orange-100 text-orange-700",
      label: "RESTOCK SOON",
      iconComponent: (
        <AlertTriangle className="h-5 w-5" />
      ),
    },

    MONITOR: {
      wrapper: "border-blue-100 bg-blue-50/40",
      icon: "bg-blue-100 text-blue-600",
      badge: "bg-blue-100 text-blue-700",
      label: "MONITOR",
      iconComponent: (
        <TrendingUp className="h-5 w-5" />
      ),
    },

    NO_ACTION: {
      wrapper: "border-emerald-100 bg-emerald-50/40",
      icon: "bg-emerald-100 text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      label: "NO ACTION",
      iconComponent: (
        <CheckCircle2 className="h-5 w-5" />
      ),
    },
  }[decision.decision];

  return (
    <div
      className={`rounded-2xl border p-4 transition hover:shadow-sm ${styles.wrapper}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {styles.iconComponent}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {decision.productName}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles.badge}`}
            >
              {styles.label}
            </span>

            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
              Risk {decision.risk.score}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            {decision.reason}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[430px]">
          <SmallMetric
            label="Stock"
            value={decision.inventory.currentStock}
          />

          <SmallMetric
            label="Reorder"
            value={decision.inventory.reorderPoint}
          />

          <SmallMetric
            label="Demand"
            value={decision.forecast.predictedDemand.toFixed(
              1,
            )}
          />

          <SmallMetric
            label="Risk"
            value={decision.risk.level}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RECOMMENDATION CARD
============================================================ */

function RecommendationCard({
  item,
}: {
  item: InventoryRecommendation;
}) {
  const needsRestock =
    item.recommendation.recommendedRestockQuantity >
    0;

  const urgencyClass =
    item.recommendation.urgency === "HIGH"
      ? "bg-red-100 text-red-700"
      : item.recommendation.urgency ===
          "MEDIUM"
        ? "bg-orange-100 text-orange-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <div className="rounded-2xl border border-gray-100 bg-slate-50/50 p-5 transition hover:border-cyan-200 hover:bg-white hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            {item.productName}
          </h3>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            {item.reason}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
            needsRestock
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {needsRestock
            ? `RESTOCK ${item.recommendation.recommendedRestockQuantity}`
            : "NO RESTOCK"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SmallMetric
          label="Current stock"
          value={item.inventory.currentStock}
        />

        <SmallMetric
          label="Target stock"
          value={
            item.recommendation.targetStock
          }
        />

        <SmallMetric
          label="Reorder point"
          value={item.inventory.reorderPoint}
        />

        <SmallMetric
          label="Forecast"
          value={item.forecast.predictedDemand.toFixed(
            2,
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span
          className={`rounded-full px-3 py-1.5 font-semibold ${urgencyClass}`}
        >
          Urgency:{" "}
          {item.recommendation.urgency}
        </span>

        <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-gray-600">
          Basis: {item.recommendation.basis}
        </span>

        <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-gray-600">
          Risk: {item.risk.level}
        </span>

        {item.demand.trend && (
          <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-gray-600">
            Trend: {item.demand.trend}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ALERT CARD
============================================================ */

function AlertCard({
  alert,
}: {
  alert: AIAlert;
}) {
  const styles = {
    CRITICAL: {
      wrapper:
        "border-red-200 bg-red-50/60",
      icon: "bg-red-100 text-red-600",
      badge: "bg-red-100 text-red-700",
    },

    HIGH: {
      wrapper:
        "border-orange-200 bg-orange-50/60",
      icon: "bg-orange-100 text-orange-600",
      badge: "bg-orange-100 text-orange-700",
    },

    MEDIUM: {
      wrapper:
        "border-yellow-200 bg-yellow-50/60",
      icon: "bg-yellow-100 text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700",
    },

    LOW: {
      wrapper:
        "border-blue-200 bg-blue-50/50",
      icon: "bg-blue-100 text-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
  }[alert.severity];

  return (
    <div
      className={`rounded-2xl border p-4 ${styles.wrapper}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Bell className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {alert.title ??
                formatAlertType(alert.type)}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles.badge}`}
            >
              {alert.severity}
            </span>

            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
              {formatAlertType(alert.type)}
            </span>
          </div>

          {alert.productName && (
            <p className="mt-1 text-sm font-medium text-gray-700">
              {alert.productName}
            </p>
          )}

          <p className="mt-1 text-sm leading-6 text-gray-600">
            {alert.message ??
              alert.reason ??
              "AI inventory attention required."}
          </p>

          {alert.riskScore !== undefined && (
            <p className="mt-2 text-xs text-gray-500">
              Risk score: {alert.riskScore}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WHAT-IF CARD
============================================================ */

function WhatIfCard({
  product,
}: {
  product: WhatIfProduct;
}) {
  const decision =
    product.decision ?? "NO_ACTION";

  const decisionStyles = {
    RESTOCK_NOW:
      "bg-red-100 text-red-700",
    RESTOCK_SOON:
      "bg-orange-100 text-orange-700",
    MONITOR:
      "bg-blue-100 text-blue-700",
    NO_ACTION:
      "bg-emerald-100 text-emerald-700",
  } as Record<string, string>;

  const simulatedDemand =
    product.simulatedDemand ??
    product.predictedDemand ??
    0;

  const simulatedDailyDemand =
    product.simulatedDailyDemand ??
    product.predictedDailyDemand ??
    0;

  const simulatedStock =
    product.simulatedStock ??
    product.currentStock ??
    0;

  const coverage =
    product.simulatedStockCoverageDays ??
    product.stockCoverageDays ??
    null;

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {product.productName}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                decisionStyles[decision] ??
                "bg-slate-100 text-slate-700"
              }`}
            >
              {decision.replaceAll(
                "_",
                " ",
              )}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Simulated scenario result
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <SmallMetric
            label="Simulated stock"
            value={simulatedStock}
          />

          <SmallMetric
            label="Daily demand"
            value={simulatedDailyDemand.toFixed(
              2,
            )}
          />

          <SmallMetric
            label="Forecast demand"
            value={simulatedDemand.toFixed(
              2,
            )}
          />

          <SmallMetric
            label="Coverage"
            value={
              coverage === null
                ? "—"
                : `${Number(coverage).toFixed(
                    1,
                  )}d`
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PIPELINE CARD
============================================================ */

function PipelineCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
          {step}
        </span>

        <div>
          <p className="font-semibold text-gray-900">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon,
  label,
  value,
  description,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        danger
          ? "border-red-100"
          : "border-gray-100"
      }`}
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
          danger
            ? "bg-red-50 text-red-600"
            : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   INFO CARD
============================================================ */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 transition hover:bg-slate-100">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   SMALL METRIC
============================================================ */

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="text-[11px] text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-700">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-gray-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function severityWeight(
  severity: AIAlert["severity"],
) {
  return {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  }[severity];
}

function formatAlertType(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}