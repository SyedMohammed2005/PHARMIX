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
      UserRole.PHARMACIST,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view inventory alerts",
        },
        { status: 403 }
      );
    }

    // 3. Date calculations
    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30
    );

    // 4. Fetch alerts in parallel
    const [
      lowStock,
      outOfStock,
      expiringBatches,
      expiredBatches,
    ] = await Promise.all([
      // Low stock
      prisma.inventory.findMany({
        where: {
          quantity: {
            gt: 0,
          },
          // We'll filter against reorderPoint below.
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

      // Out of stock
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

      // Expiring within 30 days
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

      // Already expired
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

    // 5. Filter low stock using reorderPoint
    const filteredLowStock = lowStock.filter(
      (item) => item.quantity <= item.reorderPoint
    );

    // 6. Summary
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

    // 7. Response
    return NextResponse.json({
      success: true,

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
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/alerts error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory alerts",
      },
      { status: 500 }
    );
  }
}