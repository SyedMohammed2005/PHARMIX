"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
    Legend,
    Pie,
    PieChart,
} from "recharts";

import {
    BarChart3,
    Users,
    Package,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    RefreshCw,
    CreditCard,
    Wallet,
    IndianRupee,
} from "lucide-react";

type SalesReport = {
    success: boolean;

    summary: {
        totalOrders: number;
        totalItemsSold: number;
        totalSubtotal: number;
        totalDiscount: number;
        totalTax: number;
        totalRevenue: number;
        totalRefunded: number;
        netRevenue: number;
    };

    paymentMethods: {
        method: string;
        transactionCount: number;
        amount: number;
        refundedAmount: number;
        netAmount: number;
    }[];

    sales: {
        id: string;
        invoiceNumber: string;
        subtotal: number;
        discount: number;
        tax: number;
        totalAmount: number;
        createdAt: string;
    }[];
};

type InventoryReport = {
    success: boolean;
    summary: {
        totalProducts: number;
        totalStockQuantity: number;
        totalInventoryValue: number;
        totalSellingValue: number;
        potentialProfit: number;
        lowStockCount: number;
        outOfStockCount: number;
        expiringBatchCount: number;
        expiredBatchCount: number;
    };
    lowStockProducts: {
        name: string;
        quantity: number;
        reorderPoint: number;
        category: string;
    }[];
};

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    totalOrders: number;
    totalSpent: number;
};

type CustomerReport = {
    success: boolean;
    summary: {
        totalCustomers: number;
        activeCustomers: number;
        inactiveCustomers: number;
        totalCustomerRevenue: number;
        averageCustomerSpending: number;
    };
    topCustomers: Customer[];
};

