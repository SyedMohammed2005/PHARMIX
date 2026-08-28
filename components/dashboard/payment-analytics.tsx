import {
  CreditCard,
  IndianRupee,
  Receipt,
  Undo2,
} from "lucide-react";

type PaymentSummary = {
  totalTransactions: number;
  totalAmount: number;
  totalRefundedAmount: number;
  netAmount: number;
};

type Payment = {
  method: string;
  transactionCount: number;
  totalAmount: number;
  refundedAmount: number;
  netAmount: number;
};

type PaymentAnalyticsProps = {
  data: {
    summary: PaymentSummary;
    payments: Payment[];
  };
};

export function PaymentAnalytics({
  data,
}: PaymentAnalyticsProps) {
  const { summary, payments } = data;

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Payment Analytics
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Overview of pharmacy payments and refunds.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PaymentCard
          title="Transactions"
          value={summary.totalTransactions.toString()}
          icon={Receipt}
        />

        <PaymentCard
          title="Total Payments"
          value={`₹${summary.totalAmount.toLocaleString()}`}
          icon={IndianRupee}
        />

        <PaymentCard
          title="Refunded"
          value={`₹${summary.totalRefundedAmount.toLocaleString()}`}
          icon={Undo2}
        />

        <PaymentCard
          title="Net Amount"
          value={`₹${summary.netAmount.toLocaleString()}`}
          icon={CreditCard}
        />
      </div>

      {/* Payment Methods */}
      <div className="mt-8">
        <h3 className="mb-4 font-semibold text-gray-900">
          Payment Method Breakdown
        </h3>

        {payments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            No payment data available yet.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.method}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {payment.method}
                  </p>

                  <p className="text-sm text-gray-500">
                    {payment.transactionCount} transaction
                    {payment.transactionCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-gray-500">
                      Total
                    </p>

                    <p className="font-semibold text-gray-900">
                      ₹{payment.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Refunded
                    </p>

                    <p className="font-semibold text-gray-900">
                      ₹{payment.refundedAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Net
                    </p>

                    <p className="font-semibold text-gray-900">
                      ₹{payment.netAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PaymentCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <Icon
          size={20}
          className="text-gray-500"
        />
      </div>

      <p className="mt-3 text-xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}