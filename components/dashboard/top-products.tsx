import {
  Package,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";

type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  quantitySold: number;
  salesAmount: number;
  orderCount: number;
};

type TopProductsProps = {
  products: TopProduct[];
};

export function TopProducts({
  products,
}: TopProductsProps) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Selling Products
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Best performing products based on quantity sold.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex h-52 items-center justify-center rounded-lg border border-dashed text-sm text-gray-500">
          No sales data available yet.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                {/* Ranking */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                  #{index + 1}
                </div>

                {/* Product information */}
                <div>
                  <p className="font-semibold text-gray-900">
                    {product.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    SKU: {product.sku}
                  </p>
                </div>
              </div>

              {/* Product analytics */}
              <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:block">
                  <div className="flex items-center justify-end gap-1 text-sm text-gray-500">
                    <Package size={15} />

                    Quantity
                  </div>

                  <p className="font-semibold text-gray-900">
                    {product.quantitySold}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-end gap-1 text-sm text-gray-500">
                    <IndianRupee size={15} />

                    Sales
                  </div>

                  <p className="font-semibold text-gray-900">
                    ₹{product.salesAmount.toLocaleString()}
                  </p>
                </div>

                <div className="hidden md:block">
                  <div className="flex items-center justify-end gap-1 text-sm text-gray-500">
                    <ShoppingCart size={15} />

                    Orders
                  </div>

                  <p className="font-semibold text-gray-900">
                    {product.orderCount}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}