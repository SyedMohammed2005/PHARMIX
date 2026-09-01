"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Purchase = {
  id: string;
  purchaseNumber: string;

  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;

  createdAt: string;

  supplier: {
    id: string;
    name: string;
  };

  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  } | null;
};

type PurchaseResponse = {
  success: boolean;

  purchases?: Purchase[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  message?: string;
};

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<
    Purchase[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchPurchases = async () => {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));

      params.set("limit", "10");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (paymentMethod) {
        params.set(
          "paymentMethod",
          paymentMethod
        );
      }

      const response = await fetch(
        `/api/purchases?${params.toString()}`
      );

      const result: PurchaseResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.purchases
      ) {
        throw new Error(
          result.message ||
          "Failed to fetch purchases"
        );
      }

      setPurchases(result.purchases);

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error(
        "Failed to fetch purchases:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load purchases"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, paymentMethod]);

  const handleSearch = () => {
    setPage(1);

    fetchPurchases();
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

  if (loading && purchases.length === 0) {
    return (
      <div className="text-black">
        Loading purchases...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-black">
            Purchase Management
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Manage medicine purchases and supplier
            stock.
          </p>
        </div>

        <Link
          href="/purchases/new"
          className="rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
        >
          + New Purchase
        </Link>

      </div>


      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}


      {/* SEARCH AND FILTER */}

      <div className="rounded-lg border bg-white p-5">

        <div className="grid gap-4 md:grid-cols-3">

          {/* SEARCH */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Search
            </label>

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
              placeholder="Purchase number or supplier..."
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
            />
          </div>


          {/* PAYMENT METHOD */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(
                  event.target.value
                );

                setPage(1);
              }}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
            >
              <option value="">
                All Payment Methods
              </option>

              <option value="CASH">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>

            </select>
          </div>


          {/* SEARCH BUTTON */}

          <div className="flex items-end">

            <button
              type="button"
              onClick={handleSearch}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Search Purchases
            </button>

          </div>

        </div>

      </div>


      {/* PURCHASE TABLE */}

      <div className="overflow-hidden rounded-lg border bg-white">

        <div className="border-b bg-gray-50 px-5 py-4">

          <h2 className="font-bold text-black">
            Purchase History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Total Purchases: {pagination.total}
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-4 py-3">
                  Purchase Number
                </th>

                <th className="px-4 py-3">
                  Supplier
                </th>

                <th className="px-4 py-3">
                  Payment
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Total Amount
                </th>

                <th className="px-4 py-3">
                  Date
                </th>
                <th className="px-4 py-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {purchases.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No purchases found.
                  </td>

                </tr>

              ) : (

                purchases.map((purchase) => (

                  <tr
                    key={purchase.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >

                    <td className="px-4 py-4 font-semibold text-black">
                      {purchase.purchaseNumber}
                    </td>


                    <td className="px-4 py-4">
                      {purchase.supplier.name}
                    </td>


                    <td className="px-4 py-4">

                      {purchase.payment?.method ||
                        "N/A"}

                    </td>


                    <td className="px-4 py-4">

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                        {purchase.payment?.status ||
                          "N/A"}

                      </span>

                    </td>


                    <td className="px-4 py-4 text-right font-semibold">

                      ₹
                      {purchase.totalAmount.toFixed(
                        2
                      )}

                    </td>


                    <td className="px-4 py-4 text-gray-600">

                      {new Date(
                        purchase.createdAt
                      ).toLocaleDateString()}

                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/purchases/${purchase.id}`)
                        }
                        className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>


        {/* PAGINATION */}

        <div className="flex items-center justify-between border-t px-5 py-4">

          <p className="text-sm text-gray-600">

            Page {pagination.page} of{" "}
            {pagination.totalPages}

          </p>


          <div className="flex gap-3">

            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page <= 1}
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>


            <button
              type="button"
              onClick={handleNextPage}
              disabled={
                page >= pagination.totalPages
              }
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}