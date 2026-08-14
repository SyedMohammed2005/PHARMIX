import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authorization";

export async function GET() {
  try {
    // Check authentication
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

    // Get inventory summary data
    const [
      totalProducts,
      totalInventoryItems,
      lowStockItems,
      outOfStockItems,
      totalStock,
    ] = await Promise.all([
      // Total number of products
      prisma.product.count(),

      // Total inventory records
      prisma.inventory.count(),

      // Items at or below reorder point
      prisma.inventory.count({
        where: {
          quantity: {
            lte: prisma.inventory.fields.reorderPoint,
          },
        },
      }),

      // Items with zero stock
      prisma.inventory.count({
        where: {
          quantity: 0,
        },
      }),

      // Total quantity of all medicines
      prisma.inventory.aggregate({
        _sum: {
          quantity: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts,
        totalInventoryItems,
        totalStockQuantity: totalStock._sum.quantity ?? 0,
        lowStockItems,
        outOfStockItems,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/inventory/summary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory summary",
      },
      { status: 500 }
    );
  }
}