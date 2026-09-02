"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Save,
  RefreshCw,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
};

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

  categoryId: string;
  supplierId: string;

  category: Category;
  supplier: Supplier;
};

type ProductResponse = {
  success: boolean;
  product?: Product;
  message?: string;
};

type CategoriesResponse = {
  success: boolean;
  categories?: Category[];
  message?: string;
};

type SuppliersResponse = {
  success: boolean;
  suppliers?: Supplier[];
  message?: string;
};

export default function EditProductPage() {
  const params = useParams();

  const router = useRouter();

  const productId = params.id as string;

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [suppliers, setSuppliers] = useState<
    Supplier[]
  >([]);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    brand: "",
    sku: "",
    barcode: "",

    purchasePrice: "",
    sellingPrice: "",
    mrp: "",
    gst: "",

    requiresPrescription: false,

    categoryId: "",
    supplierId: "",
  });

  // ----------------------------------
  // FETCH PRODUCT
  // ----------------------------------

  const fetchProduct = async () => {
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

    const product = result.product;

    setFormData({
      name: product.name,
      genericName:
        product.genericName || "",
      brand: product.brand || "",
      sku: product.sku,
      barcode: product.barcode || "",

      purchasePrice:
        String(product.purchasePrice),

      sellingPrice:
        String(product.sellingPrice),

      mrp:
        String(product.mrp),

      gst:
        String(product.gst),

      requiresPrescription:
        product.requiresPrescription,

      categoryId:
        product.categoryId,

      supplierId:
        product.supplierId,
    });
  };

  // ----------------------------------
  // FETCH CATEGORIES
  // ----------------------------------

  const fetchCategories = async () => {
    const response = await fetch(
      "/api/categories",
    );

    const result: CategoriesResponse =
      await response.json();

    if (
      !response.ok ||
      !result.success ||
      !result.categories
    ) {
      throw new Error(
        result.message ||
          "Failed to fetch categories",
      );
    }

    setCategories(result.categories);
  };

  // ----------------------------------
  // FETCH SUPPLIERS
  // ----------------------------------

  const fetchSuppliers = async () => {
    const response = await fetch(
      "/api/suppliers",
    );

    const result: SuppliersResponse =
      await response.json();

    if (
      !response.ok ||
      !result.success ||
      !result.suppliers
    ) {
      throw new Error(
        result.message ||
          "Failed to fetch suppliers",
      );
    }

    setSuppliers(result.suppliers);
  };

  // ----------------------------------
  // LOAD DATA
  // ----------------------------------

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        setError("");

        await Promise.all([
          fetchProduct(),
          fetchCategories(),
          fetchSuppliers(),
        ]);
      } catch (error) {
        console.error(
          "Failed to load product data:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load product data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId]);

  // ----------------------------------
  // INPUT CHANGE
  // ----------------------------------

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
      type,
    } = event.target;

    if (type === "checkbox") {
      const target =
        event.target as HTMLInputElement;

      setFormData((previous) => ({
        ...previous,
        [name]: target.checked,
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ----------------------------------
  // SUBMIT
  // ----------------------------------

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    try {
      setSaving(true);

      setError("");

      const response = await fetch(
        `/api/products/${productId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: formData.name,

            genericName:
              formData.genericName.trim() ||
              undefined,

            brand:
              formData.brand.trim() ||
              undefined,

            sku: formData.sku,

            barcode:
              formData.barcode.trim() ||
              undefined,

            purchasePrice:
              Number(
                formData.purchasePrice,
              ),

            sellingPrice:
              Number(
                formData.sellingPrice,
              ),

            mrp:
              Number(formData.mrp),

            gst:
              Number(formData.gst),

            requiresPrescription:
              formData.requiresPrescription,

            categoryId:
              formData.categoryId,

            supplierId:
              formData.supplierId,
          }),
        },
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to update product",
        );
      }

      router.push(
        `/products/${productId}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to update product:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product",
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------
  // LOADING
  // ----------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------
  // PAGE
  // ----------------------------------

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* BACK BUTTON */}

      <Link
        href={`/products/${productId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to Product Details
      </Link>

      {/* HEADER */}

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">

        <div className="flex items-center gap-4">

          <div className="rounded-xl bg-emerald-600 p-3 text-white">
            <Package className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Update product information and pricing.
            </p>
          </div>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* BASIC INFORMATION */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Basic Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-gray-700">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Generic Name
              </label>

              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Brand
              </label>

              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                SKU
              </label>

              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Barcode
              </label>

              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

          </div>

        </div>

        {/* CATEGORY AND SUPPLIER */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Category & Supplier
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Supplier
              </label>

              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">
                  Select supplier
                </option>

                {suppliers.map(
                  (supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ),
                )}
              </select>
            </div>

          </div>

        </div>

        {/* PRICING */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Pricing Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="text-sm font-medium text-gray-700">
                Purchase Price
              </label>

              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Selling Price
              </label>

              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                MRP
              </label>

              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                GST (%)
              </label>

              <input
                type="number"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

          </div>

        </div>

        {/* PRESCRIPTION */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <label className="flex cursor-pointer items-center gap-3">

            <input
              type="checkbox"
              name="requiresPrescription"
              checked={
                formData.requiresPrescription
              }
              onChange={handleChange}
              className="h-5 w-5 accent-emerald-600"
            />

            <div>
              <p className="font-semibold text-gray-900">
                Prescription Required
              </p>

              <p className="text-sm text-gray-500">
                Enable this if the product requires a prescription.
              </p>
            </div>

          </label>

        </div>

        {/* ACTIONS */}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

          <Link
            href={`/products/${productId}`}
            className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />

                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Save Changes
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
}