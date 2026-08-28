"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type SalesData = {
  date: string;
  orders: number;
  revenue: number;
  tax: number;
  discount: number;
};

type SalesChartProps = {
  data: SalesData[];
};

export function SalesChart({
  data,
}: SalesChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(
      "en-IN",
      {
        month: "short",
        day: "numeric",
      }
    ),
  }));

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Sales Analytics
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Revenue performance over time.
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-gray-500">
          No sales data available yet.
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
          <LineChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" />

  <XAxis
    dataKey="date"
    tick={{ fontSize: 12 }}
  />

  {/* Left axis: Revenue */}
  <YAxis
    yAxisId="revenue"
    tick={{ fontSize: 12 }}
    tickFormatter={(value) => `₹${value}`}
  />

  {/* Right axis: Orders */}
  <YAxis
    yAxisId="orders"
    orientation="right"
    tick={{ fontSize: 12 }}
    allowDecimals={false}
  />

  <Tooltip
    formatter={(value, name) => {
      if (name === "Revenue") {
        return `₹${Number(value).toLocaleString()}`;
      }

      return value;
    }}
  />

  <Legend />

  <Line
    yAxisId="revenue"
    type="monotone"
    dataKey="revenue"
    name="Revenue"
    strokeWidth={2}
    dot={{ r: 4 }}
  />

  <Line
    yAxisId="orders"
    type="monotone"
    dataKey="orders"
    name="Orders"
    strokeWidth={2}
    dot={{ r: 4 }}
  />
</LineChart>

          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}