import { getCurrentUser } from "@/lib/authorization";
import { PosInterface } from "@/components/pos/pos-interface";

export default async function PosPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div>
        <h1 className="text-2xl font-bold">
          Access denied
        </h1>
      </div>
    );
  }

  if (
    currentUser.role !== "PHARMACIST" &&
    currentUser.role !== "ADMIN"
  ) {
    return (
      <div>
        <h1 className="text-2xl font-bold">
          You do not have permission to access POS.
        </h1>
      </div>
    );
  }

 return (
  <div className="space-y-6">
    {/* Page Header */}
    <div>
      <h1 className="text-3xl font-bold">
        Point of Sale
      </h1>

      <p className="mt-2 text-gray-500">
        Create a new pharmacy sale.
      </p>
    </div>
<PosInterface />
    {/* POS Layout */}
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT SIDE - Medicine Search */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Medicines
        </h2>

        <input
          type="text"
          placeholder="Search medicines..."
          className="mt-4 w-full rounded-md border px-4 py-2 outline-none"
        />

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Search for a medicine to add it to the sale.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Cart */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Current Sale
        </h2>

        <div className="mt-6 rounded-md border border-dashed p-8 text-center">
          <p className="text-gray-500">
            Your cart is empty
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Search and add medicines to start a sale.
          </p>
        </div>
      </div>
    </div>
  </div>
);
}