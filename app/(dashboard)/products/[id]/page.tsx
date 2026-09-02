"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Package,
  Barcode,
  Tag,
  Building2,
  IndianRupee,
  FileText,
  Pill,
  RefreshCw,
  ShieldCheck,
  Pencil,
} from "lucide-react";

type UserRole =
  | "ADMIN"
  | "PHARMACIST"
  | "INVENTORY_MANAGER"
  | "BUSINESS_ANALYST";

type Product = {
  id: string;
  name: string;
  genericName: string | null;
  brand: string | null;
  sku: string;
  barcode: string | null;

  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gst: number;

  requiresPrescription: boolean;

  category: {
    id: string;
    name: string;
  };

  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };

  createdAt: string;
  updatedAt: string;
};

type ProductResponse = {
  success: boolean;
  product?: Product;
  message?: string;
};

type CurrentUserResponse = {
  success: boolean;

  user?: {
    id: string;
    role: UserRole;
  };

  message?: string;
};

export default function ProductDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const productId = params.id as string;

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [currentUserRole, setCurrentUserRole] =
    useState<UserRole | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `/api/products/${productId}`,
      );

      const result: ProductResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.product
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch product",
        );
      }

      setProduct(result.product);
    } catch (error) {
      console.error(
        "Failed to fetch product:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load product",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(
        "/api/auth/me",
      );

      const result: CurrentUserResponse =
        await response.json();

      if (
        response.ok &&
        result.success &&
        result.user
      ) {
        setCurrentUserRole(
          result.user.role,
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error,
      );
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }

    fetchCurrentUser();
  }, [productId]);

  const canEdit =
    currentUserRole === "ADMIN" ||
    currentUserRole === "INVENTORY_MANAGER";

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/products")
          }
          className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <p className="text-gray-600">
          Product not found.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* BACK BUTTON */}

      <div className="flex items-center justify-between gap-4">

        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Products
        </Link>

        {/* ROLE-BASED EDIT BUTTON */}

        {canEdit && (
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Pencil className="h-4 w-4" />

            Edit Product
          </Link>
        )}

      </div>


      {/* HEADER */}

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-start gap-4">

            <div className="rounded-xl bg-emerald-600 p-3 text-white">
              <Package className="h-8 w-8" />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {product.name}
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                {product.genericName ||
                  "Generic name not available"}
              </p>

              {product.brand && (
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {product.brand}
                </p>
              )}

            </div>

          </div>


          {/* PRESCRIPTION BADGE */}

          <div>

            {product.requiresPrescription ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                <ShieldCheck className="h-4 w-4" />

                Prescription Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />

                No Prescription Required
              </span>
            )}

          </div>

        </div>

      </div>


      {/* PRODUCT INFORMATION */}

      <div className="grid gap-6 lg:grid-cols-2">


        {/* BASIC INFORMATION */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-2">

            <Pill className="h-5 w-5 text-emerald-600" />

            <h2 className="text-lg font-bold text-gray-900">
              Product Information
            </h2>

          </div>


          <div className="space-y-5">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Product Name
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {product.name}
              </p>
            </div>


            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Generic Name
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {product.genericName || "N/A"}
              </p>
            </div>


            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Brand
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {product.brand || "N/A"}
              </p>
            </div>


            <div className="flex items-start gap-3">

              <Tag className="mt-1 h-4 w-4 text-emerald-600" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  SKU
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {product.sku}
                </p>
              </div>

            </div>


            <div className="flex items-start gap-3">

              <Barcode className="mt-1 h-4 w-4 text-emerald-600" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Barcode
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {product.barcode || "N/A"}
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* CATEGORY AND SUPPLIER */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-2">

            <Building2 className="h-5 w-5 text-emerald-600" />

            <h2 className="text-lg font-bold text-gray-900">
              Category & Supplier
            </h2>

          </div>


          <div className="space-y-6">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Category
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {product.category.name}
              </p>

            </div>


            <div className="border-t pt-5">

              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Supplier
              </p>

              <p className="mt-2 text-lg font-semibold text-gray-900">
                {product.supplier.name}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {product.supplier.email ||
                  "No email available"}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {product.supplier.phone ||
                  "No phone available"}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* PRICING */}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-2">

          <IndianRupee className="h-5 w-5 text-emerald-600" />

          <h2 className="text-lg font-bold text-gray-900">
            Pricing Information
          </h2>

        </div>


        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">


          {/* PURCHASE PRICE */}

          <div className="rounded-xl bg-gray-50 p-5">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Purchase Price
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              ₹{product.purchasePrice.toFixed(2)}
            </p>

          </div>


          {/* SELLING PRICE */}

          <div className="rounded-xl bg-emerald-50 p-5">

            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Selling Price
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-700">
              ₹{product.sellingPrice.toFixed(2)}
            </p>

          </div>


          {/* MRP */}

          <div className="rounded-xl bg-blue-50 p-5">

            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
              MRP
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-700">
              ₹{product.mrp.toFixed(2)}
            </p>

          </div>


          {/* GST */}

          <div className="rounded-xl bg-amber-50 p-5">

            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              GST
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-700">
              {product.gst}%
            </p>

          </div>

        </div>

      </div>


      {/* SYSTEM INFORMATION */}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-2">

          <FileText className="h-5 w-5 text-emerald-600" />

          <h2 className="text-lg font-bold text-gray-900">
            System Information
          </h2>

        </div>


        <div className="grid gap-5 md:grid-cols-3">

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Product ID
            </p>

            <p className="mt-2 break-all text-sm font-medium text-gray-800">
              {product.id}
            </p>

          </div>


          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Created
            </p>

            <p className="mt-2 text-sm font-medium text-gray-800">
              {new Date(
                product.createdAt,
              ).toLocaleString("en-IN")}
            </p>

          </div>


          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last Updated
            </p>

            <p className="mt-2 text-sm font-medium text-gray-800">
              {new Date(
                product.updatedAt,
              ).toLocaleString("en-IN")}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}