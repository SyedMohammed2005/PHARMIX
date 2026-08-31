"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
};

type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  reorderPoint: number;
  maxStock: number | null;
  createdAt: string;
  updatedAt: string;

  product: InventoryProduct;
};

type InventorySummary = {
  totalProducts: number;
  totalInventoryItems: number;
  totalStockQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
};

type InventoryResponse = {
  success: boolean;
  count?: number;
  inventory?: InventoryItem[];
  message?: string;
};

type SummaryResponse = {
  success: boolean;
  summary?: InventorySummary;
  message?: string;
};

type LowStockResponse = {
  success: boolean;
  count?: number;
  lowStock?: InventoryItem[];
  message?: string;
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [summary, setSummary] =
    useState<InventorySummary | null>(null);

  const [lowStock, setLowStock] = useState<
    InventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        inventoryResponse,
        summaryResponse,
        lowStockResponse,
      ] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory/summary"),
        fetch("/api/inventory/low-stock"),
      ]);

      const inventoryResult: InventoryResponse =
        await inventoryResponse.json();

      const summaryResult: SummaryResponse =
        await summaryResponse.json();

      const lowStockResult: LowStockResponse =
        await lowStockResponse.json();

      if (
        !inventoryResponse.ok ||
        !inventoryResult.success
      ) {
        throw new Error(
          inventoryResult.message ||
            "Failed to fetch inventory"
        );
      }

      if (
        !summaryResponse.ok ||
        !summaryResult.success
      ) {
        throw new Error(
          summaryResult.message ||
            "Failed to fetch inventory summary"
        );
      }

      if (
        !lowStockResponse.ok ||
        !lowStockResult.success
      ) {
        throw new Error(
          lowStockResult.message ||
            "Failed to fetch low stock items"
        );
      }

      setInventory(
        inventoryResult.inventory || []
      );

      setSummary(
        summaryResult.summary || null
      );

      setLowStock(
        lowStockResult.lowStock || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch inventory data:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  if (loading) {
    return (
      <div className="text-black">
        Loading inventory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={fetchInventoryData}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Inventory Management
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Monitor medicine stock and inventory levels.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventoryData}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Refresh Inventory
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Products
          </p>

          <p className="mt-2 text-2xl font-bold text-black">
            {summary?.totalProducts ?? 0}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Inventory Records
          </p>

          <p className="mt-2 text-2xl font-bold text-black">
            {summary?.totalInventoryItems ?? 0}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Stock
          </p>

          <p className="mt-2 text-2xl font-bold text-black">
            {summary?.totalStockQuantity ?? 0}
          </p>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm text-orange-700">
            Low Stock
          </p>

          <p className="mt-2 text-2xl font-bold text-orange-900">
            {summary?.lowStockItems ?? 0}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-700">
            Out of Stock
          </p>

          <p className="mt-2 text-2xl font-bold text-red-900">
            {summary?.outOfStockItems ?? 0}
          </p>
        </div>

      </div>

      {/* LOW STOCK ALERT */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-orange-900">
              Low Stock Alerts
            </h2>

            <p className="mt-1 text-sm text-orange-700">
              Medicines that have reached their reorder point.
            </p>
          </div>

          <span className="rounded-full bg-orange-200 px-3 py-1 text-sm font-semibold text-orange-900">
            {lowStock.length}
          </span>
        </div>

        {lowStock.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            🎉 No low stock medicines found.
          </p>
        ) : (
          <div className="mt-4 space-y-3">

            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-black">
                    {item.product.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    SKU: {item.product.sku}
                  </p>
                </div>

                <div className="text-sm">
                  <p>
                    Stock:{" "}
                    <span className="font-bold text-orange-700">
                      {item.quantity}
                    </span>
                  </p>

                  <p className="text-gray-500">
                    Reorder Point: {item.reorderPoint}
                  </p>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* INVENTORY TABLE */}
      <div className="overflow-hidden rounded-lg border bg-white">

        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-bold text-black">
              All Inventory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {inventory.length} inventory item(s)
            </p>
          </div>
        </div>

        {inventory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No inventory records found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b bg-gray-50">

                <tr>
                  <th className="px-5 py-3">
                    Medicine
                  </th>

                  <th className="px-5 py-3">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-center">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-center">
                    Reorder Point
                  </th>

                  <th className="px-5 py-3 text-center">
                    Maximum Stock
                  </th>

                  <th className="px-5 py-3 text-center">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {inventory.map((item) => {
                  const isOutOfStock =
                    item.quantity === 0;

                  const isLowStock =
                    item.quantity <=
                    item.reorderPoint;

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >

                      <td className="px-5 py-4 font-medium text-black">
                        {item.product.name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.product.sku}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {item.reorderPoint}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {item.maxStock ?? "N/A"}
                      </td>

                      <td className="px-5 py-4 text-center">

                        {isOutOfStock ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            In Stock
                          </span>
                        )}

                      </td>

                      <td className="px-5 py-4 text-right">

                        <Link
                          href={`/inventory/${item.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View →
                        </Link>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}