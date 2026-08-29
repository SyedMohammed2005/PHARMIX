import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
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
      UserRole.PHARMACIST,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view sales summary",
        },
        { status: 403 }
      );
    }

    // 3. Calculate today's date range
    const today = new Date();

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // 4. Get all summary data in parallel
    const [
      totalSales,
      totalRevenue,
      todaySales,
      todayRevenue,
    ] = await Promise.all([
      prisma.sale.count(),

      prisma.sale.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.sale.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // 5. Return summary
    return NextResponse.json({
      success: true,

      summary: {
        totalSales,

        totalRevenue:
          totalRevenue._sum.totalAmount || 0,

        todaySales,

        todayRevenue:
          todayRevenue._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/sales/summary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales summary",
      },
      { status: 500 }
    );
  }
}