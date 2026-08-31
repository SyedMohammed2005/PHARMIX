"use client";

import { useEffect, useState } from "react";

type Customer = {
id: string;
name: string;
phone: string | null;
email: string | null;
address: string | null;
createdAt: string;
updatedAt: string;
};

type Pagination = {
page: number;
limit: number;
total: number;
totalPages: number;
hasNextPage: boolean;
hasPreviousPage: boolean;
};

type CustomersResponse = {
success: boolean;
count: number;
customers: Customer[];
pagination?: Pagination;
message?: string;
};

export default function CustomersPage() {
// =========================
// CUSTOMER LIST STATES
// =========================

const [customers, setCustomers] = useState<Customer[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// =========================
// SEARCH STATES
// =========================

const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

// =========================
// PAGINATION STATES
// =========================

const [page, setPage] = useState(1);

const [pagination, setPagination] =
useState<Pagination | null>(null);

const limit = 10;

// =========================
// ADD CUSTOMER STATES
// =========================

const [showAddForm, setShowAddForm] = useState(false);

const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [email, setEmail] = useState("");
const [address, setAddress] = useState("");

const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState("");

// =========================
// SUCCESS MESSAGE
// =========================

const [successMessage, setSuccessMessage] =
useState("");

// =========================
// EDIT CUSTOMER STATES
// =========================

const [editingCustomer, setEditingCustomer] =
useState<Customer | null>(null);

const [editName, setEditName] = useState("");
const [editPhone, setEditPhone] = useState("");
const [editEmail, setEditEmail] = useState("");
const [editAddress, setEditAddress] = useState("");

const [updating, setUpdating] = useState(false);
const [updateError, setUpdateError] = useState("");

// =========================
// SEARCH DEBOUNCE
// =========================

useEffect(() => {
const timeoutId = setTimeout(() => {
setDebouncedSearch(search);
setPage(1);
}, 500);


return () => clearTimeout(timeoutId);

}, [search]);

// =========================
// FETCH CUSTOMERS
// =========================

const fetchCustomers = async () => {
try {
setLoading(true);
setError("");


  const params = new URLSearchParams();

  params.set("page", page.toString());
  params.set("limit", limit.toString());

  if (debouncedSearch.trim()) {
    params.set(
      "search",
      debouncedSearch.trim()
    );
  }

  const response = await fetch(
    `/api/customers?${params.toString()}`
  );

  const result: CustomersResponse =
    await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to fetch customers"
    );
  }

  setCustomers(result.customers);

  if (result.pagination) {
    setPagination(result.pagination);
  } else {
    setPagination(null);
  }
} catch (error) {
  console.error(
    "Failed to fetch customers:",
    error
  );

  setError(
    error instanceof Error
      ? error.message
      : "Failed to load customers."
  );
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchCustomers();
}, [page, debouncedSearch]);

// =========================
// RESET ADD CUSTOMER FORM
// =========================

const resetForm = () => {
setName("");
setPhone("");
setEmail("");
setAddress("");
setCreateError("");
};

// =========================
// CREATE CUSTOMER
// =========================

const handleCreateCustomer = async (
event: React.FormEvent
) => {
event.preventDefault();


try {
  setCreating(true);
  setCreateError("");
  setSuccessMessage("");

  if (phone && phone.length !== 10) {
    throw new Error(
      "Phone number must contain exactly 10 digits"
    );
  }

  const response = await fetch(
    "/api/customers",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to create customer"
    );
  }

  setSuccessMessage(
    "Customer created successfully."
  );

  resetForm();

  setShowAddForm(false);

  setPage(1);

  await fetchCustomers();
} catch (error) {
  console.error(
    "Failed to create customer:",
    error
  );

  setCreateError(
    error instanceof Error
      ? error.message
      : "Failed to create customer."
  );
} finally {
  setCreating(false);
}


};

// =========================
// OPEN EDIT FORM
// =========================

const handleEditCustomer = (
customer: Customer
) => {
setEditingCustomer(customer);


// Load existing customer values
setEditName(customer.name);
setEditPhone(customer.phone || "");
setEditEmail(customer.email || "");
setEditAddress(customer.address || "");

setUpdateError("");
setSuccessMessage("");


};

// =========================
// UPDATE CUSTOMER
// =========================

