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

            {/* 👇 ADD PAYMENT CHARTS HERE */}

            <div className="grid gap-6 lg:grid-cols-2">

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