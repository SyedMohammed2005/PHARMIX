"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ReturnItem = {
  id: string;
  quantity: number;

  return: {
    id: string;
    returnNumber: string;
    status: string;
    createdAt: string;
  };
};

type PurchaseItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  gst: number;
  subtotal: number;

  product: {
    id: string;
    name: string;
    genericName: string | null;
    brand: string | null;
  };

  batch: {
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
  };

  returnItems: ReturnItem[];
};

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
    email: string;
    phone: string | null;
    address: string | null;
  };

  items: PurchaseItem[];

  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  } | null;
};

type PurchaseResponse = {
  success: boolean;
  purchase?: Purchase;
  message?: string;
};

export default function PurchaseDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const purchaseId = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchPurchase = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(`/api/purchases/${purchaseId}`);

      const result: PurchaseResponse = await response.json();

      if (!response.ok || !result.success || !result.purchase) {
        throw new Error(result.message || "Failed to fetch purchase");
      }

      setPurchase(result.purchase);
    } catch (error) {
      console.error("Failed to fetch purchase:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load purchase",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseId) {
      fetchPurchase();
    }
  }, [purchaseId]);

  if (loading) {
    return <div className="text-black">Loading purchase details...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() => router.push("/purchases")}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Purchases
        </button>
      </div>
    );
  }

  if (!purchase) {
    return <div className="text-gray-600">Purchase not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/purchases")}
            className="mb-3 text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Back to Purchases
          </button>

          <h1 className="text-3xl font-bold text-black">Purchase Details</h1>

          <p className="mt-1 text-sm text-gray-600">
            {purchase.purchaseNumber}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/purchases/${purchase.id}/return`)}
          className="rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          Return Items
        </button>
      </div>

      {/* SUPPLIER + PAYMENT */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SUPPLIER */}

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-bold text-black">Supplier Information</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Supplier Name</p>

              <p className="font-semibold text-black">
                {purchase.supplier.name}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>

              <p className="font-medium text-black">
                {purchase.supplier.email}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Phone</p>

              <p className="font-medium text-black">
                {purchase.supplier.phone || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Address</p>

              <p className="font-medium text-black">
                {purchase.supplier.address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* PAYMENT */}

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-bold text-black">Payment Information</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Payment Method</p>

              <p className="font-semibold text-black">
                {purchase.payment?.method || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Payment Status</p>

              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {purchase.payment?.status || "N/A"}
              </span>
            </div>

            <div>
              <p className="text-gray-500">Payment Amount</p>

              <p className="font-semibold text-black">
                ₹{purchase.payment?.amount.toFixed(2) || "0.00"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Purchase Date</p>

              <p className="font-medium text-black">
                {new Date(purchase.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PURCHASE ITEMS */}

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b bg-gray-50 px-6 py-5">
          <h2 className="text-lg font-bold text-black">Purchased Items</h2>

          <p className="mt-1 text-sm text-gray-500">
            Medicines included in this purchase.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3">Product</th>

                <th className="px-4 py-3">Batch</th>

                <th className="px-4 py-3 text-center">Purchased</th>

                <th className="px-4 py-3 text-center">Returned</th>

                <th className="px-4 py-3 text-center">Returnable</th>

                <th className="px-4 py-3 text-right">Unit Price</th>

                <th className="px-4 py-3 text-right">GST</th>

                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {purchase.items.map((item) => {
                const returnedQuantity = item.returnItems.reduce(
                  (total, returnItem) => total + returnItem.quantity,
                  0,
                );

                const returnableQuantity = item.quantity - returnedQuantity;

                return (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-black">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {item.product.genericName || "N/A"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">{item.batch.batchNumber}</p>

                      <p className="mt-1 text-xs text-gray-500">
                        Exp:{" "}
                        {new Date(item.batch.expiryDate).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-center font-semibold">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-4 text-center text-red-600 font-semibold">
                      {returnedQuantity}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          returnableQuantity > 0
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {returnableQuantity}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-right">{item.gst}%</td>

                    <td className="px-4 py-4 text-right font-semibold">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTAL SUMMARY */}

      <div className="ml-auto w-full rounded-lg border bg-white p-6 lg:w-96">
        <h2 className="text-lg font-bold text-black">Purchase Summary</h2>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>

            <span className="font-medium">₹{purchase.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>

            <span className="font-medium">₹{purchase.tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Discount</span>

            <span className="font-medium text-red-600">
              - ₹{purchase.discount.toFixed(2)}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold text-black">
              <span>Total Amount</span>

              <span>₹{purchase.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