export default function AnalyticsPage() {
    const [salesReport, setSalesReport] =
        useState<SalesReport | null>(null);

    const [inventoryReport, setInventoryReport] =
        useState<InventoryReport | null>(null);

    const [customerReport, setCustomerReport] =
        useState<CustomerReport | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    type DateRange = "today" | "7days" | "30days" | "all";

    const [dateRange, setDateRange] =
        useState<DateRange>("all");

    async function fetchReports() {
        try {
            setLoading(true);
            setError("");

            const today = new Date();

            const formatDate = (date: Date) =>
                date.toISOString().split("T")[0];

            let salesUrl = "/api/reports/sales";

            if (dateRange !== "all") {
                const to = formatDate(today);

                const fromDate = new Date(today);

                if (dateRange === "7days") {
                    fromDate.setDate(today.getDate() - 6);
                }

                if (dateRange === "30days") {
                    fromDate.setDate(today.getDate() - 29);
                }

                if (dateRange === "today") {
                    fromDate.setDate(today.getDate());
                }

                const from = formatDate(fromDate);

                salesUrl =
                    `/api/reports/sales?from=${from}&to=${to}`;
            }

            const [
                salesResponse,
                inventoryResponse,
                customersResponse,
            ] = await Promise.all([
                fetch(salesUrl),
                fetch("/api/reports/inventory"),
                fetch("/api/reports/customers"),
            ]);


            const [
                salesData,
                inventoryData,
                customerData,
            ] = await Promise.all([
                salesResponse.json(),
                inventoryResponse.json(),
                customersResponse.json(),
            ]);

            if (
                !salesResponse.ok ||
                !inventoryResponse.ok ||
                !customersResponse.ok
            ) {
                throw new Error(
                    "Failed to load analytics reports"
                );
            }

            setSalesReport(salesData);
            setInventoryReport(inventoryData);
            setCustomerReport(customerData);
        } catch (error) {
            console.error("Analytics error:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load analytics"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
                    <p className="mt-4 text-gray-500">
                        Loading analytics...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !salesReport || !inventoryReport || !customerReport) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <AlertTriangle className="mx-auto h-10 w-10 text-red-600" />

                    <h2 className="mt-3 text-lg font-bold text-red-700">
                        Failed to Load Analytics
                    </h2>

                    <p className="mt-2 text-sm text-red-600">
                        {error || "Something went wrong"}
                    </p>

                    <button
                        onClick={fetchReports}
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { summary: sales } = salesReport;
    const { summary: inventory } = inventoryReport;
    const { summary: customers } = customerReport;

    const revenueMap: Record<string, number> = {};

    salesReport.sales.forEach((sale) => {
        const date = new Date(sale.createdAt).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
            }
        );

        if (!revenueMap[date]) {
            revenueMap[date] = 0;
        }

        revenueMap[date] += sale.totalAmount;
    });

    const revenueTrendData = Object.entries(revenueMap)
        .map(([date, revenue]) => ({
            date,
            revenue,
        }))
        .reverse();

    // 👇 ADD THIS HERE
    const paymentChartData = salesReport.paymentMethods.map(
        (payment) => ({
            method: payment.method,
            netAmount: payment.netAmount,
            refundedAmount: payment.refundedAmount,
        })
    );

    const ordersMap: Record<string, number> = {};

    salesReport.sales.forEach((sale) => {
        const date = new Date(sale.createdAt).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
            }
        );

        if (!ordersMap[date]) {
            ordersMap[date] = 0;
        }

        ordersMap[date] += 1;
    });

    const ordersTrendData = Object.entries(ordersMap)
        .map(([date, orders]) => ({
            date,
            orders,
        }))
        .reverse();

    const revenueQualityData = [
        {
            metric: "Gross Revenue",
            amount: sales.totalRevenue,
        },
        {
            metric: "Refunded",
            amount: sales.totalRefunded,
        },
        {
            metric: "Net Revenue",
            amount: sales.netRevenue,
        },
    ];
    const PAYMENT_COLORS = [
        "#3b82f6",
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
    ]; const paymentTotal = paymentChartData.reduce(
        (total, payment) => total + payment.netAmount,
        0
    );

    // Business Performance KPIs

    const averageOrderValue =
        sales.totalOrders > 0
            ? sales.netRevenue / sales.totalOrders
            : 0;

    const refundRate =
        sales.totalRevenue > 0
            ? (sales.totalRefunded / sales.totalRevenue) * 100
            : 0;

    const itemsPerOrder =
        sales.totalOrders > 0
            ? sales.totalItemsSold / sales.totalOrders
            : 0;

    const customerActivityRate =
        customers.totalCustomers > 0
            ? (customers.activeCustomers / customers.totalCustomers) * 100
            : 0;

    // Advanced analytics derived only from data already returned by the existing report APIs.
    // No synthetic product/category sales data is introduced.
    const inventoryValueData = [
        { metric: "Cost Value", amount: inventory.totalInventoryValue },
        { metric: "Selling Value", amount: inventory.totalSellingValue },
        { metric: "Potential Profit", amount: inventory.potentialProfit },
    ];

    const stockHealthData = [
        { name: "Healthy Stock", value: Math.max(inventory.totalProducts - inventory.lowStockCount - inventory.outOfStockCount, 0) },
        { name: "Low Stock", value: inventory.lowStockCount },
        { name: "Out of Stock", value: inventory.outOfStockCount },
    ].filter((item) => item.value > 0);

    const customerActivityData = [
        { name: "Active", value: customers.activeCustomers },
        { name: "Inactive", value: customers.inactiveCustomers },
    ].filter((item) => item.value > 0);

    const customerRevenueData = [...customerReport.topCustomers]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 6)
        .map((customer) => ({
            name: customer.name.length > 16 ? `${customer.name.slice(0, 16)}…` : customer.name,
            revenue: customer.totalSpent,
        }));

    const financialQualityData = [
        { metric: "Subtotal", amount: sales.totalSubtotal },
        { metric: "Tax", amount: sales.totalTax },
        { metric: "Discount", amount: sales.totalDiscount },
        { metric: "Refunded", amount: sales.totalRefunded },
        { metric: "Net Revenue", amount: sales.netRevenue },
    ];

    const lowStockByCategoryMap: Record<string, number> = {};
    inventoryReport.lowStockProducts.forEach((product) => {
        const category = product.category || "Uncategorized";
        lowStockByCategoryMap[category] = (lowStockByCategoryMap[category] || 0) + 1;
    });

    const lowStockCategoryData = Object.entries(lowStockByCategoryMap)
        .map(([category, products]) => ({ category, products }))
        .sort((a, b) => b.products - a.products)
        .slice(0, 8);

    const PRODUCT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];


    return (
        <div className="space-y-8 p-6">

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                        <BarChart3 className="h-8 w-8 text-emerald-600" />
                        Analytics Dashboard
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Monitor your pharmacy business performance
                    </p>
                </div>

                <button
                    onClick={fetchReports}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Reports
                </button>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-2">

                <button
                    onClick={() => setDateRange("today")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${dateRange === "today"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    Today
                </button>

                <button
                    onClick={() => setDateRange("7days")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${dateRange === "7days"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    Last 7 Days
                </button>

                <button
                    onClick={() => setDateRange("30days")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${dateRange === "30days"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    Last 30 Days
                </button>

                <button
                    onClick={() => setDateRange("all")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${dateRange === "all"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    All Time
                </button>

            </div>

            {/* Business Performance */}
            <div>
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Business Performance
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Key performance indicators for your pharmacy
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                    {/* Average Order Value */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-emerald-100 p-3">
                                <IndianRupee className="h-6 w-6 text-emerald-600" />
                            </div>

                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Average Order Value
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-gray-900">
                            {formatCurrency(averageOrderValue)}
                        </h3>

                        <p className="mt-2 text-xs text-gray-400">
                            Average revenue generated per order
                        </p>

                    </div>


                    {/* Refund Rate */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-red-100 p-3">
                                <RefreshCw className="h-6 w-6 text-red-600" />
                            </div>

                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                                Refunds
                            </span>
                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Refund Rate
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-gray-900">
                            {refundRate.toFixed(1)}%
                        </h3>

                        <p className="mt-2 text-xs text-gray-400">
                            Percentage of revenue refunded
                        </p>

                    </div>


                    {/* Items Per Order */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-blue-100 p-3">
                                <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>

                            <Package className="h-5 w-5 text-blue-500" />
                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Items Per Order
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-gray-900">
                            {itemsPerOrder.toFixed(1)}
                        </h3>

                        <p className="mt-2 text-xs text-gray-400">
                            Average products sold per order
                        </p>

                    </div>


                    {/* Customer Activity */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-purple-100 p-3">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>

                            <TrendingUp className="h-5 w-5 text-purple-500" />
                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-500">
                            Customer Activity
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-gray-900">
                            {customerActivityRate.toFixed(1)}%
                        </h3>

                        <p className="mt-2 text-xs text-gray-400">
                            Customers actively making purchases
                        </p>

                    </div>

                </div>
            </div>

            {/* Main Summary Cards */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -5 }}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-emerald-100 p-3">
                            <IndianRupee className="h-6 w-6 text-emerald-600" />
                        </div>

                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Net Revenue
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        {formatCurrency(sales.netRevenue)}
                    </h2>

                    <p className="mt-2 text-xs text-gray-400">
                        After refunds
                    </p>
                </motion.div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="rounded-xl bg-blue-100 p-3 w-fit">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Total Orders
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        {sales.totalOrders}
                    </h2>

                    <p className="mt-2 text-xs text-gray-400">
                        {sales.totalItemsSold} items sold
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="rounded-xl bg-purple-100 p-3 w-fit">
                        <Users className="h-6 w-6 text-purple-600" />
                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Total Customers
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        {customers.totalCustomers}
                    </h2>

                    <p className="mt-2 text-xs text-gray-400">
                        {customers.activeCustomers} active customers
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="rounded-xl bg-orange-100 p-3 w-fit">
                        <Package className="h-6 w-6 text-orange-600" />
                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Inventory Value
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        {formatCurrency(inventory.totalInventoryValue)}
                    </h2>

                    <p className="mt-2 text-xs text-gray-400">
                        {inventory.totalStockQuantity} units in stock
                    </p>
                </div>

            </div>

            {/* Revenue Trend */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                    <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                            <TrendingUp className="h-6 w-6 text-emerald-600" />
                            Revenue Trend
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Daily sales revenue performance
                        </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 px-4 py-2">
                        <p className="text-xs text-gray-500">
                            Total Revenue
                        </p>

                        <p className="font-bold text-emerald-600">
                            {formatCurrency(sales.totalRevenue)}
                        </p>
                    </div>

                </div>

                <div className="mt-8 h-[350px] w-full">

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={revenueTrendData}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 0,
                                bottom: 0,
                            }}
                        >

                            <defs>
                                <linearGradient
                                    id="revenueGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#10b981"
                                        stopOpacity={0.35}
                                    />

                                    <stop
                                        offset="95%"
                                        stopColor="#10b981"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                            />

                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${value}`}
                            />

                            <Tooltip
                                formatter={(value) =>
                                    formatCurrency(Number(value))
                                }
                            />

                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="url(#revenueGradient)"
                            />

                        </AreaChart>
                    </ResponsiveContainer>

                </div>

            </div>

            {/* Sales Intelligence */}
            <div>
                <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        Sales Intelligence
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Understand order volume and revenue quality over the selected period
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Orders Trend */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Orders Trend
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Number of orders generated each day
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-100 p-3">
                                <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>

                        <div className="mt-8 h-[320px]">
                            {ordersTrendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ordersTrendData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                        />

                                        <Tooltip
                                            formatter={(value) =>
                                                `${Number(value)} orders`
                                            }
                                        />

                                        <Bar
                                            dataKey="orders"
                                            name="Orders"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                    No order data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Quality */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Revenue Quality
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Gross revenue compared with refunds and net revenue
                                </p>
                            </div>

                            <div className="rounded-xl bg-emerald-100 p-3">
                                <IndianRupee className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>

                        <div className="mt-8 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueQualityData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="metric"
                                        tickLine={false}
                                        axisLine={false}
                                    />

                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value}`}
                                    />

                                    <Tooltip
                                        formatter={(value) =>
                                            formatCurrency(Number(value))
                                        }
                                    />

                                    <Bar
                                        dataKey="amount"
                                        name="Amount"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>

            {/* 👇 ADD PAYMENT CHARTS HERE */}

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">

                {/* Payment Performance */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-blue-100 p-3">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Payment Performance
                            </h2>

                            <p className="text-sm text-gray-500">
                                Net revenue by payment method
                            </p>
                        </div>

                    </div>

                    <div className="mt-8 h-[320px]">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={paymentChartData}>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="method"
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />

                                <Tooltip
                                    formatter={(value) =>
                                        formatCurrency(Number(value))
                                    }
                                />

                                <Bar
                                    dataKey="netAmount"
                                    name="Net Revenue"
                                    radius={[8, 8, 0, 0]}
                                />

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                </div>


                {/* Refund Overview */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-red-100 p-3">
                            <RefreshCw className="h-6 w-6 text-red-600" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Refund Overview
                            </h2>

                            <p className="text-sm text-gray-500">
                                Refund amounts by payment method
                            </p>
                        </div>

                    </div>

                    <div className="mt-8 h-[320px]">

                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart data={paymentChartData}>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="method"
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />

                                <Tooltip
                                    formatter={(value) =>
                                        formatCurrency(Number(value))
                                    }
                                />

                                <Bar
                                    dataKey="refundedAmount"
                                    name="Refunded"
                                    radius={[8, 8, 0, 0]}
                                />

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                </div>
                {/* Payment Mix */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-purple-100 p-3">
                            <Wallet className="h-6 w-6 text-purple-600" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Payment Mix
                            </h2>

                            <p className="text-sm text-gray-500">
                                Net revenue distribution
                            </p>
                        </div>
                    </div>

                    <div className="relative mt-6 h-[320px]">
                        {paymentChartData.length > 0 && paymentTotal > 0 ? (
                            <>
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={paymentChartData}
                                            dataKey="netAmount"
                                            nameKey="method"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={72}
                                            outerRadius={105}
                                            paddingAngle={3}
                                            cornerRadius={5}
                                            isAnimationActive={true}
                                            animationDuration={800}
                                        >
                                            {paymentChartData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`payment-cell-${entry.method}`}
                                                        fill={
                                                            PAYMENT_COLORS[
                                                            index %
                                                            PAYMENT_COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(Number(value))
                                            }
                                        />

                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-10">
                                    <div className="text-center">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Net Revenue
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                            {formatCurrency(paymentTotal)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                No payment data available
                            </div>
                        )}
                    </div>
                </div>

            </div>


            {/* Sales + Inventory */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Sales Overview */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Sales Overview
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Overall sales performance
                            </p>
                        </div>

                        <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Gross Revenue
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(sales.totalRevenue)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Total Refunded
                            </p>

                            <p className="mt-1 text-lg font-bold text-red-600">
                                {formatCurrency(sales.totalRefunded)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Total Tax
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(sales.totalTax)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Discounts
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(sales.totalDiscount)}
                            </p>
                        </div>

                    </div>
                </div>

                {/* Inventory Overview */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Inventory Overview
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Current pharmacy inventory status
                            </p>
                        </div>

                        <Package className="h-6 w-6 text-orange-600" />
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Total Products
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {inventory.totalProducts}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Potential Profit
                            </p>

                            <p className="mt-1 text-lg font-bold text-emerald-600">
                                {formatCurrency(inventory.potentialProfit)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-red-50 p-4">
                            <p className="text-sm text-red-600">
                                Low Stock
                            </p>

                            <p className="mt-1 text-lg font-bold text-red-700">
                                {inventory.lowStockCount}
                            </p>
                        </div>

                        <div className="rounded-xl bg-red-50 p-4">
                            <p className="text-sm text-red-600">
                                Expired Batches
                            </p>

                            <p className="mt-1 text-lg font-bold text-red-700">
                                {inventory.expiredBatchCount}
                            </p>
                        </div>

                    </div>
                </div>

            </div>

            {/* Payment Methods */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Payment Methods
                        </h2>

                        <p className="text-sm text-gray-500">
                            Sales breakdown by payment method
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                    {salesReport.paymentMethods.map((payment) => (
                        <div
                            key={payment.method}
                            className="rounded-xl border border-gray-100 p-5"
                        >
                            <div className="flex items-center justify-between">

                                <p className="font-semibold text-gray-900">
                                    {payment.method}
                                </p>

                                <Wallet className="h-5 w-5 text-gray-400" />
                            </div>

                            <p className="mt-4 text-2xl font-bold text-gray-900">
                                {formatCurrency(payment.netAmount)}
                            </p>

                            <div className="mt-3 space-y-1 text-sm text-gray-500">
                                <p>
                                    Transactions: {payment.transactionCount}
                                </p>

                                <p>
                                    Refunded:{" "}
                                    {formatCurrency(payment.refundedAmount)}
                                </p>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* Customers */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Customer Statistics */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                    <h2 className="text-xl font-bold text-gray-900">
                        Customer Insights
                    </h2>

                    <div className="mt-6 space-y-4">

                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                            <span className="text-gray-600">
                                Active Customers
                            </span>

                            <span className="font-bold text-emerald-600">
                                {customers.activeCustomers}
                            </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                            <span className="text-gray-600">
                                Inactive Customers
                            </span>

                            <span className="font-bold text-gray-700">
                                {customers.inactiveCustomers}
                            </span>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                            <span className="text-gray-600">
                                Average Spending
                            </span>

                            <span className="font-bold text-purple-600">
                                {formatCurrency(
                                    customers.averageCustomerSpending
                                )}
                            </span>
                        </div>

                    </div>
                </div>

                {/* Top Customers */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                    <h2 className="text-xl font-bold text-gray-900">
                        Top Customers
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Customers ranked by total spending
                    </p>

                    <div className="mt-6 space-y-3">

                        {customerReport.topCustomers.map(
                            (customer, index) => (
                                <div
                                    key={customer.id}
                                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                                >
                                    <div className="flex items-center gap-3">

                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                                            {index + 1}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {customer.name}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {customer.totalOrders} orders
                                            </p>
                                        </div>
                                    </div>

                                    <p className="font-bold text-emerald-600">
                                        {formatCurrency(customer.totalSpent)}
                                    </p>
                                </div>
                            )
                        )}

                    </div>
                </div>

            </div>

            {/* Product & Stock Intelligence */}
            <div>
                <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Package className="h-6 w-6 text-orange-600" />
                        Product & Stock Intelligence
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Identify inventory health and products that require attention
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Inventory Value Analysis</h3>
                                <p className="mt-1 text-sm text-gray-500">Cost, selling value and potential profit</p>
                            </div>
                            <IndianRupee className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="mt-8 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventoryValueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="metric" tickLine={false} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Bar dataKey="amount" name="Value" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Stock Health</h3>
                                <p className="mt-1 text-sm text-gray-500">Current product availability status</p>
                            </div>
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="relative mt-6 h-[320px]">
                            {stockHealthData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stockHealthData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={72}
                                                outerRadius={105}
                                                paddingAngle={3}
                                                cornerRadius={5}
                                                isAnimationActive={true}
                                                animationDuration={800}
                                            >
                                                {stockHealthData.map((entry, index) => (
                                                    <Cell key={`stock-${entry.name}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${Number(value)} products`} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-10">
                                        <div className="text-center">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Products</p>
                                            <p className="mt-1 text-xl font-bold text-gray-900">{inventory.totalProducts}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">No inventory data available</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Low Stock Products</h3>
                            <p className="mt-1 text-sm text-gray-500">Products currently at or below their reorder threshold</p>
                        </div>
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">{inventory.lowStockCount} alerts</span>
                    </div>
                    <div className="mt-6 h-[320px]">
                        {inventoryReport.lowStockProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={inventoryReport.lowStockProducts.slice(0, 8).map((product) => ({
                                        name: product.name.length > 18 ? `${product.name.slice(0, 18)}…` : product.name,
                                        quantity: product.quantity,
                                        reorderPoint: product.reorderPoint,
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="quantity" name="Current Stock" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="reorderPoint" name="Reorder Point" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-emerald-600">All products are above their reorder thresholds 🎉</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Intelligence */}
            <div>
                <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <BarChart3 className="h-6 w-6 text-indigo-600" />
                        Category Intelligence
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Low-stock concentration across available product categories</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="h-[320px]">
                        {lowStockCategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={lowStockCategoryData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="category" tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => `${Number(value)} low-stock products`} />
                                    <Bar dataKey="products" name="Low Stock Products" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">No low-stock category data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Intelligence */}
            <div>
                <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Users className="h-6 w-6 text-purple-600" />
                        Customer Intelligence
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Customer activity and highest-value customers</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900">Customer Activity</h3>
                        <p className="mt-1 text-sm text-gray-500">Active versus inactive customers</p>
                        <div className="relative mt-6 h-[320px]">
                            {customerActivityData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={customerActivityData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={72} outerRadius={105} paddingAngle={3} cornerRadius={5} isAnimationActive={true} animationDuration={800}>
                                                {customerActivityData.map((entry, index) => (
                                                    <Cell key={`customer-${entry.name}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${Number(value)} customers`} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-10">
                                        <div className="text-center">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total</p>
                                            <p className="mt-1 text-xl font-bold text-gray-900">{customers.totalCustomers}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">No customer data available</div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900">Top Customer Revenue</h3>
                        <p className="mt-1 text-sm text-gray-500">Highest spending customers</p>
                        <div className="mt-8 h-[320px]">
                            {customerRevenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={customerRevenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Bar dataKey="revenue" name="Customer Revenue" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">No customer revenue data available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Returns & Refund Intelligence */}
            <div>
                <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <RefreshCw className="h-6 w-6 text-red-600" />
                        Returns & Refund Intelligence
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Track refund pressure and payment-method refund exposure</p>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">Refunded Amount</p>
                        <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(sales.totalRefunded)}</p>
                        <p className="mt-2 text-xs text-gray-400">Total value returned to customers</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">Refund Rate</p>
                        <p className="mt-2 text-2xl font-bold text-orange-600">{refundRate.toFixed(1)}%</p>
                        <p className="mt-2 text-xs text-gray-400">Refunded amount as a share of gross revenue</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">Net Revenue Retained</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(sales.netRevenue)}</p>
                        <p className="mt-2 text-xs text-gray-400">Revenue remaining after refunds</p>
                    </div>
                </div>
                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="method" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                                <Bar dataKey="netAmount" name="Net Revenue" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="refundedAmount" name="Refunded" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Business Intelligence */}
            <div>
                <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <DollarSign className="h-6 w-6 text-emerald-600" />
                        Business Intelligence
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Financial quality indicators for management decisions</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900">Financial Quality</h3>
                        <p className="mt-1 text-sm text-gray-500">Subtotal, tax, discounts, refunds and retained revenue</p>
                        <div className="mt-8 h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financialQualityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="metric" tickLine={false} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Bar dataKey="amount" name="Amount" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900">Management Snapshot</h3>
                        <p className="mt-1 text-sm text-gray-500">Key signals to review before operational decisions</p>
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                                <div><p className="font-semibold text-gray-900">Potential Inventory Profit</p><p className="text-xs text-gray-500">If current stock sells at current selling values</p></div>
                                <span className="font-bold text-emerald-600">{formatCurrency(inventory.potentialProfit)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                                <div><p className="font-semibold text-gray-900">Average Order Value</p><p className="text-xs text-gray-500">Net revenue per order</p></div>
                                <span className="font-bold text-blue-600">{formatCurrency(averageOrderValue)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                                <div><p className="font-semibold text-gray-900">Items Per Order</p><p className="text-xs text-gray-500">Average units sold per order</p></div>
                                <span className="font-bold text-purple-600">{itemsPerOrder.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                                <div><p className="font-semibold text-gray-900">Customer Activity</p><p className="text-xs text-gray-500">Active customers as a share of customer base</p></div>
                                <span className="font-bold text-emerald-600">{customerActivityRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                                <div><p className="font-semibold text-gray-900">Expired Batches</p><p className="text-xs text-gray-500">Inventory batches requiring action</p></div>
                                <span className="font-bold text-red-600">{inventory.expiredBatchCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-red-100 p-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Inventory Alerts
                        </h2>

                        <p className="text-sm text-gray-500">
                            Products that need attention
                        </p>
                    </div>

                </div>

                <div className="mt-6 space-y-3">

                    {inventoryReport.lowStockProducts.length === 0 ? (
                        <p className="rounded-xl bg-emerald-50 p-4 text-emerald-700">
                            No low-stock products 🎉
                        </p>
                    ) : (
                        inventoryReport.lowStockProducts.map(
                            (product) => (
                                <div
                                    key={product.name}
                                    className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {product.name}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            Category: {product.category}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-red-600">
                                            {product.quantity} left
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Reorder at {product.reorderPoint}
                                        </p>
                                    </div>
                                </div>
                            )
                        )
                    )}

                </div>
            </div>

        </div>
    );
}