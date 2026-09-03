"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  PackageX,
  Boxes,
  RefreshCw,
  Package,
} from "lucide-react";

type Batch = {
  id: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;

  product: {
    id: string;
    name: string;
    sku: string;
  };
};

type AlertGroup = {
  count: number;
  batches: Batch[];
};

type AlertsResponse = {
  success: boolean;
  expired?: AlertGroup;
  expiringSoon?: AlertGroup;
  lowStock?: AlertGroup;
  message?: string;
};

export default function BatchAlertsPage() {
  const [expired, setExpired] =
    useState<AlertGroup | null>(null);

  const [expiringSoon, setExpiringSoon] =
    useState<AlertGroup | null>(null);

  const [lowStock, setLowStock] =
    useState<AlertGroup | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        "/api/batches/alerts",
      );

      const result: AlertsResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to fetch batch alerts",
        );
      }

      setExpired(
        result.expired || {
          count: 0,
          batches: [],
        },
      );

      setExpiringSoon(
        result.expiringSoon || {
          count: 0,
          batches: [],
        },
      );

      setLowStock(
        result.lowStock || {
          count: 0,
          batches: [],
        },
      );
    } catch (error) {
      console.error(
        "Failed to fetch batch alerts:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load batch alerts",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading batch alerts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* BACK */}

      <Link
        href="/batches"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to Batches
      </Link>

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">

          <div className="rounded-2xl bg-red-100 p-4">

            <AlertTriangle className="h-8 w-8 text-red-600" />

          </div>

          <div>

            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
              Batch Alerts
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Monitor expired, expiring, and low-stock medicine batches
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={fetchAlerts}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />

          Refresh
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="mb-8 grid gap-5 md:grid-cols-3">

        {/* EXPIRED */}

        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-500">
                Expired Batches
              </p>

              <p className="mt-3 text-4xl font-bold text-red-600">
                {expired?.count || 0}
              </p>

            </div>

            <div className="rounded-xl bg-red-100 p-3">

              <PackageX className="h-6 w-6 text-red-600" />

            </div>

          </div>

        </div>

        {/* EXPIRING */}

        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-500">
                Expiring Soon
              </p>

              <p className="mt-3 text-4xl font-bold text-amber-600">
                {expiringSoon?.count || 0}
              </p>

            </div>

            <div className="rounded-xl bg-amber-100 p-3">

              <CalendarClock className="h-6 w-6 text-amber-600" />

            </div>

          </div>

        </div>

        {/* LOW STOCK */}

        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-500">
                Low Stock Batches
              </p>

              <p className="mt-3 text-4xl font-bold text-orange-600">
                {lowStock?.count || 0}
              </p>

            </div>

            <div className="rounded-xl bg-orange-100 p-3">

              <Boxes className="h-6 w-6 text-orange-600" />

            </div>

          </div>

        </div>

      </div>

      {/* EXPIRED BATCHES */}

      <AlertSection
        title="Expired Batches"
        description="These batches have already passed their expiry date."
        batches={expired?.batches || []}
        emptyMessage="No expired batches found."
        variant="red"
      />

      {/* EXPIRING SOON */}

      <div className="mt-8">

        <AlertSection
          title="Expiring Soon"
          description="These batches will expire within the next 30 days."
          batches={expiringSoon?.batches || []}
          emptyMessage="No batches are expiring within 30 days."
          variant="amber"
        />

      </div>

      {/* LOW STOCK */}

      <div className="mt-8">

        <AlertSection
          title="Low Stock Batches"
          description="These batches currently have 10 or fewer units."
          batches={lowStock?.batches || []}
          emptyMessage="No low-stock batches found."
          variant="orange"
        />

      </div>

    </div>
  );
}

type AlertSectionProps = {
  title: string;
  description: string;
  batches: Batch[];
  emptyMessage: string;
  variant: "red" | "amber" | "orange";
};

function AlertSection({
  title,
  description,
  batches,
  emptyMessage,
  variant,
}: AlertSectionProps) {
  const styles = {
    red: {
      border: "border-red-100",
      badge: "bg-red-100 text-red-700",
    },

    amber: {
      border: "border-amber-100",
      badge: "bg-amber-100 text-amber-700",
    },

    orange: {
      border: "border-orange-100",
      badge: "bg-orange-100 text-orange-700",
    },
  };

  return (
    <div
      className={`rounded-2xl border ${styles[variant].border} bg-white p-6 shadow-sm`}
    >

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h2 className="text-lg font-bold text-gray-800">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>

        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[variant].badge}`}
        >
          {batches.length} Batches
        </span>

      </div>

      {batches.length === 0 ? (

        <div className="flex flex-col items-center justify-center py-12 text-center">

          <Package className="h-10 w-10 text-gray-300" />

          <p className="mt-3 text-sm text-gray-500">
            {emptyMessage}
          </p>

        </div>

      ) : (

        <div className="mt-6 overflow-x-auto">

          <table className="w-full text-left">

            <thead>

              <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">

                <th className="pb-3 font-semibold">
                  Product
                </th>

                <th className="pb-3 font-semibold">
                  Batch Number
                </th>

                <th className="pb-3 font-semibold">
                  Expiry Date
                </th>

                <th className="pb-3 font-semibold">
                  Quantity
                </th>

                <th className="pb-3 font-semibold">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {batches.map((batch) => (

                <tr
                  key={batch.id}
                  className="border-b border-gray-50 last:border-0"
                >

                  <td className="py-4">

                    <p className="font-semibold text-gray-800">
                      {batch.product.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {batch.product.sku}
                    </p>

                  </td>

                  <td className="py-4 text-sm font-medium text-gray-700">
                    {batch.batchNumber}
                  </td>

                  <td className="py-4 text-sm text-gray-600">
                    {new Date(
                      batch.expiryDate,
                    ).toLocaleDateString("en-IN")}
                  </td>

                  <td className="py-4 text-sm font-semibold text-gray-700">
                    {batch.quantity}
                  </td>

                  <td className="py-4">

                    <Link
                      href={`/batches/${batch.id}`}
                      className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                    >
                      View Details
                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}