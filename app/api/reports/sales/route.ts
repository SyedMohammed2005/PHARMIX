import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // 2. Authorization
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view sales reports",
        },
        { status: 403 }
      );
    }

    // 3. Read date filters
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (from) {
      fromDate = new Date(`${from}T00:00:00.000Z`);

      if (Number.isNaN(fromDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid 'from' date",
          },
          { status: 400 }
        );
      }
    }

    if (to) {
      toDate = new Date(`${to}T23:59:59.999Z`);

      if (Number.isNaN(toDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid 'to' date",
          },
          { status: 400 }
        );
      }
    }

    if (fromDate && toDate && fromDate > toDate) {
      return NextResponse.json(
        {
          success: false,
          message: "'from' date cannot be greater than 'to' date",
        },
        { status: 400 }
      );
    }

    // 4. Build filter
    const where: {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (fromDate || toDate) {
      where.createdAt = {};

      if (fromDate) {
        where.createdAt.gte = fromDate;
      }

      if (toDate) {
        where.createdAt.lte = toDate;
      }
    }

    // 5. Fetch sales
    const sales = await prisma.sale.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        subtotal: true,
        discount: true,
        tax: true,
        totalAmount: true,
        createdAt: true,

        items: {
          select: {
            quantity: true,
            subtotal: true,
          },
        },

        payment: {
          select: {
            method: true,
            amount: true,
            refundedAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 6. Calculate report totals
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let totalRefunded = 0;

    for (const sale of sales) {
      totalSubtotal += sale.subtotal;
      totalDiscount += sale.discount;
      totalTax += sale.tax;
      totalRevenue += sale.totalAmount;

      for (const item of sale.items) {
        totalItemsSold += item.quantity;
      }

      if (sale.payment) {
        totalRefunded += sale.payment.refundedAmount;
      }
    }

    // 7. Payment-method breakdown
    const paymentMap: Record<
      string,
      {
        transactionCount: number;
        amount: number;
        refundedAmount: number;
        netAmount: number;
      }
    > = {};

    for (const sale of sales) {
      if (!sale.payment) {
        continue;
      }

      const method = sale.payment.method;

      if (!paymentMap[method]) {
        paymentMap[method] = {
          transactionCount: 0,
          amount: 0,
          refundedAmount: 0,
          netAmount: 0,
        };
      }

      paymentMap[method].transactionCount += 1;
      paymentMap[method].amount += sale.payment.amount;
      paymentMap[method].refundedAmount +=
        sale.payment.refundedAmount;

      paymentMap[method].netAmount =
        paymentMap[method].amount -
        paymentMap[method].refundedAmount;
    }

    // 8. Format payment breakdown
    const paymentMethods = Object.entries(paymentMap).map(
      ([method, values]) => ({
        method,
        ...values,
      })
    );
    // 9. Create daily sales data for charts
const dailySalesMap: Record<
  string,
  {
    date: string;
    revenue: number;
    orders: number;
  }
> = {};

for (const sale of sales) {
  const date = sale.createdAt.toISOString().split("T")[0];

  if (!dailySalesMap[date]) {
    dailySalesMap[date] = {
      date,
      revenue: 0,
      orders: 0,
    };
  }

  dailySalesMap[date].revenue += sale.totalAmount;
  dailySalesMap[date].orders += 1;
}

const dailySales = Object.values(dailySalesMap).sort(
  (a, b) =>
    new Date(a.date).getTime() -
    new Date(b.date).getTime()
);

    // 9. Return report
    return NextResponse.json({
      success: true,

      filters: {
        from: from ?? null,
        to: to ?? null,
      },

      summary: {
        totalOrders: sales.length,
        totalItemsSold,
        totalSubtotal,
        totalDiscount,
        totalTax,
        totalRevenue,
        totalRefunded,
        netRevenue: totalRevenue - totalRefunded,
      },

      paymentMethods,
      dailySales,

      sales: sales.map((sale) => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        totalAmount: sale.totalAmount,
        createdAt: sale.createdAt,
      })),
    });
  } catch (error) {
    console.error(
      "GET /api/reports/sales error:",
      error
    );

    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate sales report",
      },
      { status: 500 }
    );
  }
}