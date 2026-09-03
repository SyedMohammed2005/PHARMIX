"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Save,
  Package,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
};

type ProductsResponse = {
  success: boolean;
  products?: Product[];
  message?: string;
};

export default function NewBatchPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);

  const [batchNumber, setBatchNumber] =
    useState("");

  const [productId, setProductId] =
    useState("");

  const [manufactureDate, setManufactureDate] =
    useState("");

  const [expiryDate, setExpiryDate] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [purchasePrice, setPurchasePrice] =
    useState("");

  const [sellingPrice, setSellingPrice] =
    useState("");

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await fetch("/api/products");

      const result: ProductsResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.products
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch products",
        );
      }

      setProducts(result.products);
    } catch (error) {
      console.error(
        "Failed to fetch products:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products",
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/batches",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            batchNumber,
            productId,
            manufactureDate,
            expiryDate,
            quantity: Number(quantity),
            purchasePrice:
              Number(purchasePrice),
            sellingPrice:
              Number(sellingPrice),
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create batch",
        );
      }
router.replace("/batches");
    } catch (error) {
      console.error(
        "Failed to create batch:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create batch",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* HEADER */}

      <div className="mb-8">

        <Link
          href="/batches"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Batches
        </Link>

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-emerald-100 p-3">

            <Boxes className="h-7 w-7 text-emerald-600" />

          </div>

          <div>

            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
              Add New Batch
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Add medicine batch information and expiry details
            </p>

          </div>

        </div>

      </div>

      {/* ERROR */}

      {error && (

        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          {error}

        </div>

      )}

      {/* FORM */}

      <div className="max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* BATCH INFORMATION */}

          <div>

            <h2 className="text-lg font-bold text-gray-800">
              Batch Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the basic details of the medicine batch
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* BATCH NUMBER */}

            <div>

              <label className="text-sm font-semibold text-gray-700">

                Batch Number

              </label>

              <input
                type="text"
                value={batchNumber}
                onChange={(event) =>
                  setBatchNumber(
                    event.target.value,
                  )
                }
                placeholder="Example: PCM-2026-001"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

            {/* PRODUCT */}

            <div>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">

                <Package className="h-4 w-4 text-emerald-600" />

                Product

              </label>

              <select
                value={productId}
                onChange={(event) =>
                  setProductId(
                    event.target.value,
                  )
                }
                required
                disabled={loadingProducts}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >

                <option value="">

                  {loadingProducts
                    ? "Loading products..."
                    : "Select a product"}

                </option>

                {products.map((product) => (

                  <option
                    key={product.id}
                    value={product.id}
                  >

                    {product.name} ({product.sku})

                  </option>

                ))}

              </select>

            </div>

          </div>

          {/* DATES */}

          <div>

            <h2 className="text-lg font-bold text-gray-800">
              Dates
            </h2>

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* MANUFACTURE DATE */}

            <div>

              <label className="text-sm font-semibold text-gray-700">

                Manufacture Date

              </label>

              <input
                type="date"
                value={manufactureDate}
                onChange={(event) =>
                  setManufactureDate(
                    event.target.value,
                  )
                }
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

            {/* EXPIRY DATE */}

            <div>

              <label className="text-sm font-semibold text-gray-700">

                Expiry Date

              </label>

              <input
                type="date"
                value={expiryDate}
                onChange={(event) =>
                  setExpiryDate(
                    event.target.value,
                  )
                }
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

          </div>

          {/* STOCK AND PRICING */}

          <div>

            <h2 className="text-lg font-bold text-gray-800">
              Stock & Pricing
            </h2>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* QUANTITY */}

            <div>

              <label className="text-sm font-semibold text-gray-700">

                Quantity

              </label>

              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
                placeholder="Enter quantity"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

            {/* PURCHASE PRICE */}

            <div>

              <label className="text-sm font-semibold text-gray-700">

                Purchase Price

              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(event) =>
                  setPurchasePrice(
                    event.target.value,
                  )
                }
                placeholder="Enter purchase price"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

            {/* SELLING PRICE */}

            <div>

              <label className="text-sm font-semibold text-gray-700">

                Selling Price

              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(event) =>
                  setSellingPrice(
                    event.target.value,
                  )
                }
                placeholder="Enter selling price"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

            <Link
              href="/batches"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingProducts
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Save className="h-4 w-4" />

              {submitting
                ? "Creating Batch..."
                : "Create Batch"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}