const handleUpdateCustomer = async (
event: React.FormEvent
) => {
event.preventDefault();


if (!editingCustomer) {
  return;
}

try {
  setUpdating(true);
  setUpdateError("");
  setSuccessMessage("");

  if (editPhone && editPhone.length !== 10) {
    throw new Error(
      "Phone number must contain exactly 10 digits"
    );
  }

  const response = await fetch(
    `/api/customers/${editingCustomer.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        "Failed to update customer"
    );
  }

  // Update UI immediately
  setCustomers((previousCustomers) =>
    previousCustomers.map((customer) =>
      customer.id === editingCustomer.id
        ? result.customer
        : customer
    )
  );

  setSuccessMessage(
    "Customer updated successfully."
  );

  setEditingCustomer(null);

  // Fetch latest data from database
  await fetchCustomers();
} catch (error) {
  console.error(
    "Failed to update customer:",
    error
  );

  setUpdateError(
    error instanceof Error
      ? error.message
      : "Failed to update customer."
  );
} finally {
  setUpdating(false);
}


};

return ( <div className="space-y-6 text-black">


  {/* ================= HEADER ================= */}

  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <h1 className="text-2xl font-bold">
        Customer Management
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Manage pharmacy customers and their details.
      </p>
    </div>

    <div className="flex gap-3">

      <button
        type="button"
        onClick={fetchCustomers}
        disabled={loading}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Refreshing..."
          : "Refresh"}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowAddForm(true);
          setSuccessMessage("");
          setCreateError("");
        }}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
      >
        + Add Customer
      </button>

    </div>
  </div>

  {/* ================= SUCCESS MESSAGE ================= */}

  {successMessage && (
    <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
      {successMessage}
    </div>
  )}

  {/* ================= ADD CUSTOMER FORM ================= */}

  {showAddForm && (
    <div className="rounded-lg border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-lg font-bold">
            Add New Customer
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create a customer profile for future purchases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddForm(false);
            resetForm();
          }}
          className="text-sm font-medium text-gray-500 hover:text-black"
        >
          ✕ Close
        </button>

      </div>

      {createError && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {createError}
        </div>
      )}

      <form
        onSubmit={handleCreateCustomer}
        className="mt-6 grid gap-4 md:grid-cols-2"
      >

        {/* NAME */}

        <div>
          <label
            htmlFor="name"
            className="text-sm font-medium text-gray-700"
          >
            Customer Name *
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
            placeholder="Enter customer name"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* PHONE */}

        <div>
          <label
            htmlFor="phone"
            className="text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>

          <input
            id="phone"
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(event) => {
              const value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 10);

              setPhone(value);
            }}
            maxLength={10}
            placeholder="Enter 10-digit phone number"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* EMAIL */}

        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter email address"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* ADDRESS */}

        <div>
          <label
            htmlFor="address"
            className="text-sm font-medium text-gray-700"
          >
            Address
          </label>

          <input
            id="address"
            type="text"
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            placeholder="Enter customer address"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 md:col-span-2">

          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : "Create Customer"}
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddForm(false);
            }}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

        </div>

      </form>
    </div>
  )}

  {/* ================= EDIT CUSTOMER FORM ================= */}

  {editingCustomer && (
    <div className="rounded-lg border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-lg font-bold">
            Edit Customer
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update customer information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCustomer(null);
            setUpdateError("");
          }}
          className="text-sm font-medium text-gray-500 hover:text-black"
        >
          ✕ Close
        </button>

      </div>

      {updateError && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {updateError}
        </div>
      )}

      <form
        onSubmit={handleUpdateCustomer}
        className="mt-6 grid gap-4 md:grid-cols-2"
      >

        {/* EDIT NAME */}

        <div>
          <label
            htmlFor="editName"
            className="text-sm font-medium text-gray-700"
          >
            Customer Name *
          </label>

          <input
            id="editName"
            type="text"
            value={editName}
            onChange={(event) =>
              setEditName(event.target.value)
            }
            required
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* EDIT PHONE */}

        <div>
          <label
            htmlFor="editPhone"
            className="text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>

          <input
            id="editPhone"
            type="text"
            inputMode="numeric"
            value={editPhone}
            onChange={(event) => {
              const value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 10);

              setEditPhone(value);
            }}
            maxLength={10}
            placeholder="Enter 10-digit phone number"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* EDIT EMAIL */}

        <div>
          <label
            htmlFor="editEmail"
            className="text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <input
            id="editEmail"
            type="email"
            value={editEmail}
            onChange={(event) =>
              setEditEmail(event.target.value)
            }
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* EDIT ADDRESS */}

        <div>
          <label
            htmlFor="editAddress"
            className="text-sm font-medium text-gray-700"
          >
            Address
          </label>

          <input
            id="editAddress"
            type="text"
            value={editAddress}
            onChange={(event) =>
              setEditAddress(event.target.value)
            }
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
        </div>

        {/* EDIT BUTTONS */}

        <div className="flex gap-3 md:col-span-2">

          <button
            type="submit"
            disabled={updating}
            className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating
              ? "Updating..."
              : "Update Customer"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setUpdateError("");
            }}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

        </div>

      </form>
    </div>
  )}

  {/* ================= SEARCH ================= */}

  <div className="rounded-lg border bg-white p-5 shadow-sm">

    <label
      htmlFor="search"
      className="text-sm font-medium text-gray-700"
    >
      Search Customers
    </label>

    <input
      id="search"
      type="text"
      value={search}
      onChange={(event) =>
        setSearch(event.target.value)
      }
      placeholder="Search by name, phone, or email..."
      className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 outline-none transition focus:border-gray-900"
    />

  </div>

  {/* ================= RESULTS ================= */}

  <div className="flex items-center justify-between">

    <p className="text-sm text-gray-500">
      Showing {customers.length} customer
      {customers.length !== 1 ? "s" : ""}
    </p>

    {loading && (
      <p className="text-sm text-gray-500">
        Loading...
      </p>
    )}

  </div>

  {/* ================= ERROR ================= */}

  {error && (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
      {error}
    </div>
  )}

  {/* ================= CUSTOMERS TABLE ================= */}

  <div className="overflow-hidden rounded-lg border bg-white shadow-sm">

    <div className="overflow-x-auto">

      <table className="w-full text-left text-sm">

        <thead className="border-b bg-gray-50">
          <tr>

            <th className="px-6 py-4 font-semibold">
              Customer
            </th>

            <th className="px-6 py-4 font-semibold">
              Phone
            </th>

            <th className="px-6 py-4 font-semibold">
              Email
            </th>

            <th className="px-6 py-4 font-semibold">
              Address
            </th>

            <th className="px-6 py-4 font-semibold">
              Joined
            </th>

            <th className="px-6 py-4 font-semibold">
              Actions
            </th>

          </tr>
        </thead>

        <tbody>

          {loading ? (

            <tr>
              <td
                colSpan={6}
                className="px-6 py-10 text-center text-gray-500"
              >
                Loading customers...
              </td>
            </tr>

          ) : customers.length === 0 ? (

            <tr>
              <td
                colSpan={6}
                className="px-6 py-10 text-center text-gray-500"
              >
                No customers found.
              </td>
            </tr>

          ) : (

            customers.map((customer) => (

              <tr
                key={customer.id}
                className="border-b last:border-b-0 hover:bg-gray-50"
              >

                <td className="px-6 py-4 font-medium">
                  {customer.name}
                </td>

                <td className="px-6 py-4">
                  {customer.phone || "-"}
                </td>

                <td className="px-6 py-4">
                  {customer.email || "-"}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {customer.address || "-"}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {new Date(
                    customer.createdAt
                  ).toLocaleDateString()}
                </td>

               <td className="px-6 py-4">
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => handleEditCustomer(customer)}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
    >
      ✏️ Edit
    </button>

    <a
      href={`/customers/${customer.id}`}
      className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
    >
      👁 View Details
    </a>
  </div>
</td>
              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </div>

  {/* ================= PAGINATION ================= */}

  {pagination &&
    pagination.totalPages > 1 && (

      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm text-gray-600">

          Page{" "}

          <span className="font-semibold">
            {pagination.page}
          </span>

          {" "}of{" "}

          <span className="font-semibold">
            {pagination.totalPages}
          </span>

          {" · "}Total{" "}

          <span className="font-semibold">
            {pagination.total}
          </span>

          {" "}customers

        </p>

        <div className="flex gap-3">

          <button
            type="button"
            disabled={
              !pagination.hasPreviousPage
            }
            onClick={() =>
              setPage((currentPage) =>
                Math.max(
                  currentPage - 1,
                  1
                )
              )
            }
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>

          <button
            type="button"
            disabled={
              !pagination.hasNextPage
            }
            onClick={() =>
              setPage(
                (currentPage) =>
                  currentPage + 1
              )
            }
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>

        </div>

      </div>

    )}

</div>


);
}
