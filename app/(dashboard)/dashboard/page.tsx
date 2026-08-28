import { getCurrentUser } from "@/lib/authorization";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { StockMovement } from "@/components/dashboard/stock-movement";
import { PaymentAnalytics } from "@/components/dashboard/payment-analytics";
import { redirect } from "next/navigation";

import {
  getDashboardSummary,
  getDashboardAlerts,
  getSalesAnalytics,
  getTopProducts,
  getStockMovementAnalytics,
  getPaymentAnalytics,
} from "@/services/analytics.service";

export default async function DashboardPage() {
  // Get the currently logged-in user
  const currentUser = await getCurrentUser();

  // User is not authenticated
  if (!currentUser) {
    redirect("/login");
  }

  // Pharmacist should use the POS system
  if (currentUser.role === "PHARMACIST") {
    redirect("/pos");
  }

  // Role checks
  const isAdmin = currentUser.role === "ADMIN";

  const isInventoryManager =
    currentUser.role === "INVENTORY_MANAGER";

  const isBusinessAnalyst =
    currentUser.role === "BUSINESS_ANALYST";

  // Fetch dashboard data
  const [
    dashboardData,
    alertsData,
    salesAnalytics,
    topProductsData,
    stockMovementData,
    paymentAnalyticsData,
  ] = await Promise.all([
    getDashboardSummary(),
    getDashboardAlerts(),
    getSalesAnalytics(7),
    getTopProducts(5),
    getStockMovementAnalytics(30),
    getPaymentAnalytics(),
  ]);

  return (
    <div className="space-y-6">
      {/* ADMIN */}
      {isAdmin && (
        <>
          <DashboardOverview data={dashboardData} />

          <SalesChart
            data={salesAnalytics.salesByDate}
          />

          <TopProducts
            products={topProductsData.products}
          />

          <StockMovement
            data={stockMovementData}
          />

          <PaymentAnalytics
            data={paymentAnalyticsData}
          />

          <AlertsPanel data={alertsData} />
        </>
      )}

      {/* INVENTORY MANAGER */}
      {isInventoryManager && (
        <>
          <DashboardOverview data={dashboardData} />

          <StockMovement
            data={stockMovementData}
          />

          <AlertsPanel data={alertsData} />
        </>
      )}

      {/* BUSINESS ANALYST */}
      {isBusinessAnalyst && (
        <>
          <DashboardOverview data={dashboardData} />

          <SalesChart
            data={salesAnalytics.salesByDate}
          />

          <TopProducts
            products={topProductsData.products}
          />

          <StockMovement
            data={stockMovementData}
          />

          <PaymentAnalytics
            data={paymentAnalyticsData}
          />
        </>
      )}
    </div>
  );
}