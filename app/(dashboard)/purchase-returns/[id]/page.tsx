"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PurchaseReturnItem = {
  id: string;
  quantity: number;
  refundAmount: number;

  purchaseItem: {
    id: string;

    product: {
      id: string;
      name: string;
      genericName: string | null;
    };

    batch: {
      id: string;
      batchNumber: string;
      expiryDate: string;
    };
  };
};

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
      email: string | null;
      phone: string | null;
      address: string | null;
    };
  };

  items: PurchaseReturnItem[];
};

type PurchaseReturnResponse = {
  success: boolean;
  purchaseReturn?: PurchaseReturn;
  message?: string;
};

export default function PurchaseReturnDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const returnId = params.id as string;

  const [purchaseReturn, setPurchaseReturn] =
    useState<PurchaseReturn | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchPurchaseReturn = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await fetch(
          `/api/purchase-returns/${returnId}`,
        );

        const result: PurchaseReturnResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.purchaseReturn
        ) {
          throw new Error(
            result.message ||
              "Failed to fetch purchase return",
          );
        }

        setPurchaseReturn(
          result.purchaseReturn,
        );
      } catch (error) {
        console.error(
          "Failed to fetch purchase return:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load purchase return",
        );
      } finally {
        setLoading(false);
      }
    };

    if (returnId) {
      fetchPurchaseReturn();
    }
  }, [returnId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Loading purchase return details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 text-red-700 flex items-start gap-3">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm">{error}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/purchase-returns")
          }
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-200/50 transition-all duration-200 hover:bg-gray-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-300/50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Purchase Returns
        </button>
      </div>
    );
  }

  if (!purchaseReturn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="p-4 bg-gray-50 rounded-full">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600">Purchase return not found</p>
        <button
          type="button"
          onClick={() => router.push("/purchase-returns")}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition-all duration-200 hover:bg-emerald-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-200/70"
        >
          View All Returns
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* HEADER */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() =>
            router.push("/purchase-returns")
          }
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:text-emerald-700 hover:scale-[1.02]"
        >
          <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Purchase Returns
        </button>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <svg className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              Purchase Return Details
            </h1>
            <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Return: <span className="font-semibold text-gray-800">{purchaseReturn.returnNumber}</span>
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {purchaseReturn.status}
          </span>
        </div>
      </div>

      {/* RETURN INFORMATION */}
      <div className="mb-6 rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/30 hover:scale-[1.002]">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Return Information
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-xl bg-gray-50/50 p-4 transition-all duration-200 hover:bg-emerald-50/70 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Return Number
            </p>
            <p className="mt-1.5 font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              {purchaseReturn.returnNumber}
            </p>
          </div>

          <div className="group rounded-xl bg-gray-50/50 p-4 transition-all duration-200 hover:bg-emerald-50/70 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Purchase Number
            </p>
            <p className="mt-1.5 font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              {purchaseReturn.purchase.purchaseNumber}
            </p>
          </div>

          <div className="group rounded-xl bg-gray-50/50 p-4 transition-all duration-200 hover:bg-emerald-50/70 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Return Date
            </p>
            <p className="mt-1.5 font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              {new Date(purchaseReturn.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="group rounded-xl bg-gradient-to-br from-red-50/80 to-red-50/40 p-4 border border-red-100/50 transition-all duration-200 hover:from-red-50 hover:to-red-50/60 hover:border-red-200/50 hover:shadow-md hover:shadow-red-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-red-600">
              Total Refund
            </p>
            <p className="mt-1.5 text-2xl font-bold text-red-600 group-hover:scale-[1.05] transition-transform">
              ₹{purchaseReturn.totalRefund.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* SUPPLIER INFORMATION */}
      <div className="mb-6 rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/30 hover:scale-[1.002]">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Supplier Information
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-xl bg-emerald-50/30 p-4 transition-all duration-200 hover:bg-emerald-50/70 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Supplier
            </p>
            <p className="mt-1.5 font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              {purchaseReturn.purchase.supplier.name}
            </p>
          </div>

          <div className="group rounded-xl bg-gray-50/50 p-4 transition-all duration-200 hover:bg-emerald-50/30 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </p>
            <p className="mt-1.5 text-gray-700 group-hover:text-emerald-700 transition-colors break-all">
              {purchaseReturn.purchase.supplier.email || "N/A"}
            </p>
          </div>

          <div className="group rounded-xl bg-gray-50/50 p-4 transition-all duration-200 hover:bg-emerald-50/30 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </p>
            <p className="mt-1.5 text-gray-700 group-hover:text-emerald-700 transition-colors">
              {purchaseReturn.purchase.supplier.phone || "N/A"}
            </p>
          </div>

          <div className="group rounded-xl bg-gray-50/50 p-4 transition-all duration-200 hover:bg-emerald-50/30 hover:shadow-md hover:shadow-emerald-100/30">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </p>
            <p className="mt-1.5 text-gray-700 group-hover:text-emerald-700 transition-colors">
              {purchaseReturn.purchase.supplier.address || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* RETURNED ITEMS */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/30 hover:scale-[1.002]">
        <div className="border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Returned Items
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {purchaseReturn.items.length} item{purchaseReturn.items.length !== 1 ? 's' : ''} included in this return
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Product
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Generic Name
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Batch
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Expiry Date
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Quantity
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Refund Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {purchaseReturn.items.map((item) => (
                <tr
                  key={item.id}
                  className="group transition-all duration-150 hover:bg-emerald-50/30 hover:scale-[1.001]"
                >
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                      {item.purchaseItem.product.name}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-gray-600 group-hover:text-emerald-700 transition-colors">
                      {item.purchaseItem.product.genericName || "N/A"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:shadow-sm transition-all duration-200">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      {item.purchaseItem.batch.batchNumber}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-gray-600 group-hover:text-emerald-700 transition-colors">
                      {new Date(item.purchaseItem.batch.expiryDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-gray-100 font-semibold text-gray-700 group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:shadow-sm transition-all duration-200">
                      {item.quantity}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-red-600 group-hover:scale-[1.02] group-hover:text-red-700 transition-all duration-200 inline-block">
                      ₹{item.refundAmount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RETURN REASON */}
      <div className="mb-6 rounded-2xl border border-emerald-100/60 bg-white/80 backdrop-blur-sm shadow-lg shadow-emerald-100/20 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/30 hover:scale-[1.002]">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Return Reason
        </h2>

        <div className="mt-4 rounded-xl bg-gray-50/50 p-5 border border-gray-100/50 transition-all duration-200 hover:bg-emerald-50/30 hover:border-emerald-100/50">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {purchaseReturn.reason || "No reason provided."}
          </p>
        </div>
      </div>

      {/* TOTAL REFUND */}
      <div className="flex justify-end">
        <div className="w-full rounded-2xl bg-gradient-to-br from-red-50/90 to-red-50/60 border border-red-200/50 p-6 md:w-96 shadow-lg shadow-red-100/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-100/50 hover:scale-[1.02]">
          <p className="text-sm font-medium text-red-700 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Total Refund Amount
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            ₹{purchaseReturn.totalRefund.toFixed(2)}
          </p>
        </div>
      </div>

    </div>
  );
}