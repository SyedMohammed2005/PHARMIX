"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  mrp: number;
  inventory: {
    quantity: number;
  } | null;
};

type ProductsResponse = {
  success: boolean;
  count: number;
  products: Product[];
};

type Batch = {
  id: string;
  batchNumber: string;
  productId: string;
  expiryDate: string;
  quantity: number;
  sellingPrice: number;
};

type BatchesResponse = {
  success: boolean;
  count: number;
  batches: Batch[];
};

type CartItem = {
  product: Product;
  batchId: string;
  batchNumber: string;
  batchExpiryDate: string;
  availableBatchStock: number;
  unitPrice: number;
  quantity: number;
};

export function PosInterface() {
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [loadingBatches, setLoadingBatches] = useState(true);

  const [message, setMessage] = useState("");

  const [showPayment, setShowPayment] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">(
    "CASH",
  );

  const [processingSale, setProcessingSale] = useState(false);

  const [saleSuccess, setSaleSuccess] = useState("");

  // Fetch all batches once
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);

      try {
        const response = await fetch("/api/batches");

        const result: BatchesResponse = await response.json();

        if (result.success) {
          setBatches(result.batches);
        } else {
          setBatches([]);
        }
      } catch (error) {
        console.error("Failed to fetch batches:", error);

        setBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, []);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      setLoadingProducts(true);

      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(search)}`,
        );

        const result: ProductsResponse = await response.json();

        if (result.success) {
          setProducts(result.products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to search products:", error);

        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Get valid batches using FEFO
  const getValidBatch = (productId: string) => {
    const today = new Date();

    const validBatches = batches
      .filter((batch) => {
        const expiryDate = new Date(batch.expiryDate);

        return (
          batch.productId === productId &&
          batch.quantity > 0 &&
          expiryDate >= today
        );
      })
      .sort((a, b) => {
        return (
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
      });

    return validBatches[0] ?? null;
  };

  // Add medicine to cart
  const addToCart = (product: Product) => {
    setMessage("");

    const selectedBatch = getValidBatch(product.id);

    if (!selectedBatch) {
      setMessage(
        `${product.name} does not have any valid batch available for sale.`,
      );

      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) =>
          item.product.id === product.id && item.batchId === selectedBatch.id,
      );

      if (existingItem) {
        if (existingItem.quantity >= selectedBatch.quantity) {
          setMessage(
            `Cannot add more ${product.name}. Maximum batch stock reached.`,
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.product.id === product.id && item.batchId === selectedBatch.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          batchId: selectedBatch.id,
          batchNumber: selectedBatch.batchNumber,
          batchExpiryDate: selectedBatch.expiryDate,
          availableBatchStock: selectedBatch.quantity,
          unitPrice: selectedBatch.sellingPrice,
          quantity: 1,
        },
      ];
    });
  };

  // Increase quantity
  const increaseQuantity = (productId: string, batchId: string) => {
    setMessage("");

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.product.id === productId && item.batchId === batchId) {
          if (item.quantity >= item.availableBatchStock) {
            setMessage(
              `Cannot add more ${item.product.name}. Maximum batch stock reached.`,
            );

            return item;
          }

          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }

        return item;
      }),
    );
  };

  // Decrease quantity
  const decreaseQuantity = (productId: string, batchId: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.product.id === productId && item.batchId === batchId) {
            return {
              ...item,
              quantity: item.quantity - 1,
            };
          }

          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const updateQuantity = (
    productId: string,
    batchId: string,
    value: string,
  ) => {
    setMessage("");

    // Allow the input to be temporarily empty
    if (value === "") {
      setCart((currentCart) =>
        currentCart.map((item) =>
          item.product.id === productId && item.batchId === batchId
            ? { ...item, quantity: 0 }
            : item,
        ),
      );

      return;
    }

    const quantity = Number(value);

    // Only allow whole positive numbers
    if (!Number.isInteger(quantity) || quantity < 0) {
      return;
    }

    const cartItem = cart.find(
      (item) => item.product.id === productId && item.batchId === batchId,
    );

    if (!cartItem) {
      return;
    }

    // Prevent quantity greater than available stock
    if (quantity > cartItem.availableBatchStock) {
      setMessage(
        `Only ${cartItem.availableBatchStock} units of ${cartItem.product.name} are available in this batch.`,
      );

      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId && item.batchId === batchId
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  // Remove item completely
  const removeFromCart = (productId: string, batchId: string) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => !(item.product.id === productId && item.batchId === batchId),
      ),
    );
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );
  }, [cart]);

  // Calculate GST
  const tax = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemSubtotal = item.unitPrice * item.quantity;

      const itemTax = itemSubtotal * ((item.product.inventory ? 5 : 5) / 100);

      return total + itemTax;
    }, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const totalAmount = subtotal + tax;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const total = subtotal + tax;

  const completeSale = async () => {
    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setProcessingSale(true);
    setMessage("");
    setSaleSuccess("");

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            batchId: item.batchId,
            quantity: item.quantity,
          })),
          discount: 0,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(result.message || "Failed to complete sale.");
        return;
      }

      setSaleSuccess(
        `Sale completed successfully! Invoice: ${result.sale.invoiceNumber}`,
      );

      setCart([]);
      setShowPayment(false);
    } catch (error) {
      console.error("Failed to complete sale:", error);

      setMessage("Something went wrong while completing the sale.");
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="grid gap-6 text-black lg:grid-cols-2">
      {/* LEFT SIDE - MEDICINES */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Medicines</h2>

          <span className="text-sm text-gray-500">
            {loadingBatches
              ? "Loading batches..."
              : `${batches.length} batches loaded`}
          </span>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search medicines..."
          className="mt-4 w-full rounded-md border px-4 py-2 text-black outline-none focus:ring-2 focus:ring-gray-300"
        />

        {message && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {message}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loadingProducts && (
            <p className="text-sm text-gray-500">Searching medicines...</p>
          )}

          {!loadingProducts &&
            products.map((product) => {
              const validBatch = getValidBatch(product.id);

              return (
                <div key={product.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>

                      <p className="mt-1 text-sm text-gray-500">
                        SKU: {product.sku}
                      </p>

                      {validBatch ? (
                        <div className="mt-2 text-sm">
                          <p className="text-green-600">
                            Batch: {validBatch.batchNumber}
                          </p>

                          <p className="text-gray-500">
                            Batch Stock: {validBatch.quantity}
                          </p>

                          <p className="text-gray-500">
                            Expiry: {formatDate(validBatch.expiryDate)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-red-500">
                          No valid batch available
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        ₹
                        {validBatch
                          ? validBatch.sellingPrice
                          : product.sellingPrice}
                      </p>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={!validBatch}
                        className={`mt-3 rounded-md px-4 py-2 text-sm font-medium text-white ${
                          validBatch
                            ? "bg-gray-900 hover:bg-gray-700"
                            : "cursor-not-allowed bg-gray-400"
                        }`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {!loadingProducts && search && products.length === 0 && (
            <p className="text-sm text-gray-500">No medicines found.</p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - CURRENT SALE */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Sale</h2>

          {message && (
            <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {message}
            </div>
          )}

          {saleSuccess && (
            <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">
              {saleSuccess}
            </div>
          )}

          {cart.length > 0 && (
            <span className="text-sm text-gray-500">
              {totalItems} item
              {totalItems !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed p-8 text-center">
            <p className="text-gray-500">Your cart is empty</p>

            <p className="mt-2 text-sm text-gray-400">
              Search and add medicines to start a sale.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.batchId}`}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{item.product.name}</h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Batch: {item.batchNumber}
                    </p>

                    <p className="text-sm text-gray-500">
                      Expiry: {formatDate(item.batchExpiryDate)}
                    </p>

                    <p className="text-sm text-gray-500">
                      ₹{item.unitPrice} each
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.product.id, item.batchId)
                    }
                    className="text-sm font-medium text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        decreaseQuantity(item.product.id, item.batchId)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded border font-semibold hover:bg-gray-100"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      max={item.availableBatchStock}
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(event) =>
                        updateQuantity(
                          item.product.id,
                          item.batchId,
                          event.target.value,
                        )
                      }
                      onBlur={() => {
                        if (item.quantity < 1) {
                          setCart((currentCart) =>
                            currentCart.map((cartItem) =>
                              cartItem.product.id === item.product.id &&
                              cartItem.batchId === item.batchId
                                ? {
                                    ...cartItem,
                                    quantity: 1,
                                  }
                                : cartItem,
                            ),
                          );
                        }
                      }}
                      className="w-16 rounded-md border px-2 py-1 text-center font-semibold text-black outline-none focus:ring-2 focus:ring-gray-300"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        increaseQuantity(item.product.id, item.batchId)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded border font-semibold hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{(item.unitPrice * item.quantity).toFixed(2)}
                    </p>

                    <p className="text-xs text-gray-500">
                      Available: {item.availableBatchStock}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* SALE SUMMARY */}
            <div className="mt-6 rounded-lg border bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>

                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-600">Estimated GST</span>

                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>

                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {!showPayment ? (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setSaleSuccess("");
                  setShowPayment(true);
                }}
                className="w-full rounded-md bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                Continue to Payment
              </button>
            ) : (
              <div className="mt-6 space-y-4 rounded-lg border bg-gray-50 p-4">
                <div>
                  <h3 className="text-lg font-semibold">Payment Method</h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Select how the customer wants to pay.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(["CASH", "CARD", "UPI"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${
                        paymentMethod === method
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <div className="rounded-md border bg-white p-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount to Pay</span>

                    <span className="text-lg font-bold">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    Payment method: {paymentMethod}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayment(false)}
                    className="flex-1 rounded-md border px-4 py-3 font-semibold hover:bg-gray-100"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={completeSale}
                    disabled={processingSale}
                    className="flex-1 rounded-md bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingSale ? "Processing..." : "Complete Sale"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
