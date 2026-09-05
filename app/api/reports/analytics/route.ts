import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET() {
  try {
    // Authentication
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 },
      );
    }

    // Authorization
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view analytics",
        },
        { status: 403 },
      );
    }

    // Total products
    const totalProducts =
      await prisma.product.count();

    // Total sales
    const totalSales =
      await prisma.sale.count();

    // Total revenue
    const revenueResult =
      await prisma.sale.aggregate({
        _sum: {
          totalAmount: true,
        },
      });

    const totalRevenue =
      revenueResult._sum.totalAmount ?? 0;

    // Low stock inventory
    const lowStockProducts =
      await prisma.inventory.count({
        where: {
          quantity: {
            lte: 10,
          },
        },
      });

    // Inventory value
    const inventoryItems =
      await prisma.inventory.findMany({
        include: {
          product: true,
        },
      });

    const inventoryValue =
      inventoryItems.reduce(
        (total, item) =>
          total +
          item.quantity *
            Number(item.product.purchasePrice),
        0,
      );

    return NextResponse.json({
      success: true,

      analytics: {
        totalProducts,

        totalSales,

        totalRevenue,

        lowStockProducts,

        inventoryValue,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/analytics error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch analytics",
      },
      { status: 500 },
    );
  }
}