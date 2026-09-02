"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

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
  };
};

type ProductsResponse = {
  success: boolean;
  products?: Product[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  message?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchProducts = async (
    searchValue = search,
    pageValue = page,
  ) => {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      params.set("page", String(pageValue));

      params.set("limit", "10");

      if (searchValue.trim()) {
        params.set(
          "search",
          searchValue.trim(),
        );
      }

      const response = await fetch(
        `/api/products?${params.toString()}`,
      );

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

      if (result.pagination) {
        setPagination(result.pagination);
      }
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleSearch = async () => {
    try {
      setSearching(true);

      setPage(1);

      await fetchProducts(search, 1);
    } finally {
      setSearching(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800 md:text-3xl">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Package className="h-6 w-6 text-emerald-600 md:h-7 md:w-7" />
            </div>

            Products
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage pharmacy products and product information
          </p>
        </div>

        {/* CREATE PRODUCT */}

        <Link
          href="/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4" />

          Add Product
        </Link>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SEARCH */}

      <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row">

          <div className="flex-1">

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Search className="h-4 w-4 text-emerald-600" />

              Search Products
            </label>

            <div className="relative mt-2">

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search by product name..."
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            </div>

          </div>

          <div className="flex items-end">

            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />

                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />

                  Search
                </>
              )}
            </button>

          </div>

        </div>

      </div>

      {/* PRODUCTS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">

        <div className="border-b bg-emerald-50/50 px-5 py-4">

          <h2 className="font-bold text-gray-800">
            Product List
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {products.length} of {pagination.total} products
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Product
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  SKU
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Category
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">
                  Supplier
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                  Purchase Price
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                  Selling Price
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                  Prescription
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {products.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center"
                  >

                    <Package className="mx-auto h-10 w-10 text-gray-300" />

                    <p className="mt-3 font-medium text-gray-600">
                      No products found
                    </p>

                  </td>

                </tr>

              ) : (

                products.map((product) => (

                  <tr
                    key={product.id}
                    className="cursor-pointer transition hover:bg-emerald-50/40"
                  >

                    <td className="px-4 py-4">

                      <Link
                        href={`/products/${product.id}`}
                        className="block"
                      >

                        <p className="font-semibold text-gray-800 hover:text-emerald-700">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {product.genericName ||
                            product.brand ||
                            "No additional information"}
                        </p>

                      </Link>

                    </td>

                    <td className="px-4 py-4">

                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {product.sku}
                      </span>

                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {product.category.name}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {product.supplier.name}
                    </td>

                    <td className="px-4 py-4 text-right font-medium text-gray-700">
                      ₹{product.purchasePrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-emerald-700">
                      ₹{product.sellingPrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-center">

                      {product.requiresPrescription ? (

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Required
                        </span>

                      ) : (

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Not Required
                        </span>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex flex-col items-center justify-between gap-4 border-t px-5 py-4 sm:flex-row">

          <p className="text-sm text-gray-600">

            Page{" "}

            <span className="font-semibold text-gray-800">
              {pagination.page}
            </span>

            {" "}of{" "}

            <span className="font-semibold text-gray-800">
              {pagination.totalPages}
            </span>

          </p>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />

              Previous
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={
                page >= pagination.totalPages
              }
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next

              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}