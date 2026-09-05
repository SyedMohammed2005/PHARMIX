"use client";

import { useEffect, useState } from "react";

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
    predictedDailyDemand: number;
    predicted7DayDemand: number;
    currentStock: number;
    stockCoverageDays: number;
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

export function PredictionDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {/* Predictions */}
      {!loading &&
        !error &&
        predictions.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {predictions.map((item) => {
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
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isRestockRequired
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
                      label="7-day demand"
                      value={`${prediction.predicted7DayDemand}`}
                    />

                    <Metric
                      label="Coverage"
                      value={`${prediction.stockCoverageDays} days`}
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
    </section>
  );
}

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

