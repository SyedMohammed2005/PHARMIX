"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Prediction = {
  productId: string;
  productName: string;

  features: {
    salesLast7Days: number;
    salesLast30Days: number;
    averageDailyDemand7: number;
    averageDailyDemand30: number;
    demandTrend: number;
    currentStock: number;
    minimumStock: number;
    maximumStock: number;
    reorderPoint: number;
  };

  prediction: {
    forecastDays: number;
    predictedDailyDemand: number;
    predictedDemand: number;
    predicted7DayDemand: number;
    currentStock: number;
    stockCoverageDays: number | null;
    recommendation: string;
    recommendedRestockQuantity: number;
    explanation: string;

    model: {
      name: string;
      version: string;
    };
  };
};

type PredictionResponse = {
  success: boolean;
  count: number;

  prediction: {
    days: number;
    products: Prediction[];
  };
};

type DemandTrendProduct = {
  productId: string;
  productName: string;

  weeklyDemand: {
    weekNumber: number;
    startDate: string;
    endDate: string;
    unitsSold: number;
  }[];
};

type DemandTrendResponse = {
  success: boolean;
  count: number;

  data: {
    period: {
      weeks: number;
    };
    products: DemandTrendProduct[];
  };
};

type ChartPoint = {
  label: string;
  actualDemand?: number;
  predictedDemand?: number;
};

