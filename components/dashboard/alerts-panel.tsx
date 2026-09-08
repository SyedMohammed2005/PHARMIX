"use client";

import {
  AlertTriangle,
  PackageX,
  Clock3,
  CircleAlert,
  Brain,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

type ProductAlert = {
  id: string;
  quantity: number;
  reorderPoint: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
};

type BatchAlert = {
  id: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
};

type PharmacyAlertsData = {
  summary: {
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
    expiredCount: number;
    totalAlerts: number;
  };

  alerts: {
    lowStock: ProductAlert[];
    outOfStock: ProductAlert[];
    expiringBatches: BatchAlert[];
    expiredBatches: BatchAlert[];
  };
};

type AIAlert = {
  alertId: string;
  productId: string;
  productName: string;
  type:
    | "STOCKOUT"
    | "RESTOCK_REQUIRED"
    | "LOW_STOCK"
    | "DEMAND_INCREASE"
    | "EXPIRY_RISK";
  severity:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM"
    | "LOW";
  message: string;
  recommendedAction: string;
};

type AIAlertsResponse = {
  success: boolean;
  data: {
    forecast: {
      days: number;
    };
    summary: {
      totalAlerts: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    alerts: AIAlert[];
  };
};

type AlertsPanelProps = {
  data: PharmacyAlertsData;
};

export function AlertsPanel({
  data,
}: AlertsPanelProps) {
  const { summary, alerts } = data;

  const [aiAlerts, setAIAlerts] = useState<AIAlert[]>(
    []
  );

  const [aiSummary, setAISummary] = useState<
    AIAlertsResponse["data"]["summary"] | null
  >(null);

  const [aiLoading, setAILoading] = useState(true);

  const [aiError, setAIError] = useState("");

  const [severityFilter, setSeverityFilter] = useState<
    "ALL" | AIAlert["severity"]
  >("ALL");

  const [typeFilter, setTypeFilter] = useState<
    "ALL" | AIAlert["type"]
  >("ALL");

  const filteredAIAlerts = aiAlerts
    .filter((alert) => {
      if (severityFilter === "ALL") {
        return true;
      }

      return alert.severity === severityFilter;
    })
    .filter((alert) => {
      if (typeFilter === "ALL") {
        return true;
      }

      return alert.type === typeFilter;
    })
    .sort((a, b) => {
      const severityOrder: Record<
        AIAlert["severity"],
        number
      > = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      return (
        severityOrder[b.severity] -
        severityOrder[a.severity]
      );
    });

  async function fetchAIAlerts(
    latitude: number,
    longitude: number
  ) {
    try {
      setAILoading(true);
      setAIError("");

      const response = await fetch(
        `/api/ai/inventory-alerts?latitude=${latitude}&longitude=${longitude}&days=7`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch AI inventory alerts"
        );
      }

      const result: AIAlertsResponse =
        await response.json();

      if (!result.success) {
        throw new Error(
          "AI inventory alert request failed"
        );
      }

      setAIAlerts(result.data.alerts);
      setAISummary(result.data.summary);
    } catch (error) {
      console.error(
        "AI inventory alerts error:",
        error
      );

      setAIError(
        "Unable to load AI inventory alerts."
      );
    } finally {
      setAILoading(false);
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setAIError(
        "Location access is not supported by this browser."
      );
      setAILoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAIAlerts(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => {
        setAIError(
          "Location permission is required for AI inventory intelligence."
        );
        setAILoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  return (
    <section className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pharmacy Alerts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Important inventory and medicine alerts.
          </p>
        </div>

        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          {summary.totalAlerts} Alerts
        </div>
      </div>

      {/* Existing Pharmacy Alerts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Inventory Alerts
          </h3>

          <span className="text-xs font-medium text-gray-400">
            Standard monitoring
          </span>
        </div>

        {/* Alert summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AlertSummary
            title="Low Stock"
            count={summary.lowStockCount}
            icon={AlertTriangle}
          />

          <AlertSummary
            title="Out of Stock"
            count={summary.outOfStockCount}
            icon={PackageX}
          />

          <AlertSummary
            title="Expiring Soon"
            count={summary.expiringCount}
            icon={Clock3}
          />

          <AlertSummary
            title="Expired"
            count={summary.expiredCount}
            icon={CircleAlert}
          />
        </div>

        {/* Detailed alerts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Low stock */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">
              Low Stock Products
            </h3>

            {alerts.lowStock.length === 0 ? (
              <EmptyMessage message="No low stock products." />
            ) : (
              <div className="space-y-3">
                {alerts.lowStock
                  .slice(0, 5)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          SKU: {item.product.sku}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          {item.quantity} units
                        </p>

                        <p className="text-xs text-gray-500">
                          Reorder at{" "}
                          {item.reorderPoint}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Expiring batches */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">
              Expiring Soon
            </h3>

            {alerts.expiringBatches.length === 0 ? (
              <EmptyMessage message="No batches expiring soon." />
            ) : (
              <div className="space-y-3">
                {alerts.expiringBatches
                  .slice(0, 5)
                  .map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {batch.product.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          Batch: {batch.batchNumber}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium text-orange-600">
                          {batch.quantity} units
                        </p>

                        <p className="text-xs text-gray-500">
                          Expires{" "}
                          {new Date(
                            batch.expiryDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Inventory Intelligence */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-50 p-2">
              <Brain
                size={20}
                className="text-indigo-600"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                AI Inventory Intelligence
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                AI-generated alerts from demand,
                inventory, expiry, and seasonal signals.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {aiSummary && (
              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                {aiSummary.totalAlerts} AI Alerts
              </div>
            )}

            {!aiLoading && !aiError && (
              <>
                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(
                      event.target.value as
                        | "ALL"
                        | AIAlert["severity"]
                    )
                  }
                  className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">
                    All Severities
                  </option>
                  <option value="CRITICAL">
                    Critical
                  </option>
                  <option value="HIGH">
                    High
                  </option>
                  <option value="MEDIUM">
                    Medium
                  </option>
                  <option value="LOW">
                    Low
                  </option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as
                        | "ALL"
                        | AIAlert["type"]
                    )
                  }
                  className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">
                    All Types
                  </option>
                  <option value="STOCKOUT">
                    Stockout
                  </option>
                  <option value="RESTOCK_REQUIRED">
                    Restock Required
                  </option>
                  <option value="LOW_STOCK">
                    Low Stock
                  </option>
                  <option value="DEMAND_INCREASE">
                    Demand Increase
                  </option>
                  <option value="EXPIRY_RISK">
                    Expiry Risk
                  </option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* AI Loading */}
        {aiLoading && (
          <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-700">
            <RefreshCw
              size={18}
              className="animate-spin"
            />

            <span>
              Generating AI inventory alerts...
            </span>
          </div>
        )}

        {/* AI Error */}
        {!aiLoading && aiError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-800">
              {aiError}
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Standard pharmacy alerts are still
              available above.
            </p>
          </div>
        )}

        {/* AI Summary */}
        {!aiLoading &&
          !aiError &&
          aiSummary && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AIAlertSummary
                label="Critical"
                count={aiSummary.critical}
                className="border-red-200 bg-red-50 text-red-700"
              />

              <AIAlertSummary
                label="High"
                count={aiSummary.high}
                className="border-orange-200 bg-orange-50 text-orange-700"
              />

              <AIAlertSummary
                label="Medium"
                count={aiSummary.medium}
                className="border-amber-200 bg-amber-50 text-amber-700"
              />

              <AIAlertSummary
                label="Low"
                count={aiSummary.low}
                className="border-gray-200 bg-gray-50 text-gray-700"
              />
            </div>
          )}

        {/* Filter result count */}
        {!aiLoading &&
          !aiError &&
          aiAlerts.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredAIAlerts.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {aiAlerts.length}
                </span>{" "}
                AI alerts
              </p>

              {(severityFilter !== "ALL" ||
                typeFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSeverityFilter("ALL");
                    setTypeFilter("ALL");
                  }}
                  className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

        {/* AI Alert List */}
        {!aiLoading &&
          !aiError &&
          aiAlerts.length > 0 && (
            <div className="mt-3">
              {filteredAIAlerts.length === 0 ? (
                <EmptyMessage message="No AI alerts match the selected filters." />
              ) : (
                <div className="space-y-3">
                  {filteredAIAlerts.map((alert) => (
                    <AIAlertCard
                      key={alert.alertId}
                      alert={alert}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        {/* AI Empty */}
        {!aiLoading &&
          !aiError &&
          aiAlerts.length === 0 && (
            <EmptyMessage message="No AI inventory alerts detected." />
          )}
      </div>
    </section>
  );
}

function AlertSummary({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <Icon
          size={20}
          className="text-gray-500"
        />
      </div>

      <p className="mt-3 text-2xl font-bold text-gray-900">
        {count}
      </p>
    </div>
  );
}

function AIAlertSummary({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {count}
      </p>
    </div>
  );
}

function AIAlertCard({
  alert,
}: {
  alert: AIAlert;
}) {
  const severityStyles = {
    CRITICAL: "border-red-200 bg-red-50",
    HIGH: "border-orange-200 bg-orange-50",
    MEDIUM: "border-amber-200 bg-amber-50",
    LOW: "border-gray-200 bg-gray-50",
  };

  const severityText = {
    CRITICAL: "text-red-700",
    HIGH: "text-orange-700",
    MEDIUM: "text-amber-700",
    LOW: "text-gray-700",
  };

  return (
    <div
      className={`rounded-lg border p-4 ${severityStyles[alert.severity]}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-gray-900">
              {alert.productName}
            </h4>

            <span
              className={`rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold ${severityText[alert.severity]}`}
            >
              {alert.severity}
            </span>

            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-600">
              {alert.type.replaceAll("_", " ")}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-700">
            {alert.message}
          </p>
        </div>

        <div className="shrink-0 rounded-lg bg-white/70 p-3 sm:max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Recommended action
          </p>

          <p className="mt-1 text-sm font-medium text-gray-900">
            {alert.recommendedAction}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
