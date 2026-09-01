"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ReturnItem = {
  id: string;
  quantity: number;
};

type PurchaseItem = {
  id: string;
  quantity: number;
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

  returnItems: ReturnItem[];
};

type Purchase = {
  id: string;
  purchaseNumber: string;

  supplier: {
    id: string;
    name: string;
  };

  items: PurchaseItem[];
};

type PurchaseResponse = {
  success: boolean;
  purchase?: Purchase;
  message?: string;
};

type SelectedReturnItem = {
  purchaseItemId: string;
  quantity: number;
};

type PurchaseReturnResponse = {
  success: boolean;
  message?: string;
};

export default function PurchaseReturnPage() {
  const params = useParams();
  const router = useRouter();

  const purchaseId = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);

  const [selectedItems, setSelectedItems] = useState<SelectedReturnItem[]>([]);

  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

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

  const getReturnedQuantity = (item: PurchaseItem) => {
    return item.returnItems.reduce(
      (total, returnItem) => total + returnItem.quantity,
      0,
    );
  };

  const getReturnableQuantity = (item: PurchaseItem) => {
    return item.quantity - getReturnedQuantity(item);
  };

  const getSelectedQuantity = (purchaseItemId: string) => {
    const selectedItem = selectedItems.find(
      (item) => item.purchaseItemId === purchaseItemId,
    );

    return selectedItem?.quantity || 0;
  };

  const handleQuantityChange = (
    purchaseItemId: string,
    value: number,
    maxQuantity: number,
  ) => {
    let safeQuantity = value;

    if (!Number.isFinite(safeQuantity)) {
      safeQuantity = 0;
    }

    if (safeQuantity < 0) {
      safeQuantity = 0;
    }

    if (safeQuantity > maxQuantity) {
      safeQuantity = maxQuantity;
    }

    safeQuantity = Math.floor(safeQuantity);

    setSelectedItems((previousItems) => {
      if (safeQuantity === 0) {
        return previousItems.filter(
          (item) => item.purchaseItemId !== purchaseItemId,
        );
      }

      const existingItem = previousItems.find(
        (item) => item.purchaseItemId === purchaseItemId,
      );

      if (existingItem) {
        return previousItems.map((item) =>
          item.purchaseItemId === purchaseItemId
            ? {
                ...item,
                quantity: safeQuantity,
              }
            : item,
        );
      }

      return [
        ...previousItems,
        {
          purchaseItemId,
          quantity: safeQuantity,
        },
      ];
    });
  };

  const calculateTotalQuantity = () => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalRefund = () => {
    if (!purchase) return 0;

    return selectedItems.reduce((total, selectedItem) => {
      const purchaseItem = purchase.items.find(
        (item) => item.id === selectedItem.purchaseItemId,
      );

      if (!purchaseItem) {
        return total;
      }

      return total + purchaseItem.unitPrice * selectedItem.quantity;
    }, 0);
  };

  const handleProcessReturn = async () => {
    try {
      if (selectedItems.length === 0) {
        setError("Please select at least one item to return.");
        return;
      }

      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/purchases/${purchaseId}/returns`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          reason: reason.trim() || null,
          items: selectedItems,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to process purchase return");
      }

      console.log("Purchase return response:", result);

      setSuccess(result.message || "Purchase return processed successfully.");

      // Wait 2 seconds so the user can see the success message
      setTimeout(() => {
        router.replace(`/purchases/${purchaseId}`);
      }, 2000);
    } catch (error) {
      console.error("Failed to process purchase return:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to process purchase return",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-black">Loading purchase information...</div>;
  }

  if (!purchase) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error || "Purchase not found."}
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

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() => router.push(`/purchases/${purchaseId}`)}
          className="mb-3 text-sm font-medium text-gray-600 hover:text-black"
        >
          ← Back to Purchase Details
        </button>

        <h1 className="text-3xl font-bold text-black">Return Purchase Items</h1>

        <p className="mt-2 text-sm text-gray-600">
          Purchase: {purchase.purchaseNumber}
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          {success}
          <p className="mt-1 text-sm">Redirecting to purchase details...</p>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          {successMessage}

          <p className="mt-1 text-sm">Redirecting to purchase details...</p>
        </div>
      )}

      {/* SUPPLIER */}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-bold text-black">Supplier</h2>

        <p className="mt-2 text-sm text-gray-600">{purchase.supplier.name}</p>
      </div>

      {/* RETURN ITEMS */}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-bold text-black">Select Items to Return</h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter the quantity you want to return. You cannot return more than the
          available quantity.
        </p>

        <div className="mt-6 space-y-4">
          {purchase.items.map((item) => {
            const returnedQuantity = getReturnedQuantity(item);

            const returnableQuantity = getReturnableQuantity(item);

            const selectedQuantity = getSelectedQuantity(item.id);

            return (
              <div key={item.id} className="rounded-lg border bg-gray-50 p-5">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5 lg:items-end">
                  {/* PRODUCT */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">Product</p>

                    <p className="mt-1 font-semibold text-black">
                      {item.product.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {item.product.genericName || "N/A"}
                    </p>
                  </div>

                  {/* BATCH */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">Batch</p>

                    <p className="mt-1 font-semibold text-black">
                      {item.batch.batchNumber}
                    </p>

                    <p className="text-xs text-gray-500">
                      Exp:{" "}
                      {new Date(item.batch.expiryDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* PURCHASED */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Purchased
                    </p>

                    <p className="mt-1 text-lg font-bold text-black">
                      {item.quantity}
                    </p>
                  </div>

                  {/* ALREADY RETURNED */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Already Returned
                    </p>

                    <p className="mt-1 text-lg font-bold text-red-600">
                      {returnedQuantity}
                    </p>
                  </div>

                  {/* RETURN QUANTITY */}

                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Return Quantity
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={returnableQuantity}
                      value={selectedQuantity}
                      disabled={returnableQuantity === 0 || processing}
                      onChange={(event) =>
                        handleQuantityChange(
                          item.id,
                          Number(event.target.value),
                          returnableQuantity,
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-red-500 disabled:bg-gray-200"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      Available: {returnableQuantity}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RETURN SUMMARY */}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-bold text-black">Return Summary</h2>

        <p className="mt-2 text-sm text-gray-600">
          Selected items:{" "}
          <span className="font-bold">{selectedItems.length}</span>
        </p>

        <p className="mt-1 text-sm text-gray-600">
          Total quantity:{" "}
          <span className="font-bold">{calculateTotalQuantity()}</span>
        </p>

        {/* REASON */}

        <div className="mt-5">
          <label className="text-sm font-medium text-gray-700">
            Return Reason
          </label>

          <textarea
            value={reason}
            disabled={processing}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Enter the reason for returning these items..."
            rows={4}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-red-500 disabled:bg-gray-100"
          />
        </div>

        {/* REFUND */}

        <div className="mt-5 rounded-lg bg-red-50 p-4">
          <p className="text-sm font-medium text-gray-600">
            Estimated Refund Amount
          </p>

          <p className="mt-1 text-2xl font-bold text-red-600">
            ₹{calculateTotalRefund().toFixed(2)}
          </p>
        </div>
      </div>

      {/* BUTTONS */}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={processing}
          onClick={() => router.push(`/purchases/${purchaseId}`)}
          className="rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleProcessReturn}
          disabled={
            selectedItems.length === 0 || processing || successMessage !== ""
          }
          className="rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing Return..." : "Process Return"}
        </button>
      </div>
    </div>
  );
}
