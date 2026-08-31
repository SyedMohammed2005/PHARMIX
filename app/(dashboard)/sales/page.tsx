"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Sale = {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: string;

  customer: {
    id: string;
    name: string;
  } | null;

  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  } | null;
};

type SalesResponse = {
  success: boolean;
  count: number;
  sales: Sale[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type SalesSummary = {
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
};

type SalesSummaryResponse = {
  success: boolean;
  summary: SalesSummary;
};

export default function SalesPage() {
  // =========================
  // STATES
  // =========================

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] =
    useState<SalesSummary | null>(null);

  // =========================
  // FILTER STATES
  // =========================

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // =========================
  // PAGINATION STATES
  // =========================

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState<SalesResponse["pagination"] | null>(
      null
    );

  const limit = 20;

  // =========================
  // DEBOUNCE SEARCH
  // =========================

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // =========================
  // FETCH SALES SUMMARY
  // =========================

  const fetchSummary = async () => {
    try {
      const response = await fetch(
        "/api/sales/summary"
      );

      const result: SalesSummaryResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          "Failed to fetch sales summary"
        );
      }

      setSummary(result.summary);
    } catch (error) {
      console.error(
        "Failed to fetch sales summary:",
        error
      );
    }
  };

  // =========================
  // FETCH SALES
  // =========================

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      // Pagination
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      // Search
      if (debouncedSearch.trim()) {
        params.set(
          "search",
          debouncedSearch.trim()
        );
      }

      // Payment Method
      if (paymentMethod) {
        params.set(
          "paymentMethod",
          paymentMethod
        );
      }

      // Start Date
      if (startDate) {
        params.set("startDate", startDate);
      }

      // End Date
      if (endDate) {
        params.set("endDate", endDate);
      }

      const response = await fetch(
        `/api/sales?${params.toString()}`
      );

      const result: SalesResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          "Failed to fetch sales"
        );
      }

      setSales(result.sales);
      setPagination(result.pagination);
    } catch (error) {
      console.error(
        "Failed to fetch sales:",
        error
      );

      setError(
        "Failed to load sales history."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH SUMMARY ON PAGE LOAD
  // =========================

  useEffect(() => {
    fetchSummary();
  }, []);

  // =========================
  // FETCH SALES WHEN FILTERS CHANGE
  // =========================

  useEffect(() => {
    fetchSales();
  }, [
    page,
    debouncedSearch,
    paymentMethod,
    startDate,
    endDate,
  ]);

  // =========================
  // REFRESH DATA
  // =========================

  const refreshSalesData = async () => {
    await Promise.all([
      fetchSales(),
      fetchSummary(),
    ]);
  };

  // =========================
  // CLEAR FILTERS
  // =========================

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setPaymentMethod("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    paymentMethod ||
    startDate ||
    endDate;

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6 text-black">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Sales History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View, search, and manage pharmacy sales.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshSalesData}
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Refreshing..."
            : "Refresh Data"}
        </button>
      </div>

      {/* ========================= */}
      {/* SALES SUMMARY */}
      {/* ========================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Sales */}

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Sales
          </p>

          <p className="mt-2 text-2xl font-bold">
            {summary?.totalSales ?? 0}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            All recorded transactions
          </p>
        </div>

        {/* Total Revenue */}

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Revenue
          </p>

          <p className="mt-2 text-2xl font-bold">
            ₹
            {(
              summary?.totalRevenue ?? 0
            ).toFixed(2)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Revenue from all sales
          </p>
        </div>

        {/* Today's Sales */}

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Today&apos;s Sales
          </p>

          <p className="mt-2 text-2xl font-bold">
            {summary?.todaySales ?? 0}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Transactions completed today
          </p>
        </div>

        {/* Today's Revenue */}

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Today&apos;s Revenue
          </p>

          <p className="mt-2 text-2xl font-bold">
            ₹
            {(
              summary?.todayRevenue ?? 0
            ).toFixed(2)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Revenue generated today
          </p>
        </div>
      </div>

      {/* ========================= */}
      {/* FILTERS */}
      {/* ========================= */}

      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}

          <div className="space-y-2">
            <label
              htmlFor="search"
              className="text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <input
              id="search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Invoice or customer..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-900"
            />
          </div>

          {/* Payment Method */}

          <div className="space-y-2">
            <label
              htmlFor="paymentMethod"
              className="text-sm font-medium text-gray-700"
            >
              Payment Method
            </label>

            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(
                  event.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-gray-900"
            >
              <option value="">
                All Methods
              </option>

              <option value="CASH">
                Cash
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="ONLINE">
                Online
              </option>
            </select>
          </div>

          {/* From Date */}

          <div className="space-y-2">
            <label
              htmlFor="startDate"
              className="text-sm font-medium text-gray-700"
            >
              From Date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-900"
            />
          </div>

          {/* To Date */}

          <div className="space-y-2">
            <label
              htmlFor="endDate"
              className="text-sm font-medium text-gray-700"
            >
              To Date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none transition focus:border-gray-900"
            />
          </div>

          {/* Clear Filters */}

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* RESULTS SUMMARY */}
      {/* ========================= */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {sales.length} sale
          {sales.length !== 1 ? "s" : ""}
        </p>

        {loading && (
          <p className="text-sm text-gray-500">
            Loading...
          </p>
        )}
      </div>

      {/* ========================= */}
      {/* ERROR */}
      {/* ========================= */}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* ========================= */}
      {/* SALES TABLE */}
      {/* ========================= */}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Invoice
                </th>

                <th className="px-6 py-4 font-semibold">
                  Customer
                </th>

                <th className="px-6 py-4 font-semibold">
                  Payment
                </th>

                <th className="px-6 py-4 font-semibold">
                  Total
                </th>

                <th className="px-6 py-4 font-semibold">
                  Date
                </th>

                <th className="px-6 py-4 font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading sales...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {/* Invoice */}

                    <td className="px-6 py-4 font-medium">
                      {sale.invoiceNumber}
                    </td>

                    {/* Customer */}

                    <td className="px-6 py-4">
                      {sale.customer?.name ||
                        "Walk-in Customer"}
                    </td>

                    {/* Payment */}

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">
                          {sale.payment?.method ||
                            "N/A"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {sale.payment?.status ||
                            "N/A"}
                        </p>
                      </div>
                    </td>

                    {/* Total */}

                    <td className="px-6 py-4 font-semibold">
                      ₹
                      {sale.totalAmount.toFixed(2)}
                    </td>

                    {/* Date */}

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(
                        sale.createdAt
                      ).toLocaleString()}
                    </td>

                    {/* Action */}

                    <td className="px-6 py-4">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="inline-block rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-700"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================= */}
      {/* PAGINATION */}
      {/* ========================= */}

      {pagination &&
        pagination.totalPages > 1 && (
          <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Results Information */}

            <p className="text-sm text-gray-600">
              Page{" "}
              <span className="font-semibold">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold">
                {pagination.totalPages}
              </span>
              {" · "}
              Total{" "}
              <span className="font-semibold">
                {pagination.total}
              </span>{" "}
              sales
            </p>

            {/* Buttons */}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage
                }
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(
                      currentPage - 1,
                      1
                    )
                  )
                }
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Previous
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage + 1
                  )
                }
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

