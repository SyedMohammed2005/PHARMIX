import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET() {
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
          message: "You are not authorized to view dashboard analytics",
        },
        { status: 403 }
      );
    }

    // 3. Date range for today
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    // 4. Run independent queries
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

    // 5. Format payment breakdown
    const payments = paymentBreakdown.map((payment) => ({
      method: payment.method,
      count: payment._count.id,
      amount: payment._sum.amount ?? 0,
    }));

    // 6. Return dashboard summary
    return NextResponse.json({
      success: true,
      dashboard: {
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
      },
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/summary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard summary",
      },
      { status: 500 }
    );
  }
}