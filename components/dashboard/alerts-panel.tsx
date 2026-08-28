import {
  AlertTriangle,
  PackageX,
  Clock3,
  CircleAlert,
} from "lucide-react";

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

type AlertsPanelProps = {
  data: {
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
};

export function AlertsPanel({
  data,
}: AlertsPanelProps) {
  const { summary, alerts } = data;

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
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
              {alerts.lowStock.slice(0, 5).map((item) => (
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
                      Reorder at {item.reorderPoint}
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