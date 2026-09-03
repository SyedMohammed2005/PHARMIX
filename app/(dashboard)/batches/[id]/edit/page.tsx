"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Save,
  RefreshCw,
} from "lucide-react";

type Batch = {
  id: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;

  product: {
    id: string;
    name: string;
    sku: string;
  };
};

type BatchResponse = {
  success: boolean;
  batch?: Batch;
  message?: string;
};

export default function EditBatchPage() {
  const params = useParams();

  const router = useRouter();

  const id = params.id as string;

  const [batchNumber, setBatchNumber] =
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

  const [productName, setProductName] =
    useState("");

  const [productSku, setProductSku] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchBatch = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `/api/batches/${id}`,
      );

      const result: BatchResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.batch
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch batch",
        );
      }

      const batch = result.batch;

      setBatchNumber(batch.batchNumber);

      setManufactureDate(
        new Date(batch.manufactureDate)
          .toISOString()
          .split("T")[0],
      );

      setExpiryDate(
        new Date(batch.expiryDate)
          .toISOString()
          .split("T")[0],
      );

      setQuantity(String(batch.quantity));

      setPurchasePrice(
        String(batch.purchasePrice),
      );

      setSellingPrice(
        String(batch.sellingPrice),
      );

      setProductName(batch.product.name);

      setProductSku(batch.product.sku);
    } catch (error) {
      console.error(
        "Failed to fetch batch:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load batch",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBatch();
    }
  }, [id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/batches/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            batchNumber,
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update batch",
        );
      }

      router.push(`/batches/${id}`);

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to update batch:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update batch",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">

          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading batch information...
          </p>

        </div>
      </div>
    );
  }

  if (error && !batchNumber) {
    return (
      <div className="p-6">

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>

        <Link
          href="/batches"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Batches
        </Link>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* BACK */}

      <Link
        href={`/batches/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to Batch Details
      </Link>

      {/* HEADER */}

      <div className="mb-8 flex items-center gap-4">

        <div className="rounded-2xl bg-emerald-100 p-4">

          <Boxes className="h-8 w-8 text-emerald-600" />

        </div>

        <div>

          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Edit Batch
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Update batch information, quantity, and pricing
          </p>

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
          className="space-y-8"
        >

          {/* PRODUCT INFORMATION */}

          <div>

            <h2 className="text-lg font-bold text-gray-800">
              Product Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The product cannot be changed after batch creation
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <div className="rounded-xl bg-gray-50 p-4">

                <p className="text-xs font-medium uppercase text-gray-500">
                  Product
                </p>

                <p className="mt-2 font-bold text-gray-800">
                  {productName}
                </p>

              </div>

              <div className="rounded-xl bg-gray-50 p-4">

                <p className="text-xs font-medium uppercase text-gray-500">
                  SKU
                </p>

                <p className="mt-2 font-bold text-gray-800">
                  {productSku}
                </p>

              </div>

            </div>

          </div>

          {/* BATCH INFORMATION */}

          <div className="border-t border-gray-100 pt-8">

            <h2 className="text-lg font-bold text-gray-800">
              Batch Information
            </h2>

            <div className="mt-5">

              <label className="text-sm font-semibold text-gray-700">
                Batch Number
              </label>

              <input
                type="text"
                value={batchNumber}
                onChange={(event) =>
                  setBatchNumber(event.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

            </div>

          </div>

          {/* DATES */}

          <div className="border-t border-gray-100 pt-8">

            <h2 className="text-lg font-bold text-gray-800">
              Manufacturing & Expiry
            </h2>

            <div className="mt-5 grid gap-6 md:grid-cols-2">

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

          </div>

          {/* STOCK & PRICING */}

          <div className="border-t border-gray-100 pt-8">

            <h2 className="text-lg font-bold text-gray-800">
              Stock & Pricing
            </h2>

            <div className="mt-5 grid gap-6 md:grid-cols-3">

              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

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
                  required
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

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
                  required
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

            <Link
              href={`/batches/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Save className="h-4 w-4" />

              {submitting
                ? "Updating Batch..."
                : "Update Batch"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}