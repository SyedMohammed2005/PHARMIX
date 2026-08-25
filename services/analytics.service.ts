import { prisma } from "@/lib/prisma";
import {
  StockTransactionType,
} from "@/src/generated/prisma/client";

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

export async function getDashboardAlerts() {
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    lowStock,
    outOfStock,
    expiringBatches,
    expiredBatches,
  ] = await Promise.all([
    prisma.inventory.findMany({
      where: {
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
        quantity: "asc",
      },
    }),

    prisma.inventory.findMany({
      where: {
        quantity: 0,
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
        updatedAt: "desc",
      },
    }),

    prisma.batch.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow,
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
    }),

    prisma.batch.findMany({
      where: {
        expiryDate: {
          lt: today,
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
    }),
  ]);

  const filteredLowStock = lowStock.filter(
    (item) => item.quantity <= item.reorderPoint
  );

  const summary = {
    lowStockCount: filteredLowStock.length,
    outOfStockCount: outOfStock.length,
    expiringCount: expiringBatches.length,
    expiredCount: expiredBatches.length,
  };

  const totalAlerts =
    summary.lowStockCount +
    summary.outOfStockCount +
    summary.expiringCount +
    summary.expiredCount;

  return {
    summary: {
      ...summary,
      totalAlerts,
    },

    alerts: {
      lowStock: filteredLowStock,
      outOfStock,
      expiringBatches,
      expiredBatches,
    },
  };
}

export async function getPaymentAnalytics() {
  const [paymentBreakdown, totals] = await Promise.all([
    prisma.payment.groupBy({
      by: ["method"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        refundedAmount: true,
      },
    }),

    prisma.payment.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        refundedAmount: true,
      },
    }),
  ]);

  const payments = paymentBreakdown.map((payment) => ({
    method: payment.method,
    transactionCount: payment._count.id,
    totalAmount: payment._sum.amount ?? 0,
    refundedAmount: payment._sum.refundedAmount ?? 0,
    netAmount:
      (payment._sum.amount ?? 0) -
      (payment._sum.refundedAmount ?? 0),
  }));

  return {
    summary: {
      totalTransactions: totals._count.id,
      totalAmount: totals._sum.amount ?? 0,
      totalRefundedAmount:
        totals._sum.refundedAmount ?? 0,
      netAmount:
        (totals._sum.amount ?? 0) -
        (totals._sum.refundedAmount ?? 0),
    },
    payments,
  };
}

export async function getSalesAnalytics(daysInput: number = 7) {
  const days = Math.min(Math.max(daysInput || 7, 1), 90);

  const endDate = new Date();
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      totalAmount: true,
      subtotal: true,
      tax: true,
      discount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let totalRevenue = 0;
  let totalSubtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const dailySales: Record<
    string,
    {
      orders: number;
      revenue: number;
      tax: number;
      discount: number;
    }
  > = {};

  for (const sale of sales) {
    totalRevenue += sale.totalAmount;
    totalSubtotal += sale.subtotal;
    totalTax += sale.tax;
    totalDiscount += sale.discount;

    const date = sale.createdAt.toISOString().split("T")[0];

    if (!dailySales[date]) {
      dailySales[date] = {
        orders: 0,
        revenue: 0,
        tax: 0,
        discount: 0,
      };
    }

    dailySales[date].orders += 1;
    dailySales[date].revenue += sale.totalAmount;
    dailySales[date].tax += sale.tax;
    dailySales[date].discount += sale.discount;
  }

  const salesByDate = Object.entries(dailySales).map(
    ([date, values]) => ({
      date,
      ...values,
    }),
  );

  return {
    filters: {
      days,
      startDate,
      endDate,
    },

    summary: {
      totalOrders: sales.length,
      totalSubtotal,
      totalTax,
      totalDiscount,
      totalRevenue,
    },

    salesByDate,
  };
}

