"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Inventory = {
  id: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number | null;
  reorderPoint: number;

  createdAt: string;
  updatedAt: string;

  product: {
    id: string;
    name: string;
    genericName: string | null;
    brand: string | null;
    sku: string;
    barcode: string | null;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number | null;
    gst: number;
    requiresPrescription: boolean;

    category: {
      id: string;
      name: string;
    } | null;

    supplier: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
    } | null;
  };
};

type InventoryResponse = {
  success: boolean;
  inventory?: Inventory;
  message?: string;
};

export default function InventoryDetailsPage() {
  const params = useParams();

  const inventoryId = params.id as string;

  const [inventory, setInventory] =
    useState<Inventory | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/inventory/${inventoryId}`
      );

      const result: InventoryResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.inventory
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch inventory details"
        );
      }

      setInventory(result.inventory);
    } catch (error) {
      console.error(
        "Failed to fetch inventory details:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inventoryId) {
      fetchInventory();
    }
  }, [inventoryId]);

  // Loading state
  if (loading) {
    return (
      <div className="text-black">
        Loading inventory details...
      </div>
    );
  }

  // Error state
  if (error || !inventory) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error || "Inventory not found."}
        </div>

        <Link
          href="/inventory"
          className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  const getStockStatus = () => {
    if (inventory.quantity === 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-100 text-red-700 border-red-200",
      };
    }

    if (
      inventory.quantity <=
      inventory.reorderPoint
    ) {
      return {
        label: "Low Stock",
        className:
          "bg-orange-100 text-orange-700 border-orange-200",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-green-100 text-green-700 border-green-200",
    };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-black">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/inventory"
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Back to Inventory
          </Link>

          <h1 className="mt-3 text-3xl font-bold">
            Inventory Details
          </h1>

          <p className="mt-1 text-gray-600">
            Complete stock and medicine information.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${stockStatus.className}`}
        >
          {stockStatus.label}
        </span>
      </div>

      {/* STOCK SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Current Stock
          </p>

          <p className="mt-2 text-3xl font-bold">
            {inventory.quantity}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Minimum Stock
          </p>

          <p className="mt-2 text-3xl font-bold">
            {inventory.minimumStock}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Reorder Point
          </p>

          <p className="mt-2 text-3xl font-bold">
            {inventory.reorderPoint}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Maximum Stock
          </p>

          <p className="mt-2 text-3xl font-bold">
            {inventory.maximumStock ?? "Not Set"}
          </p>
        </div>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="border-b pb-3 text-xl font-bold">
          Medicine Information
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">
              Medicine Name
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Generic Name
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.genericName ||
                "Not Available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Brand
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.brand ||
                "Not Available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              SKU
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.sku}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Barcode
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.barcode ||
                "Not Available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Prescription Required
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.requiresPrescription
                ? "Yes"
                : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="border-b pb-3 text-xl font-bold">
          Pricing Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">
              Purchase Price
            </p>

            <p className="mt-1 text-lg font-bold">
              ₹
              {inventory.product.purchasePrice.toFixed(
                2
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Selling Price
            </p>

            <p className="mt-1 text-lg font-bold">
              ₹
              {inventory.product.sellingPrice.toFixed(
                2
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              MRP
            </p>

            <p className="mt-1 text-lg font-bold">
              {inventory.product.mrp !== null
                ? `₹${inventory.product.mrp.toFixed(2)}`
                : "Not Available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              GST
            </p>

            <p className="mt-1 text-lg font-bold">
              {inventory.product.gst}%
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY + SUPPLIER */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CATEGORY */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="border-b pb-3 text-xl font-bold">
            Category
          </h2>

          <div className="mt-5">
            <p className="text-sm text-gray-500">
              Category Name
            </p>

            <p className="mt-1 font-semibold">
              {inventory.product.category?.name ||
                "Not Available"}
            </p>
          </div>
        </div>

        {/* SUPPLIER */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="border-b pb-3 text-xl font-bold">
            Supplier Information
          </h2>

          {inventory.product.supplier ? (
            <div className="mt-5 space-y-3">
              <div>
                <p className="text-sm text-gray-500">
                  Supplier Name
                </p>

                <p className="mt-1 font-semibold">
                  {inventory.product.supplier.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Phone
                </p>

                <p className="mt-1 font-semibold">
                  {inventory.product.supplier.phone ||
                    "Not Available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Email
                </p>

                <p className="mt-1 font-semibold">
                  {inventory.product.supplier.email ||
                    "Not Available"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-gray-500">
              Supplier information is not available.
            </p>
          )}
        </div>
      </div>

      {/* INVENTORY INFORMATION */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="border-b pb-3 text-xl font-bold">
          Inventory Record Information
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Created At
            </p>

            <p className="mt-1 font-semibold">
              {new Date(
                inventory.createdAt
              ).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Last Updated
            </p>

            <p className="mt-1 font-semibold">
              {new Date(
                inventory.updatedAt
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}