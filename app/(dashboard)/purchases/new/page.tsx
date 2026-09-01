"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Supplier = {
  id: string;
  name: string;
  email: string;
};

type SupplierResponse = {
  success: boolean;
  suppliers?: Supplier[];
  message?: string;
};

type Product = {
  id: string;
  name: string;
  purchasePrice: number;
};

type ProductResponse = {
  success: boolean;
  products?: Product[];
  message?: string;
};

type Batch = {
  id: string;
  batchNumber: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
};

type BatchResponse = {
  success: boolean;
  batches?: Batch[];
  message?: string;
};

type PurchaseItem = {
  productId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  gst: number;
};

export default function NewPurchasePage() {
  const router = useRouter();
  // ================================
  // SUPPLIER STATE
  // ================================

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");

  // ================================
  // PRODUCT STATE
  // ================================

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // ================================
  // BATCH STATE
  // ================================

  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  // ================================
  // PURCHASE ITEMS STATE
  // ================================

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: "",
      batchId: "",
      quantity: 1,
      unitPrice: 0,
      gst: 0,
    },
  ]);

  const [discount, setDiscount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [submitting, setSubmitting] = useState(false);

  // ================================
  // PAGE STATE
  // ================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================================
  // FETCH SUPPLIERS
  // ================================

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/suppliers");

      const result: SupplierResponse = await response.json();

      if (!response.ok || !result.success || !result.suppliers) {
        throw new Error(result.message || "Failed to fetch suppliers");
      }

      setSuppliers(result.suppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load suppliers",
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // FETCH PRODUCTS
  // ================================

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      const response = await fetch("/api/products?limit=100");

      const result: ProductResponse = await response.json();

      if (!response.ok || !result.success || !result.products) {
        throw new Error(result.message || "Failed to fetch products");
      }

      setProducts(result.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load products",
      );
    } finally {
      setProductsLoading(false);
    }
  };

  // ================================
  // FETCH BATCHES
  // ================================

  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);

      const response = await fetch("/api/batches");

      const result: BatchResponse = await response.json();

      if (!response.ok || !result.success || !result.batches) {
        throw new Error(result.message || "Failed to fetch batches");
      }

      setBatches(result.batches);
    } catch (error) {
      console.error("Failed to fetch batches:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load batches",
      );
    } finally {
      setBatchesLoading(false);
    }
  };

  // ================================
  // LOAD DATA
  // ================================

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchBatches();
  }, []);

  // ================================
  // UPDATE PURCHASE ITEM
  // ================================

  const updateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  // ================================
  // HANDLE PRODUCT CHANGE
  // ================================

  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find(
      (product) => product.id === productId,
    );

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              batchId: "",
              unitPrice: selectedProduct?.purchasePrice ?? 0,
            }
          : item,
      ),
    );
  };

  // ================================
  // PURCHASE TOTAL CALCULATIONS
  // ================================

  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  const handleAddItem = () => {
  setItems((currentItems) => [
    ...currentItems,
    {
      productId: "",
      batchId: "",
      quantity: 1,
      unitPrice: 0,
      gst: 0,
    },
  ]);
};
const handleRemoveItem = (index: number) => {
  if (items.length === 1) {
    setError(
      "A purchase must contain at least one item",
    );
    return;
  }

  setItems((currentItems) =>
    currentItems.filter(
      (_, itemIndex) => itemIndex !== index,
    ),
  );
};
  const tax = items.reduce((total, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;

    const itemTax = itemSubtotal * (item.gst / 100);

    return total + itemTax;
  }, 0);

  const totalAmount = subtotal + tax - discount;
  const handleCreatePurchase = async () => {
    try {
      setError("");

      // Validate supplier
      if (!supplierId) {
        setError("Please select a supplier");
        return;
      }

      // Validate items
      if (items.length === 0) {
        setError("Please add at least one purchase item");
        return;
      }

      for (const item of items) {
        if (!item.productId) {
          setError("Please select a product");
          return;
        }

        if (!item.batchId) {
          setError("Please select a batch");
          return;
        }

        if (item.quantity <= 0) {
          setError("Quantity must be greater than 0");
          return;
        }

        if (item.unitPrice < 0) {
          setError("Unit price cannot be negative");
          return;
        }

        if (item.gst < 0) {
          setError("GST cannot be negative");
          return;
        }
      }

      if (discount < 0) {
        setError("Discount cannot be negative");
        return;
      }

      if (discount > subtotal + tax) {
        setError("Discount cannot be greater than the purchase total");
        return;
      }

      setSubmitting(true);

      const response = await fetch("/api/purchases", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          supplierId,
          items,
          discount,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create purchase");
      }

      router.push("/purchases");
    } catch (error) {
      console.error("Failed to create purchase:", error);

      setError(
        error instanceof Error ? error.message : "Failed to create purchase",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ================================
  // PAGE UI
  // ================================

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-black">New Purchase</h1>

        <p className="mt-1 text-sm text-gray-600">
          Create a new medicine purchase from a supplier.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUPPLIER SECTION */}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-bold text-black">Supplier Information</h2>

        <p className="mt-1 text-sm text-gray-500">
          Select the supplier for this purchase.
        </p>

        <div className="mt-5">
          <label className="text-sm font-medium text-gray-700">Supplier</label>

          <select
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            disabled={loading}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-900 disabled:bg-gray-100"
          >
            <option value="">
              {loading ? "Loading suppliers..." : "Select a supplier"}
            </option>

            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} ({supplier.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PURCHASE ITEMS */}

      <div className="rounded-lg border bg-white p-6">
        <div>
          <h2 className="text-lg font-bold text-black">Purchase Items</h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the medicines and batches for this purchase.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {items.map((item, index) => {
            const availableBatches = batches.filter(
              (batch) => batch.productId === item.productId,
            );

            return (
              <div key={index} className="rounded-lg border bg-gray-50 p-5">
                <div className="flex items-center justify-between">

  <h3 className="font-semibold text-black">
    Item {index + 1}
  </h3>

  <button
    type="button"
    onClick={() => handleRemoveItem(index)}
    disabled={items.length === 1}
    className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
  >
    Remove
  </button>

</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {/* PRODUCT */}

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Product
                    </label>

                    <select
                      value={item.productId}
                      disabled={productsLoading}
                      onChange={(event) =>
                        handleProductChange(index, event.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">
                        {productsLoading
                          ? "Loading products..."
                          : "Select product"}
                      </option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BATCH */}

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Batch
                    </label>

                    <select
                      value={item.batchId}
                      disabled={!item.productId || batchesLoading}
                      onChange={(event) =>
                        updateItem(index, "batchId", event.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">
                        {!item.productId
                          ? "Select product first"
                          : batchesLoading
                            ? "Loading batches..."
                            : "Select batch"}
                      </option>

                      {availableBatches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* QUANTITY */}

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "quantity",
                          Number(event.target.value),
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>

                  {/* UNIT PRICE */}

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Unit Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "unitPrice",
                          Number(event.target.value),
                        )
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>

                  {/* GST */}

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      GST %
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={item.gst}
                      onChange={(event) =>
                        updateItem(index, "gst", Number(event.target.value))
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            );
               
    })}

    {/* ADD ITEM BUTTON */}

    <button
      type="button"
      onClick={handleAddItem}
      className="w-full rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-gray-900 hover:text-black"
    >
      + Add Another Item
    </button>

  </div>

</div>
      {/* PURCHASE SUMMARY */}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-bold text-black">Purchase Summary</h2>

        <p className="mt-1 text-sm text-gray-500">
          Review the purchase amount before creating the purchase.
        </p>

        {/* DISCOUNT + PAYMENT */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* DISCOUNT */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Discount Amount
            </label>

            <input
              type="number"
              min="0"
              value={discount}
              onChange={(event) => setDiscount(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {/* PAYMENT METHOD */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="CASH">Cash</option>

              <option value="UPI">UPI</option>

              <option value="CARD">Card</option>

              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* PURCHASE TOTALS */}

        <div className="mt-8 space-y-3 rounded-lg bg-gray-50 p-5">
          {/* SUBTOTAL */}

          <div className="flex items-center justify-between text-gray-700">
            <span>Subtotal</span>

            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* TAX */}

          <div className="flex items-center justify-between text-gray-700">
            <span>GST / Tax</span>

            <span>₹{tax.toFixed(2)}</span>
          </div>

          {/* DISCOUNT */}

          <div className="flex items-center justify-between text-gray-700">
            <span>Discount</span>

            <span>- ₹{discount.toFixed(2)}</span>
          </div>

          {/* TOTAL */}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold text-black">
              <span>Total Amount</span>

              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* CREATE PURCHASE BUTTON */}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleCreatePurchase}
              disabled={submitting}
              className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating Purchase..." : "Create Purchase"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
