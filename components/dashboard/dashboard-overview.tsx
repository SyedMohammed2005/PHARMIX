import {
  IndianRupee,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import { StatsCard } from "./stats-card";

type DashboardOverviewProps = {
  data: {
    products: {
      total: number;
    };

    customers: {
      total: number;
    };

    inventory: {
      lowStockProducts: number;
    };

    sales: {
      totalOrders: number;
      totalRevenue: number;
    };

    today: {
      orders: number;
      revenue: number;
    };
  };
};

export function DashboardOverview({
  data,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Overview
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Monitor your pharmacy operations and performance.
        </p>
      </div>

      {/* Main statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`₹${data.sales.totalRevenue.toLocaleString()}`}
          description={`${data.sales.totalOrders} total orders`}
          icon={IndianRupee}
        />

        <StatsCard
          title="Total Products"
          value={data.products.total}
          description="Products in pharmacy"
          icon={Package}
        />

        <StatsCard
          title="Total Customers"
          value={data.customers.total}
          description="Registered customers"
          icon={Users}
        />

        <StatsCard
          title="Low Stock"
          value={data.inventory.lowStockProducts}
          description="Products need attention"
          icon={AlertTriangle}
        />
      </div>

      {/* Today's statistics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Today's Performance
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard
            title="Today's Revenue"
            value={`₹${data.today.revenue.toLocaleString()}`}
            description="Revenue generated today"
            icon={TrendingUp}
          />

          <StatsCard
            title="Today's Orders"
            value={data.today.orders}
            description="Orders created today"
            icon={ShoppingCart}
          />
        </div>
      </div>
    </div>
  );
}