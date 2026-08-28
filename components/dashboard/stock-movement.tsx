import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
} from "lucide-react";

type StockMovementData = {
  totalTransactions: number;
  stockAdded: number;
  stockRemoved: number;
  netMovement: number;
};

type StockMovementProps = {
  data: {
    summary: StockMovementData;
  };
};

export function StockMovement({
  data,
}: StockMovementProps) {
  const { summary } = data;

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Stock Movement
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Overview of inventory movement during the last 30 days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MovementCard
          title="Stock Added"
          value={summary.stockAdded}
          description="Purchase and returns"
          icon={ArrowUpFromLine}
        />

        <MovementCard
          title="Stock Removed"
          value={summary.stockRemoved}
          description="Sales and damaged stock"
          icon={ArrowDownToLine}
        />

        <MovementCard
          title="Net Movement"
          value={summary.netMovement}
          description="Added minus removed"
          icon={Activity}
        />

        <MovementCard
          title="Transactions"
          value={summary.totalTransactions}
          description="Total stock transactions"
          icon={Activity}
        />
      </div>
    </section>
  );
}

function MovementCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
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
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}