export function PredictionDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [days, setDays] = useState(7);

  const [demandTrends, setDemandTrends] = useState<
    DemandTrendProduct[]
  >([]);

  const [productSearch, setProductSearch] = useState("");
  const [recommendationFilter, setRecommendationFilter] =
    useState("ALL");

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartError, setChartError] = useState("");

  /*
   * Fetch AI predictions
   */
  useEffect(() => {
    async function fetchPredictions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/predictions?days=${days}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch predictions");
        }

        const data: PredictionResponse =
          await response.json();

        if (!data.success) {
          throw new Error("Prediction request failed");
        }

        setPredictions(data.prediction.products);
      } catch (error) {
        console.error(
          "Prediction dashboard error:",
          error
        );

        setError(
          "Unable to load demand predictions."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
  }, [days]);

  /*
   * Fetch historical demand trends
   *
   * We keep this separate from the prediction API because
   * historical demand and future AI predictions are different
   * datasets.
   */
  useEffect(() => {
    async function fetchDemandTrends() {
      try {
        setChartLoading(true);
        setChartError("");

        const response = await fetch(
          "/api/analytics/demand-trends?weeks=12",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch demand trends"
          );
        }

        const data: DemandTrendResponse =
          await response.json();

        if (!data.success) {
          throw new Error(
            "Demand trend request failed"
          );
        }

        setDemandTrends(data.data.products);
      } catch (error) {
        console.error(
          "Demand trend chart error:",
          error
        );

        setChartError(
          "Unable to load historical demand data."
        );
      } finally {
        setChartLoading(false);
      }
    }

    fetchDemandTrends();
  }, []);

  /*
   * Select the first available prediction product
   * when prediction data loads.
   */
  useEffect(() => {
    if (
      predictions.length > 0 &&
      !predictions.some(
        (item) => item.productId === selectedProductId
      )
    ) {
      setSelectedProductId(
        predictions[0].productId
      );
    }
  }, [predictions, selectedProductId]);

  /*
   * Prediction overview calculations
   */
  const overview = useMemo(() => {
    if (predictions.length === 0) {
      return {
        totalPredictedDemand: 0,
        averageDailyDemand: 0,
        productCount: 0,
        highestDemandProduct: null as Prediction | null,
      };
    }

    const totalPredictedDemand = predictions.reduce(
      (total, item) =>
        total + item.prediction.predictedDemand,
      0
    );

    const averageDailyDemand =
      totalPredictedDemand / days;

    const highestDemandProduct =
      predictions.reduce((highest, current) => {
        if (!highest) {
          return current;
        }

        return current.prediction.predictedDemand >
          highest.prediction.predictedDemand
          ? current
          : highest;
      }, null as Prediction | null);

    return {
      totalPredictedDemand,
      averageDailyDemand,
      productCount: predictions.length,
      highestDemandProduct,
    };
  }, [predictions, days]);

  /*
   * Product selected for the demand chart.
   */
  const selectedPrediction = useMemo(() => {
    return predictions.find(
      (item) => item.productId === selectedProductId
    );
  }, [predictions, selectedProductId]);

  const selectedTrend = useMemo(() => {
    return demandTrends.find(
      (item) => item.productId === selectedProductId
    );
  }, [demandTrends, selectedProductId]);

  const filteredPredictions = useMemo(() => {
    const search = productSearch
      .trim()
      .toLowerCase();

    return predictions.filter((item) => {
      const matchesSearch =
        search === "" ||
        item.productName.toLowerCase().includes(search);

      const matchesRecommendation =
        recommendationFilter === "ALL" ||
        item.prediction.recommendation ===
        recommendationFilter;

      return matchesSearch && matchesRecommendation;
    });
  }, [
    predictions,
    productSearch,
    recommendationFilter,
  ]);

  /*
   * Build chart data.
   *
   * Historical:
   * 12 real weekly demand values.
   *
   * Forecast:
   * Convert predicted daily demand into weekly-equivalent
   * demand so it can be visually compared with weekly sales.
   *
   * For a partial final week, only the requested number
   * of remaining days is represented.
   */
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!selectedTrend || !selectedPrediction) {
      return [];
    }

    const historicalPoints: ChartPoint[] =
      selectedTrend.weeklyDemand.map((week) => ({
        label: `W${week.weekNumber}`,
        actualDemand: week.unitsSold,
      }));

    const predictedDailyDemand =
      selectedPrediction.prediction.predictedDailyDemand;

    const forecastWeeks = Math.ceil(days / 7);

    const forecastPoints: ChartPoint[] = Array.from(
      { length: forecastWeeks },
      (_, index) => {
        const remainingDays =
          days - index * 7;

        const daysInThisForecastWeek =
          Math.min(7, remainingDays);

        return {
          label: `F${index + 1}`,
          predictedDemand:
            predictedDailyDemand *
            daysInThisForecastWeek,
        };
      }
    );

    return [
      ...historicalPoints,
      ...forecastPoints,
    ];
  }, [
    selectedTrend,
    selectedPrediction,
    days,
  ]);

  return (
    <section className="space-y-5 text-gray-900">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            AI Demand Predictions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            XGBoost-powered inventory demand forecasting
          </p>
        </div>

        {/* Prediction Period */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium text-gray-600 sm:block">
            Forecast
          </span>

          <select
            value={days}
            onChange={(event) =>
              setDays(Number(event.target.value))
            }
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm outline-none transition hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option
              value={7}
              className="bg-white text-gray-900"
            >
              Next 7 days
            </option>

            <option
              value={14}
              className="bg-white text-gray-900"
            >
              Next 14 days
            </option>

            <option
              value={30}
              className="bg-white text-gray-900"
            >
              Next 30 days
            </option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Generating AI demand predictions...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        predictions.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            No prediction data is available yet.
          </div>
        )}

      {/* Prediction Content */}
      {!loading &&
        !error &&
        predictions.length > 0 && (
          <>
            {/* Overview */}
            <div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Forecast Overview
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Summary of the AI forecast for the next{" "}
                  {days} days.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <OverviewMetric
                  label={`Total ${days}-day demand`}
                  value={`${overview.totalPredictedDemand.toFixed(
                    2
                  )} units`}
                  description="Expected demand across all analyzed products"
                />

                <OverviewMetric
                  label="Average daily demand"
                  value={`${overview.averageDailyDemand.toFixed(
                    2
                  )} units`}
                  description="Average forecasted demand per day"
                />

                <OverviewMetric
                  label="Products analyzed"
                  value={`${overview.productCount}`}
                  description="Products included in this forecast"
                />

                <OverviewMetric
                  label="Highest demand"
                  value={
                    overview.highestDemandProduct
                      ? overview.highestDemandProduct.productName
                      : "N/A"
                  }
                  description={
                    overview.highestDemandProduct
                      ? `${overview.highestDemandProduct.prediction.predictedDemand.toFixed(
                        2
                      )} units expected`
                      : "No demand data available"
                  }
                />
              </div>
            </div>

            {/* Demand Visualization */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Historical Demand vs AI Forecast
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Compare real weekly sales with the selected
                    AI forecast.
                  </p>
                </div>

                {/* Product Selector */}
                <div className="w-full sm:w-64">
                  <label
                    htmlFor="prediction-product"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    Product
                  </label>

                  <select
                    id="prediction-product"
                    value={selectedProductId}
                    onChange={(event) =>
                      setSelectedProductId(
                        event.target.value
                      )
                    }
                    className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  >
                    {predictions.map((item) => (
                      <option
                        key={item.productId}
                        value={item.productId}
                      >
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chart Loading */}
              {chartLoading && (
                <div className="mt-5 flex h-72 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
                  Loading historical demand...
                </div>
              )}

              {/* Chart Error */}
              {!chartLoading && chartError && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {chartError}
                </div>
              )}

              {/* Chart Empty */}
              {!chartLoading &&
                !chartError &&
                chartData.length === 0 && (
                  <div className="mt-5 flex h-72 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
                    No historical demand data is available for
                    this product.
                  </div>
                )}

              {/* Chart */}
              {!chartLoading &&
                !chartError &&
                chartData.length > 0 && (
                  <>
                    <div className="mt-6 h-72 w-full">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <LineChart
                          data={chartData}
                          margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 5,
                          }}
                        >
                          <XAxis
                            dataKey="label"
                            tick={{
                              fontSize: 11,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />

                          <YAxis
                            allowDecimals={false}
                            tick={{
                              fontSize: 11,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />

                          <Tooltip
                            formatter={(value, name) => [
                              `${Number(value).toFixed(2)} units`,
                              name === "actualDemand"
                                ? "Historical demand"
                                : "AI forecast",
                            ]}
                          />

                          <Line
                            type="monotone"
                            dataKey="actualDemand"
                            name="Historical demand"
                            strokeWidth={2}
                            dot={{
                              r: 3,
                            }}
                            activeDot={{
                              r: 5,
                            }}
                            connectNulls={false}
                          />

                          <Line
                            type="monotone"
                            dataKey="predictedDemand"
                            name="AI forecast"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={{
                              r: 3,
                            }}
                            activeDot={{
                              r: 5,
                            }}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Legend */}
                    <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-gray-100 pt-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-6 rounded-full bg-gray-900" />
                        <span>
                          Historical weekly demand
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-0.5 w-6 border-t-2 border-dashed border-gray-500" />
                        <span>
                          AI forecast
                        </span>
                      </div>
                    </div>

                    {/* Chart Explanation */}
                    {selectedPrediction && (
                      <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Forecast insight
                        </p>

                        <p className="mt-1 text-sm leading-5 text-indigo-950">
                          {selectedPrediction.productName} is
                          forecast to sell approximately{" "}
                          <strong>
                            {selectedPrediction.prediction.predictedDailyDemand.toFixed(
                              2
                            )} units per day
                          </strong>{" "}
                          over the next {days} days.
                        </p>
                      </div>
                    )}
                  </>
                )}
            </div>

            {/* Predictions */}
            <div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Product Predictions
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  AI-generated demand and inventory insights
                  for each product.
                </p>
              </div>

              {/* Prediction Filters */}
              <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">

                  {/* Product Search */}
                  <div>
                    <label
                      htmlFor="prediction-search"
                      className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Search product
                    </label>

                    <input
                      id="prediction-search"
                      type="text"
                      value={productSearch}
                      onChange={(event) =>
                        setProductSearch(event.target.value)
                      }
                      placeholder="Search by product name..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>

                  {/* Recommendation Filter */}
                  <div>
                    <label
                      htmlFor="recommendation-filter"
                      className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Recommendation
                    </label>

                    <select
                      id="recommendation-filter"
                      value={recommendationFilter}
                      onChange={(event) =>
                        setRecommendationFilter(
                          event.target.value
                        )
                      }
                      className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="ALL">
                        All Recommendations
                      </option>

                      <option value="RESTOCK_REQUIRED">
                        Restock Required
                      </option>

                      <option value="LOW_STOCK_RISK">
                        Low Stock Risk
                      </option>

                      <option value="SUFFICIENT_STOCK">
                        Sufficient Stock
                      </option>
                    </select>
                  </div>
                </div>

                {/* Filter Result Count */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    <strong className="font-semibold text-gray-700">
                      {filteredPredictions.length}
                    </strong>{" "}
                    of{" "}
                    <strong className="font-semibold text-gray-700">
                      {predictions.length}
                    </strong>{" "}
                    products
                  </p>

                  {(productSearch ||
                    recommendationFilter !== "ALL") && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearch("");
                          setRecommendationFilter("ALL");
                        }}
                        className="text-xs font-semibold text-gray-700 underline underline-offset-2 transition hover:text-gray-900"
                      >
                        Clear filters
                      </button>
                    )}
                </div>
              </div>

              {/* Filtered Product Cards */}
              {filteredPredictions.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm font-medium text-gray-700">
                    No products match your filters.
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try a different product name or recommendation.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPredictions.map((item) => {
                    const prediction = item.prediction;

                    const isRestockRequired =
                      prediction.recommendation ===
                      "RESTOCK_REQUIRED";

                    const isLowStockRisk =
                      prediction.recommendation ===
                      "LOW_STOCK_RISK";

                    return (
                      <div
                        key={item.productId}
                        className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {/* Product Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-gray-900">
                              {item.productName}
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                              {prediction.model.name}{" "}
                              <span className="text-gray-400">
                                v{prediction.model.version}
                              </span>
                            </p>
                          </div>

                          {/* Recommendation Badge */}
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isRestockRequired
                                ? "bg-red-100 text-red-700"
                                : isLowStockRisk
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                          >
                            {prediction.recommendation.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </div>

                        {/* Metrics */}
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <Metric
                            label="Current stock"
                            value={`${prediction.currentStock}`}
                          />

                          <Metric
                            label="Daily demand"
                            value={`${prediction.predictedDailyDemand}`}
                          />

                          <Metric
                            label={`${prediction.forecastDays}-day demand`}
                            value={`${prediction.predictedDemand}`}
                          />

                          <Metric
                            label="Coverage"
                            value={
                              prediction.stockCoverageDays !==
                                null
                                ? `${prediction.stockCoverageDays} days`
                                : "N/A"
                            }
                          />
                        </div>

                        {/* Restock Recommendation */}
                        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Restock recommendation
                          </p>

                          <p className="mt-1 text-sm font-medium text-blue-950">
                            {prediction.recommendedRestockQuantity >
                              0
                              ? `Restock ${prediction.recommendedRestockQuantity} units.`
                              : "No immediate restocking required."}
                          </p>
                        </div>

                        {/* AI Explanation */}
                        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                            AI explanation
                          </p>

                          <p className="mt-1 text-sm leading-5 text-indigo-950">
                            {prediction.explanation}
                          </p>
                        </div>

                        {/* Sales History */}
                        <div className="mt-4 flex justify-between border-t border-gray-200 pt-3 text-xs text-gray-500">
                          <span>
                            Last 7 days:{" "}
                            <strong className="font-semibold text-gray-700">
                              {item.features.salesLast7Days}
                            </strong>
                          </span>

                          <span>
                            Last 30 days:{" "}
                            <strong className="font-semibold text-gray-700">
                              {item.features.salesLast30Days}
                            </strong>
                          </span>
                        </div>
                </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
    </section>
  );
}

/*
 * Overview metric card
 */
function OverviewMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 truncate text-xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs leading-4 text-gray-500">
        {description}
      </p>
    </div>
  );
}

/*
 * Product metric card
 */
function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}