"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  PackagePlus,
  Save,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
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

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    brand: "",
    sku: "",
    barcode: "",
    purchasePrice: "",
    sellingPrice: "",
    mrp: "",
    gst: "0",
    requiresPrescription: false,
    categoryId: "",
    supplierId: "",
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const [
          categoriesResponse,
          suppliersResponse,
        ] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/suppliers"),
        ]);

        const categoriesResult: CategoriesResponse =
          await categoriesResponse.json();

        const suppliersResult: SuppliersResponse =
          await suppliersResponse.json();

        if (
          !categoriesResponse.ok ||
          !categoriesResult.success
        ) {
          throw new Error(
            categoriesResult.message ||
              "Failed to fetch categories",
          );
        }

        if (
          !suppliersResponse.ok ||
          !suppliersResult.success
        ) {
          throw new Error(
            suppliersResult.message ||
              "Failed to fetch suppliers",
          );
        }

        setCategories(
          categoriesResult.categories || [],
        );

        setSuppliers(
          suppliersResult.suppliers || [],
        );
      } catch (error) {
        console.error(
          "Failed to load product form data:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load form data",
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchFormData();
  }, []);

  const handleChange = (
    event:
      | React.ChangeEvent<
          HTMLInputElement
        >
      | React.ChangeEvent<
          HTMLSelectElement
        >,
  ) => {
    const {
      name,
      value,
      type,
    } = event.target;

    if (type === "checkbox") {
      const checked = (
        event.target as HTMLInputElement
      ).checked;

      setFormData((previousData) => ({
        ...previousData,
        [name]: checked,
      }));

      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      setError("");

      setSuccessMessage("");

      const response = await fetch(
        "/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: formData.name.trim(),

            genericName:
              formData.genericName.trim() ||
              undefined,

            brand:
              formData.brand.trim() ||
              undefined,

            sku:
              formData.sku.trim(),

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
            "Failed to create product",
        );
      }

      setSuccessMessage(
        "Product created successfully!",
      );

      setTimeout(() => {
        router.replace("/products");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(
        "Failed to create product:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create product",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm text-gray-600">
            Loading product form...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() =>
            router.push("/products")
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} />

          Back to Products
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3">
            <PackagePlus className="h-7 w-7 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Product
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Add a new medicine or pharmacy product
              to Pharmix.
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

      {/* SUCCESS */}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {successMessage}
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
                Product Name *
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Paracetamol 500mg"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                placeholder="Paracetamol"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                placeholder="Brand name"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                SKU *
              </label>

              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                placeholder="PARA-500-001"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                placeholder="Optional barcode"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
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
                Purchase Price *
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Selling Price *
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                MRP *
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                GST (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* CATEGORY AND SUPPLIER */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Product Classification
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>

              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500"
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
                Supplier *
              </label>

              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-emerald-500"
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

          {/* PRESCRIPTION */}

          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">

            <input
              type="checkbox"
              name="requiresPrescription"
              checked={
                formData.requiresPrescription
              }
              onChange={handleChange}
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-semibold text-gray-800">
                Requires Prescription
              </p>

              <p className="text-xs text-gray-500">
                Enable this if the medicine requires
                a doctor's prescription.
              </p>
            </div>

          </label>

        </div>

        {/* ACTIONS */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={() =>
              router.push("/products")
            }
            disabled={submitting}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Creating Product...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Create Product
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
}