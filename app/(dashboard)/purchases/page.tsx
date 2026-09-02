"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Purchase = {
  id: string;
  purchaseNumber: string;

  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;

  createdAt: string;

  supplier: {
    id: string;
    name: string;
  };

  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  } | null;
};

type PurchaseResponse = {
  success: boolean;

  purchases?: Purchase[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  message?: string;
};

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<
    Purchase[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchPurchases = async () => {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));

      params.set("limit", "10");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (paymentMethod) {
        params.set(
          "paymentMethod",
          paymentMethod
        );
      }

      const response = await fetch(
        `/api/purchases?${params.toString()}`
      );

      const result: PurchaseResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.purchases
      ) {
        throw new Error(
          result.message ||
          "Failed to fetch purchases"
        );
      }

      setPurchases(result.purchases);

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error(
        "Failed to fetch purchases:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load purchases"
      );
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, paymentMethod]);

  const handleSearch = () => {
    setPage(1);
    setSearching(true);
    fetchPurchases();
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* PAGE HEADER */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <svg className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Purchase Management
            </h1>
            <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Manage medicine purchases and supplier stock
            </p>
          </div>

          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-200/70"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Purchase
          </Link>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-4 text-red-700 flex items-start gap-3">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 text-sm">{error}</div>
        </div>
      )}

      {/* SEARCH AND FILTER */}
      <div className="mb-8 rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* SEARCH */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </label>
            <div className="relative mt-2">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Purchase number or supplier..."
                className="w-full rounded-xl border border-gray-200 bg-white/50 pl-4 pr-10 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100/50 hover:border-emerald-300"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(
                  event.target.value
                );

                setPage(1);
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100/50 hover:border-emerald-300"
            >
              <option value="">
                All Payment Methods
              </option>

              <option value="CASH">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

            </select>
          </div>

          {/* SEARCH BUTTON */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-200/70 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 disabled:hover:scale-100 disabled:hover:shadow-md disabled:hover:shadow-emerald-200/50 flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Purchases
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PURCHASE TABLE */}
      <div className="overflow-hidden rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20">
        <div className="border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-5 py-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Purchase History
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Total Purchases: {pagination.total}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Purchase Number
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Supplier
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Payment
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Total Amount
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Date
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-600">No purchases found</p>
                      <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="group transition-all duration-150 hover:bg-emerald-50/30 hover:scale-[1.001]"
                  >
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                        {purchase.purchaseNumber}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-gray-700 group-hover:text-emerald-700 transition-colors">
                        {purchase.supplier.name}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                        {purchase.payment?.method || "N/A"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                        purchase.payment?.status === "COMPLETED" 
                          ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/50"
                          : purchase.payment?.status === "PENDING"
                          ? "bg-amber-100/80 text-amber-700 border-amber-200/50"
                          : "bg-gray-100/80 text-gray-700 border-gray-200/50"
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          purchase.payment?.status === "COMPLETED" ? "bg-emerald-500" :
                          purchase.payment?.status === "PENDING" ? "bg-amber-500" :
                          "bg-gray-500"
                        }`}></span>
                        {purchase.payment?.status || "N/A"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                        ₹{purchase.totalAmount.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-600 group-hover:text-emerald-700 transition-colors">
                      {new Date(
                        purchase.createdAt
                      ).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/purchases/${purchase.id}`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-gray-200/50 transition-all duration-200 hover:bg-gray-700 hover:scale-[1.05] hover:shadow-lg hover:shadow-gray-300/50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-100/60 px-5 py-4 md:px-6">
          <p className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-800">{pagination.page}</span> of{" "}
            <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-100/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:shadow-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={
                page >= pagination.totalPages
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-100/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:shadow-none"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}