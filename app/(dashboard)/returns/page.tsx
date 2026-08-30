"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

type ReturnItem = {
  id: string;
  quantity: number;
  refundAmount: number;
};

type SaleReturn = {
  id: string;
  returnNumber: string;
  totalRefund: number;
  reason: string | null;
  status: string;
  createdAt: string;

  sale: {
    id: string;
    invoiceNumber: string;

    customer: {
      id: string;
      name: string;
    } | null;
  };

  items: ReturnItem[];
};

type ReturnsResponse = {
  success: boolean;
  count: number;
  returns: SaleReturn[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/sales/returns?page=1&limit=20"
        );

        const result: ReturnsResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.success
              ? "Failed to fetch returns"
              : "Unable to load returns"
          );
        }

        setReturns(result.returns);
      } catch (error) {
        console.error(
          "Failed to fetch returns:",
          error
        );

        setError(
          "Failed to load returns history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  if (loading) {
    return (
      <div className="text-black">
        Loading returns...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Returns History
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View and manage pharmacy sales returns.
        </p>
      </div>

      {/* Returns Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Return Number
                </th>

                <th className="px-6 py-4 font-semibold">
                  Invoice
                </th>

                <th className="px-6 py-4 font-semibold">
                  Customer
                </th>

                <th className="px-6 py-4 font-semibold">
                  Items
                </th>

                <th className="px-6 py-4 font-semibold">
                  Refund
                </th>

                <th className="px-6 py-4 font-semibold">
                  Reason
                </th>

                <th className="px-6 py-4 font-semibold">
                  Status
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
              {returns.map((saleReturn) => (
                <tr
                  key={saleReturn.id}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium">
                    {saleReturn.returnNumber}
                  </td>

                  <td className="px-6 py-4">
                    {saleReturn.sale.invoiceNumber}
                  </td>

                  <td className="px-6 py-4">
                    {saleReturn.sale.customer?.name ||
                      "Walk-in Customer"}
                  </td>

                  <td className="px-6 py-4">
                    {saleReturn.items.length}
                  </td>

                  <td className="px-6 py-4 font-semibold">
                    ₹
                    {saleReturn.totalRefund.toFixed(2)}
                  </td>

                  <td className="max-w-[200px] truncate px-6 py-4 text-gray-600">
                    {saleReturn.reason ||
                      "No reason provided"}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      {saleReturn.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                    {new Date(
                      saleReturn.createdAt
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
  <Link
    href={`/returns/${saleReturn.id}`}
    className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700"
  >
    View Details
  </Link>
</td>
                </tr>
              ))}

              {returns.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No returns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}