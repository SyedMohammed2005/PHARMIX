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
          message: "You are not authorized to view sales analytics",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters
    const { searchParams } = new URL(request.url);

    const days = Math.min(
      Math.max(Number(searchParams.get("days")) || 7, 1),
      90
    );

    // 4. Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - (days - 1));

    startDate.setHours(0, 0, 0, 0);

    // 5. Get sales
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

    // 6. Overall totals
    const totalOrders = sales.length;

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalSubtotal = sales.reduce(
      (sum, sale) => sum + sale.subtotal,
      0
    );

    const totalTax = sales.reduce(
      (sum, sale) => sum + sale.tax,
      0
    );

    const totalDiscount = sales.reduce(
      (sum, sale) => sum + sale.discount,
      0
    );

    // 7. Group sales by date
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

    // 8. Convert object to array
    const salesByDate = Object.entries(dailySales).map(
      ([date, values]) => ({
        date,
        ...values,
      })
    );

    // 9. Return response
    return NextResponse.json({
      success: true,
      filters: {
        days,
        startDate,
        endDate,
      },
      summary: {
        totalOrders,
        totalSubtotal,
        totalTax,
        totalDiscount,
        totalRevenue,
      },
      salesByDate,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/sales error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales analytics",
      },
      { status: 500 }
    );
  }
}