"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
ArrowLeft,
Boxes,
CalendarDays,
Package,
Pencil,
RefreshCw,
IndianRupee,
Hash,
Trash2,
} from "lucide-react";

type UserRole =
| "ADMIN"
| "PHARMACIST"
| "INVENTORY_MANAGER"
| "BUSINESS_ANALYST";

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

type CurrentUserResponse = {
success: boolean;

user?: {
id: string;
role: UserRole;
};

message?: string;
};

type DeleteBatchResponse = {
success: boolean;
message?: string;
};

export default function BatchDetailsPage() {
const params = useParams();
const router = useRouter();

const id = params.id as string;

const [batch, setBatch] =
useState<Batch | null>(null);

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState("");

const [deleting, setDeleting] =
useState(false);

const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [currentUserRole, setCurrentUserRole] =
useState<UserRole | null>(null);

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

  setBatch(result.batch);
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
const handleDelete = async () => {
  try {
    setDeleting(true);

    setError("");

    const response = await fetch(
      `/api/batches/${id}`,
      {
        method: "DELETE",
      },
    );

    const result = await response.json();

    // Batch cannot be deleted because it has purchase records
    if (response.status === 409) {
      setShowDeleteModal(false);
      setError(
        result.message ||
          "This batch cannot be deleted because it is associated with purchase records.",
      );

      return;
    }

    // Other errors
    if (!response.ok || !result.success) {
      setError(
        result.message ||
          "Failed to delete batch",
      );

      return;
    }

    // Successful deletion
    router.push("/batches");

    router.refresh();
  } catch (error) {
    console.error(
      "Failed to delete batch:",
      error,
    );

    setError(
      "Something went wrong while deleting the batch.",
    );
  } finally {
    setDeleting(false);
  }
};
useEffect(() => {
if (id) {
fetchBatch();
fetchCurrentUser();
}
}, [id]);

const getBatchStatus = (
expiryDate: string,
) => {
const today = new Date();


today.setHours(0, 0, 0, 0);

const expiry = new Date(expiryDate);

expiry.setHours(0, 0, 0, 0);

const thirtyDaysFromNow =
  new Date(today);

thirtyDaysFromNow.setDate(
  thirtyDaysFromNow.getDate() + 30,
);

if (expiry < today) {
  return {
    label: "Expired",
    className:
      "bg-red-100 text-red-700",
  };
}

if (expiry <= thirtyDaysFromNow) {
  return {
    label: "Expiring Soon",
    className:
      "bg-amber-100 text-amber-700",
  };
}

return {
  label: "Active",
  className:
    "bg-emerald-100 text-emerald-700",
};


};

const canManageBatch =
currentUserRole === "ADMIN" ||
currentUserRole === "INVENTORY_MANAGER";

if (loading) {
return ( <div className="flex min-h-[400px] items-center justify-center"> <div className="text-center"> <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />


      <p className="mt-3 text-sm text-gray-600">
        Loading batch details...
      </p>
    </div>
  </div>
);


}

if (error || !batch) {
return ( <div className="p-6"> <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
{error || "Batch not found"} </div>

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

const status = getBatchStatus(
batch.expiryDate,
);

return ( <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 md:p-6 lg:p-8">


  {/* BACK */}

  <Link
    href="/batches"
    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
  >
    <ArrowLeft className="h-4 w-4" />

    Back to Batches
  </Link>

  {/* ERROR */}

  {error && (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  )}

  {/* HEADER */}

  <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

    <div className="flex items-center gap-4">

      <div className="rounded-2xl bg-emerald-100 p-4">
        <Boxes className="h-8 w-8 text-emerald-600" />
      </div>

      <div>

        <div className="flex flex-wrap items-center gap-3">

          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Batch Details
          </h1>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>

        </div>

        <p className="mt-2 text-sm text-gray-600">
          Complete information about this medicine batch
        </p>

      </div>

    </div>

    {/* ACTION BUTTONS */}

    {canManageBatch && (
      <div className="flex flex-col gap-3 sm:flex-row">

        <Link
          href={`/batches/${batch.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700"
        >
          <Pencil className="h-4 w-4" />

          Edit Batch
        </Link>

      <button
  type="button"
  onClick={() => setShowDeleteModal(true)}
  disabled={deleting}
  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
>
  <Trash2 className="h-4 w-4" />

  Delete Batch
</button>

      </div>
    )}

  </div>

  <div className="grid gap-6 lg:grid-cols-3">

    {/* MAIN DETAILS */}

    <div className="space-y-6 lg:col-span-2">

      {/* BATCH INFORMATION */}

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-gray-800">
          Batch Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Hash className="h-4 w-4" />

              Batch Number
            </div>

            <p className="mt-2 text-lg font-bold text-gray-800">
              {batch.batchNumber}
            </p>

          </div>

          <div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Package className="h-4 w-4" />

              Product
            </div>

            <p className="mt-2 font-semibold text-gray-800">
              {batch.product.name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              SKU: {batch.product.sku}
            </p>

          </div>

        </div>

      </div>

      {/* DATES */}

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-gray-800">
          Manufacturing & Expiry
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <div className="rounded-xl bg-gray-50 p-4">

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4" />

              Manufacture Date
            </div>

            <p className="mt-2 font-bold text-gray-800">
              {new Date(
                batch.manufactureDate,
              ).toLocaleDateString("en-IN")}
            </p>

          </div>

          <div className="rounded-xl bg-gray-50 p-4">

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4" />

              Expiry Date
            </div>

            <p className="mt-2 font-bold text-gray-800">
              {new Date(
                batch.expiryDate,
              ).toLocaleDateString("en-IN")}
            </p>

          </div>

        </div>

      </div>

    </div>

    {/* SIDE DETAILS */}

    <div className="space-y-6">

      {/* QUANTITY */}

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

        <p className="text-sm font-medium text-gray-500">
          Available Quantity
        </p>

        <p className="mt-3 text-4xl font-bold text-gray-800">
          {batch.quantity}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Units currently available
        </p>

      </div>

      {/* PRICING */}

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-gray-800">
          Pricing
        </h2>

        <div className="mt-6 space-y-5">

          <div className="flex items-center justify-between">

            <span className="flex items-center gap-2 text-sm text-gray-500">
              <IndianRupee className="h-4 w-4" />

              Purchase Price
            </span>

            <span className="font-bold text-gray-800">
              ₹{batch.purchasePrice}
            </span>

          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-5">

            <span className="flex items-center gap-2 text-sm text-gray-500">
              <IndianRupee className="h-4 w-4" />

              Selling Price
            </span>

            <span className="font-bold text-emerald-700">
              ₹{batch.sellingPrice}
            </span>

          </div>

        </div>

      </div>

    </div>

  </div>


{/* DELETE CONFIRMATION MODAL */}

{showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

      {/* ICON */}

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">

        <Trash2 className="h-6 w-6 text-red-600" />

      </div>

      {/* TITLE */}

      <h2 className="mt-5 text-xl font-bold text-gray-800">
        Delete Batch?
      </h2>

      {/* MESSAGE */}

      <p className="mt-3 text-sm leading-6 text-gray-600">

        Are you sure you want to delete batch{" "}

        <span className="font-semibold text-gray-800">
          {batch.batchNumber}
        </span>

        ?

      </p>

      <p className="mt-2 text-sm text-red-600">
        This action cannot be undone.
      </p>

      {/* BUTTONS */}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={() =>
            setShowDeleteModal(false)
          }
          disabled={deleting}
          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >

          <Trash2 className="h-4 w-4" />

          {deleting
            ? "Deleting..."
            : "Yes, Delete Batch"}

        </button>

      </div>

    </div>

  </div>
)}
</div>


);
}
