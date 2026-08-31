"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

type Statistics = {
  totalPurchases: number;
  totalAmountSpent: number;
  totalItemsPurchased: number;
};

type PurchaseItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
  };
};

type Purchase = {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  items?: PurchaseItem[];
};

type CustomerDetailsResponse = {
  success: boolean;
  customer?: Customer;
  statistics?: Statistics;
  purchaseHistory?: Purchase[];
  message?: string;
};

export default function CustomerDetailsPage() {
  const params = useParams();

  const id = params.id as string;

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [purchaseHistory, setPurchaseHistory] =
    useState<Purchase[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/customers/${id}`
      );

      const result: CustomerDetailsResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to fetch customer details"
        );
      }

      setCustomer(result.customer || null);

      setStatistics(result.statistics || null);

      setPurchaseHistory(
        result.purchaseHistory || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch customer details:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customer details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-black">
        <p className="text-gray-500">
          Loading customer details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6 text-black">
        <Link
          href="/customers"
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          ← Back to Customers
        </Link>

        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4 p-6 text-black">
        <Link
          href="/customers"
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          ← Back to Customers
        </Link>

        <p className="text-gray-500">
          Customer not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/customers"
            className="text-sm font-medium text-gray-500 hover:text-black"
          >
            ← Back to Customers
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            Customer Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View customer information and purchase history.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomerDetails}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      {/* CUSTOMER INFORMATION */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">
          Customer Information
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Full Name
            </p>

            <p className="mt-1 font-medium">
              {customer.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Phone Number
            </p>

            <p className="mt-1 font-medium">
              {customer.phone || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email Address
            </p>

            <p className="mt-1 font-medium">
              {customer.email || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Address
            </p>

            <p className="mt-1 font-medium">
              {customer.address || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Customer Since
            </p>

            <p className="mt-1 font-medium">
              {new Date(
                customer.createdAt
              ).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Last Updated
            </p>

            <p className="mt-1 font-medium">
              {new Date(
                customer.updatedAt
              ).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* STATISTICS */}
      <div>
        <h2 className="text-lg font-bold">
          Purchase Statistics
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Purchases
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statistics?.totalPurchases || 0}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Amount Spent
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹
              {statistics?.totalAmountSpent?.toFixed(
                2
              ) || "0.00"}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Items Purchased
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statistics?.totalItemsPurchased || 0}
            </p>
          </div>
        </div>
      </div>

      {/* PURCHASE HISTORY */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-bold">
            Purchase History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Complete purchase history of this customer.
          </p>
        </div>

        {purchaseHistory.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No purchase history found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Invoice
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Date
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Items
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Discount
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Tax
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Total Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchaseHistory.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium">
                      {purchase.invoiceNumber}
                    </td>

                    <td className="px-6 py-4">
                      {new Date(
                        purchase.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      {purchase.items?.length || 0}
                    </td>

                    <td className="px-6 py-4">
                      ₹{purchase.discount}
                    </td>

                    <td className="px-6 py-4">
                      ₹{purchase.tax}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      ₹{purchase.totalAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}