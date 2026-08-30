"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ReturnItem = {
  id: string;
  quantity: number;
  refundAmount: number;

  saleItem: {
    id: string;
    unitPrice: number;
    subtotal: number;

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

type SaleReturn = {
  id: string;
  returnNumber: string;
  totalRefund: number;
  reason: string | null;
  status: string;
  createdAt: string;

  items: ReturnItem[];

  sale: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;

    customer: {
      id: string;
      name: string;
    } | null;

    payment: {
      id: string;
      amount: number;
      method: string;
      status: string;
      refundedAmount: number;
    } | null;
  };
};

type ReturnResponse = {
  success: boolean;
  return: SaleReturn;
};

export default function ReturnDetailsPage() {
  const params = useParams();

  const id = params.id as string;

  const [saleReturn, setSaleReturn] =
    useState<SaleReturn | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReturnDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/sales/returns/${id}`
        );

        const result: ReturnResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            "Failed to fetch return details"
          );
        }

        setSaleReturn(result.return);
      } catch (error) {
        console.error(
          "Failed to fetch return details:",
          error
        );

        setError(
          "Failed to load return details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReturnDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-black">
        Loading return details...
      </div>
    );
  }

  if (error || !saleReturn) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error || "Return not found."}
        </div>

        <Link
          href="/returns"
          className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Back to Returns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            href="/returns"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to Returns
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            Return Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Return Number: {saleReturn.returnNumber}
          </p>
        </div>

        <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          {saleReturn.status}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Refund */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Refund
          </p>

          <p className="mt-2 text-2xl font-bold">
            ₹{saleReturn.totalRefund.toFixed(2)}
          </p>
        </div>

        {/* Invoice */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Original Invoice
          </p>

          <p className="mt-2 font-semibold">
            {saleReturn.sale.invoiceNumber}
          </p>
        </div>

        {/* Customer */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Customer
          </p>

          <p className="mt-2 font-semibold">
            {saleReturn.sale.customer?.name ||
              "Walk-in Customer"}
          </p>
        </div>

        {/* Date */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Return Date
          </p>

          <p className="mt-2 text-sm font-semibold">
            {new Date(
              saleReturn.createdAt
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Returned Medicines */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Returned Medicines
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Medicines included in this return.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Medicine
                </th>

                <th className="px-6 py-4 font-semibold">
                  Batch
                </th>

                <th className="px-6 py-4 font-semibold">
                  Expiry Date
                </th>

                <th className="px-6 py-4 font-semibold">
                  Unit Price
                </th>

                <th className="px-6 py-4 font-semibold">
                  Returned Qty
                </th>

                <th className="px-6 py-4 font-semibold">
                  Refund Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {saleReturn.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium">
                      {item.saleItem.product.name}
                    </p>

                    {item.saleItem.product.genericName && (
                      <p className="text-xs text-gray-500">
                        {
                          item.saleItem.product
                            .genericName
                        }
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {
                      item.saleItem.batch
                        .batchNumber
                    }
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(
                      item.saleItem.batch.expiryDate
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    ₹
                    {item.saleItem.unitPrice.toFixed(
                      2
                    )}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {item.quantity}
                  </td>

                  <td className="px-6 py-4 font-semibold">
                    ₹
                    {item.refundAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Return Reason */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Return Reason
          </h2>

          <p className="mt-3 text-sm text-gray-600">
            {saleReturn.reason ||
              "No reason provided."}
          </p>
        </div>

        {/* Payment Information */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Payment Information
          </h2>

          {saleReturn.sale.payment ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Payment Method
                </span>

                <span className="font-medium">
                  {
                    saleReturn.sale.payment
                      .method
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Original Payment
                </span>

                <span className="font-medium">
                  ₹
                  {saleReturn.sale.payment.amount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Total Refunded
                </span>

                <span className="font-medium text-red-600">
                  ₹
                  {saleReturn.sale.payment.refundedAmount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Payment Status
                </span>

                <span className="font-medium">
                  {
                    saleReturn.sale.payment
                      .status
                  }
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Payment information not available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}