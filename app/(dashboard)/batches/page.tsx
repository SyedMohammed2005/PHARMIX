"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  CalendarDays,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type UserRole =
  | "ADMIN"
  | "PHARMACIST"
  | "INVENTORY_MANAGER"
  | "BUSINESS_ANALYST";

type Batch = {
  id: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;

  product: {
    id: string;
    name: string;
    sku: string;
  };
};

type BatchesResponse = {
  success: boolean;
  count?: number;
  batches?: Batch[];
  message?: string;
};

type CurrentUserResponse = {
  success: boolean;

  user?: {
    id: string;
    role: UserRole;
  };

  message?: string;
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);

  const [filteredBatches, setFilteredBatches] =
    useState<Batch[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [currentUserRole, setCurrentUserRole] =
    useState<UserRole | null>(null);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const batchesPerPage = 10;

  const fetchBatches = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch("/api/batches");

      const result: BatchesResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.batches
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch batches",
        );
      }

      setBatches(result.batches);

      setFilteredBatches(result.batches);
    } catch (error) {
      console.error(
        "Failed to fetch batches:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load batches",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");

      const result: CurrentUserResponse =
        await response.json();

      if (
        response.ok &&
        result.success &&
        result.user
      ) {
        setCurrentUserRole(result.user.role);
      }
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error,
      );
    }
  };

  useEffect(() => {
    fetchBatches();

    fetchCurrentUser();
  }, []);

  const handleSearch = () => {
    const searchValue = search
      .trim()
      .toLowerCase();

    setPage(1);

    if (!searchValue) {
      setFilteredBatches(batches);
      return;
    }

    const filtered = batches.filter((batch) => {
      return (
        batch.batchNumber
          .toLowerCase()
          .includes(searchValue) ||
        batch.product.name
          .toLowerCase()
          .includes(searchValue) ||
        batch.product.sku
          .toLowerCase()
          .includes(searchValue)
      );
    });

    setFilteredBatches(filtered);
  };

  const getBatchStatus = (expiryDate: string) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);

    expiry.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);

    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30,
    );

    if (expiry < today) {
      return {
        label: "Expired",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (expiry <= thirtyDaysFromNow) {
      return {
        label: "Expiring Soon",
        className:
          "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "Active",
      className:
        "bg-emerald-100 text-emerald-700",
    };
  };

  const canManageBatches =
    currentUserRole === "ADMIN" ||
    currentUserRole === "INVENTORY_MANAGER";

  // Pagination calculations

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredBatches.length / batchesPerPage,
    ),
  );

  const startIndex =
    (page - 1) * batchesPerPage;

  const currentBatches =
    filteredBatches.slice(
      startIndex,
      startIndex + batchesPerPage,
    );

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading batches...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800 md:text-3xl">

            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Boxes className="h-6 w-6 text-emerald-600 md:h-7 md:w-7" />
            </div>

            Batch Management

          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Track medicine batches, quantities, and expiry dates
          </p>
        </div>

        {/* ADD BATCH */}

        {canManageBatches && (
          <Link
            href="/batches/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700"
          >
            <Plus className="h-4 w-4" />

            Add Batch
          </Link>
        )}

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SEARCH */}

      <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row">

          <div className="flex-1">

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">

              <Search className="h-4 w-4 text-emerald-600" />

              Search Batches

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
                placeholder="Search by batch number, product, or SKU..."
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            </div>

          </div>

          <div className="flex items-end">

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Search className="h-4 w-4" />

              Search
            </button>

          </div>

        </div>

      </div>

      {/* BATCH TABLE */}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">

        <div className="border-b bg-emerald-50/50 px-5 py-4">

          <h2 className="font-bold text-gray-800">
            Batch List
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {currentBatches.length} of{" "}
            {filteredBatches.length} batches
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Batch Number
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Product
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                  Quantity
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Manufacture Date
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Expiry Date
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                  Status
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {currentBatches.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center"
                  >

                    <Package className="mx-auto h-10 w-10 text-gray-300" />

                    <p className="mt-3 font-medium text-gray-600">
                      No batches found
                    </p>

                  </td>

                </tr>

              ) : (

                currentBatches.map((batch) => {

                  const status =
                    getBatchStatus(
                      batch.expiryDate,
                    );

                  return (

                    <tr
                      key={batch.id}
                      className="transition hover:bg-emerald-50/40"
                    >

                      {/* BATCH NUMBER */}

                      <td className="px-4 py-4">

                        <Link
                          href={`/batches/${batch.id}`}
                          className="font-semibold text-gray-800 transition hover:text-emerald-700"
                        >
                          {batch.batchNumber}
                        </Link>

                      </td>

                      {/* PRODUCT */}

                      <td className="px-4 py-4">

                        <p className="font-medium text-gray-800">
                          {batch.product.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          SKU: {batch.product.sku}
                        </p>

                      </td>

                      {/* QUANTITY */}

                      <td className="px-4 py-4 text-center">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            batch.quantity <= 10
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {batch.quantity}
                        </span>

                      </td>

                      {/* MANUFACTURE DATE */}

                      <td className="px-4 py-4 text-gray-700">

                        <div className="flex items-center gap-2">

                          <CalendarDays className="h-4 w-4 text-gray-400" />

                          {new Date(
                            batch.manufactureDate,
                          ).toLocaleDateString(
                            "en-IN",
                          )}

                        </div>

                      </td>

                      {/* EXPIRY DATE */}

                      <td className="px-4 py-4 text-gray-700">

                        {new Date(
                          batch.expiryDate,
                        ).toLocaleDateString(
                          "en-IN",
                        )}

                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4 text-center">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex flex-col items-center justify-between gap-4 border-t px-5 py-4 sm:flex-row">

          <p className="text-sm text-gray-600">

            Page{" "}

            <span className="font-semibold text-gray-800">
              {page}
            </span>

            {" "}of{" "}

            <span className="font-semibold text-gray-800">
              {totalPages}
            </span>

          </p>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />

              Previous

            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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