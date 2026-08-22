import { prisma } from "@/lib/prisma";

export async function getDashboardSummary() {
  // Date range for today
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Run independent queries together
  const [
    totalProducts,
    totalCustomers,
    lowStockProducts,
    expiringBatches,
    totalSalesData,
    todaySalesData,
    paymentBreakdown,
  ] = await Promise.all([
    // Total products
    prisma.product.count(),

    // Total customers
    prisma.customer.count(),

    // Low-stock products
    prisma.inventory.count({
      where: {
        quantity: {
          lte: prisma.inventory.fields.reorderPoint,
        },
      },
    }),

    // Batches expiring within 30 days
    prisma.batch.findMany({
      where: {
        expiryDate: {
          gte: startOfToday,
          lte: new Date(
            startOfToday.getTime() +
              30 * 24 * 60 * 60 * 1000
          ),
        },
        quantity: {
          gt: 0,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
      take: 10,
    }),

    // Overall sales
    prisma.sale.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        subtotal: true,
        discount: true,
        tax: true,
        totalAmount: true,
      },
    }),

    // Today's sales
    prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        subtotal: true,
        discount: true,
        tax: true,
        totalAmount: true,
      },
    }),

    // Payment method breakdown
    prisma.payment.groupBy({
      by: ["method"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  // Format payment breakdown
  const payments = paymentBreakdown.map((payment) => ({
    method: payment.method,
    count: payment._count.id,
    amount: payment._sum.amount ?? 0,
  }));

  return {
    products: {
      total: totalProducts,
    },

    customers: {
      total: totalCustomers,
    },

    inventory: {
      lowStockProducts,
    },

    sales: {
      totalOrders: totalSalesData._count.id,
      totalSubtotal: totalSalesData._sum.subtotal ?? 0,
      totalDiscount: totalSalesData._sum.discount ?? 0,
      totalTax: totalSalesData._sum.tax ?? 0,
      totalRevenue: totalSalesData._sum.totalAmount ?? 0,
    },

    today: {
      orders: todaySalesData._count.id,
      subtotal: todaySalesData._sum.subtotal ?? 0,
      discount: todaySalesData._sum.discount ?? 0,
      tax: todaySalesData._sum.tax ?? 0,
      revenue: todaySalesData._sum.totalAmount ?? 0,
    },

    expiringBatches: {
      count: expiringBatches.length,
      batches: expiringBatches,
    },

    payments,
  };
}