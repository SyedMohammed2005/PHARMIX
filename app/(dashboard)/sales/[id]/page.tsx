"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type SaleItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  gst: number;
  subtotal: number;

  product: {
    id: string;
    name: string;
    sku: string;
  };

  batch: {
    id: string;
    batchNumber: string;
  };
};

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
    phone?: string | null;
  } | null;

  items: SaleItem[];

  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  } | null;
};

type SaleResponse = {
  success: boolean;
  sale?: Sale;
  message?: string;
};

export default function SaleDetailsPage() {
  const params = useParams();

  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/sales/${saleId}`);

        const result: SaleResponse = await response.json();

        if (!response.ok || !result.success || !result.sale) {
          throw new Error(
            result.message || "Failed to fetch sale details"
          );
        }

        setSale(result.sale);
      } catch (error) {
        console.error(
          "Failed to fetch sale details:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load sale details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      fetchSale();
    }
  }, [saleId]);

  if (loading) {
    return (
      <div className="text-black">
        Loading sale details...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error || "Sale not found."}
        </div>

        <Link
          href="/sales"
          className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }

          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            background: white;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <div
        id="invoice-print"
        className="mx-auto max-w-5xl space-y-6 bg-white text-black"
      >
        {/* PROFESSIONAL INVOICE HEADER */}
        <div className="border-b-2 border-gray-900 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                PHARMIX
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Pharmacy Management System
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Hyderabad, Telangana
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-bold">
                TAX INVOICE
              </h2>

              <p className="mt-3 text-sm">
                <span className="font-semibold">
                  Invoice:
                </span>{" "}
                {sale.invoiceNumber}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {new Date(
                  sale.createdAt
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* SCREEN ACTIONS */}
        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/sales"
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Back to Sales
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700"
            >
              🖨️ Print Invoice
            </button>

            <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-gray-500">
                Total Amount
              </p>

              <p className="mt-1 text-xl font-bold">
                ₹{sale.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMER AND PAYMENT */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* CUSTOMER */}
          <div className="rounded-lg border border-gray-300 p-5">
            <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide">
              Customer Details
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-semibold">
                  Name:
                </span>{" "}
                {sale.customer?.name || "Walk-in Customer"}
              </p>

              {sale.customer?.phone && (
                <p>
                  <span className="font-semibold">
                    Phone:
                  </span>{" "}
                  {sale.customer.phone}
                </p>
              )}
            </div>
          </div>

          {/* PAYMENT */}
          <div className="rounded-lg border border-gray-300 p-5">
            <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide">
              Payment Details
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-semibold">
                  Method:
                </span>{" "}
                {sale.payment?.method || "N/A"}
              </p>

              <p>
                <span className="font-semibold">
                  Status:
                </span>{" "}
                {sale.payment?.status || "N/A"}
              </p>

              <p>
                <span className="font-semibold">
                  Amount Paid:
                </span>{" "}
                ₹{sale.payment?.amount.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* MEDICINES TABLE */}
        <div className="overflow-hidden rounded-lg border border-gray-300">
          <div className="border-b bg-gray-100 px-5 py-3">
            <h2 className="font-bold">
              Medicines Sold
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    Medicine
                  </th>

                  <th className="px-4 py-3">
                    SKU
                  </th>

                  <th className="px-4 py-3">
                    Batch
                  </th>

                  <th className="px-4 py-3 text-center">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-right">
                    Price
                  </th>

                  <th className="px-4 py-3 text-right">
                    GST
                  </th>

                  <th className="px-4 py-3 text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.product.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {item.product.sku}
                    </td>

                    <td className="px-4 py-3">
                      {item.batch.batchNumber}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3 text-right">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {item.gst}%
                    </td>

                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INVOICE SUMMARY */}
        <div className="ml-auto w-full max-w-sm rounded-lg border border-gray-300 p-5">
          <h2 className="border-b pb-3 text-lg font-bold">
            Invoice Summary
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Subtotal
              </span>

              <span>
                ₹{sale.subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                GST / Tax
              </span>

              <span>
                ₹{sale.tax.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Discount
              </span>

              <span>
                - ₹{sale.discount.toFixed(2)}
              </span>
            </div>

            <div className="border-t-2 border-gray-900 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>

                <span>
                  ₹{sale.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t pt-4 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">
            Thank you for choosing Pharmix!
          </p>

          <p className="mt-1">
            This is a computer-generated invoice.
          </p>
        </div>
      </div>
    </>
  );
}