export async function getStockMovementAnalytics(
  daysInput: number = 30,
) {
  const days = Math.min(
    Math.max(daysInput || 30, 1),
    365,
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      id: true,
      type: true,
      quantity: true,
      createdAt: true,
      inventory: {
        select: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const movementSummary: Record<
    StockTransactionType,
    {
      transactionCount: number;
      totalQuantity: number;
    }
  > = {
    PURCHASE: {
      transactionCount: 0,
      totalQuantity: 0,
    },
    SALE: {
      transactionCount: 0,
      totalQuantity: 0,
    },
    RETURN: {
      transactionCount: 0,
      totalQuantity: 0,
    },
    DAMAGE: {
      transactionCount: 0,
      totalQuantity: 0,
    },
    ADJUSTMENT: {
      transactionCount: 0,
      totalQuantity: 0,
    },
  };

  let stockAdded = 0;
  let stockRemoved = 0;

  const productMovement: Record<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      purchased: number;
      sold: number;
      returned: number;
      damaged: number;
      adjusted: number;
    }
  > = {};

  for (const transaction of transactions) {
    const quantity = Math.abs(transaction.quantity);

    movementSummary[transaction.type].transactionCount += 1;
    movementSummary[transaction.type].totalQuantity += quantity;

    if (
      transaction.type === StockTransactionType.PURCHASE ||
      transaction.type === StockTransactionType.RETURN
    ) {
      stockAdded += quantity;
    }

    if (
      transaction.type === StockTransactionType.SALE ||
      transaction.type === StockTransactionType.DAMAGE
    ) {
      stockRemoved += quantity;
    }

    if (transaction.type === StockTransactionType.ADJUSTMENT) {
      if (transaction.quantity >= 0) {
        stockAdded += transaction.quantity;
      } else {
        stockRemoved += quantity;
      }
    }

    const product = transaction.inventory.product;

    if (!productMovement[product.id]) {
      productMovement[product.id] = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        purchased: 0,
        sold: 0,
        returned: 0,
        damaged: 0,
        adjusted: 0,
      };
    }

    switch (transaction.type) {
      case StockTransactionType.PURCHASE:
        productMovement[product.id].purchased += quantity;
        break;

      case StockTransactionType.SALE:
        productMovement[product.id].sold += quantity;
        break;

      case StockTransactionType.RETURN:
        productMovement[product.id].returned += quantity;
        break;

      case StockTransactionType.DAMAGE:
        productMovement[product.id].damaged += quantity;
        break;

      case StockTransactionType.ADJUSTMENT:
        productMovement[product.id].adjusted +=
          transaction.quantity;
        break;
    }
  }

  return {
    filters: {
      days,
      startDate,
    },

    summary: {
      totalTransactions: transactions.length,
      stockAdded,
      stockRemoved,
      netMovement: stockAdded - stockRemoved,
    },

    byType: Object.entries(movementSummary).map(
      ([type, values]) => ({
        type,
        ...values,
      }),
    ),

    byProduct: Object.values(productMovement),
  };
}

export async function getTopProducts(limitInput: number = 10) {
  const limit = Math.min(
    Math.max(limitInput || 10, 1),
    50,
  );

  const saleItems = await prisma.saleItem.findMany({
    select: {
      productId: true,
      quantity: true,
      subtotal: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  });

  const productSales: Record<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      quantitySold: number;
      salesAmount: number;
      orderCount: number;
    }
  > = {};

  for (const item of saleItems) {
    const productId = item.productId;

    if (!productSales[productId]) {
      productSales[productId] = {
        productId,
        name: item.product.name,
        sku: item.product.sku,
        quantitySold: 0,
        salesAmount: 0,
        orderCount: 0,
      };
    }

    productSales[productId].quantitySold += item.quantity;
    productSales[productId].salesAmount += item.subtotal;
    productSales[productId].orderCount += 1;
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold;
      }

      return b.salesAmount - a.salesAmount;
    })
    .slice(0, limit);

  return {
    count: topProducts.length,
    limit,
    products: topProducts,
  };
}