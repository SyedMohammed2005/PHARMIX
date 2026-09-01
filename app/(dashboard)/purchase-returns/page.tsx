"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PackageX,
  Calendar,
  Building2,
  Receipt,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

type PurchaseReturn = {
  id: string;
  returnNumber: string;
  totalRefund: number;
  reason: string | null;
  status: string;
  createdAt: string;

  purchase: {
    id: string;
    purchaseNumber: string;

    supplier: {
      id: string;
      name: string;
    };
  };

  items: {
    id: string;
    quantity: number;
    refundAmount: number;

    purchaseItem: {
      product: {
        id: string;
        name: string;
      };
    };
  }[];
};

type PurchaseReturnResponse = {
  success: boolean;

  returns?: PurchaseReturn[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  message?: string;
};

export default function PurchaseReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);

  const [loading, setLoading] = useState(true);

  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchPurchaseReturns = async (searchValue = search) => {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));

      params.set("limit", "10");

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/purchase-returns?${params.toString()}`,
      );

      const result: PurchaseReturnResponse = await response.json();

      if (!response.ok || !result.success || !result.returns) {
        throw new Error(result.message || "Failed to fetch purchase returns");
      }

      setReturns(result.returns);

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch purchase returns:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load purchase returns",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseReturns();
  }, [page, status]);

  const handleSearch = async () => {
    try {
      setSearching(true);

      setPage(1);

      await fetchPurchaseReturns(search);
    } finally {
      setSearching(false);
    }
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

  if (loading && returns.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-gray-600">
            Loading purchase returns...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <PackageX className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" />
              </div>
              Purchase Returns
            </h1>
            <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              View and manage all returned purchase orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
              <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Total Returns
              </span>
              <p className="text-xl font-bold text-emerald-800">
                {pagination.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-4 text-red-700 flex items-start gap-3">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
              <Search className="h-4 w-4 text-emerald-600" />
              Search
            </label>
            <div className="relative mt-2">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Return number or supplier..."
                className="w-full rounded-xl border border-gray-200 bg-white/50 pl-4 pr-10 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100/50 hover:border-emerald-300"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600" />
              Status
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);

                setPage(1);
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100/50 hover:border-emerald-300"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* SEARCH BUTTON */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-200/70 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search Returns
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RETURNS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20">
        <div className="border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-5 py-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Return History
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Showing {returns.length} of {pagination.total} returns
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Return Number
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Purchase
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Supplier
                  </div>
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Items
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <div className="flex items-center justify-end gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Refund
                  </div>
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <PackageX className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-600">
                        No purchase returns found
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                returns.map((purchaseReturn) => (
                  <tr
                    key={purchaseReturn.id}
                    onClick={() =>
                      router.push(`/purchase-returns/${purchaseReturn.id}`)
                    }
                    className="group cursor-pointer transition-all duration-150 hover:bg-emerald-50/50"
                  >
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-800">
                        {purchaseReturn.returnNumber}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                        <Receipt className="h-3 w-3" />
                        {purchaseReturn.purchase.purchaseNumber}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                        {purchaseReturn.purchase.supplier.name}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {purchaseReturn.items.length} item
                        {purchaseReturn.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-red-600">
                        ₹{purchaseReturn.totalRefund.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {purchaseReturn.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {new Date(purchaseReturn.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
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
            Page{" "}
            <span className="font-semibold text-gray-800">
              {pagination.page}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {pagination.totalPages}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= pagination.totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
