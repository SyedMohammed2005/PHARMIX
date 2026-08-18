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
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view inventory reports",
        },
        { status: 403 }
      );
    }

    // 3. Date calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30
    );

    // 4. Fetch inventory and batches
    const [inventories, expiringBatches, expiredBatches] =
      await Promise.all([
        prisma.inventory.findMany({
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                purchasePrice: true,
                sellingPrice: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            quantity: "asc",
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

    // 5. Calculate inventory statistics
    let totalStockQuantity = 0;
    let totalInventoryValue = 0;
    let totalSellingValue = 0;

    const lowStockProducts = [];
    const outOfStockProducts = [];

    for (const inventory of inventories) {
      const quantity = inventory.quantity;

      totalStockQuantity += quantity;

      totalInventoryValue +=
        quantity * inventory.product.purchasePrice;

      totalSellingValue +=
        quantity * inventory.product.sellingPrice;

      if (
        quantity > 0 &&
        quantity <= inventory.reorderPoint
      ) {
        lowStockProducts.push({
          inventoryId: inventory.id,
          productId: inventory.product.id,
          name: inventory.product.name,
          sku: inventory.product.sku,
          quantity,
          reorderPoint: inventory.reorderPoint,
          category: inventory.product.category.name,
        });
      }

      if (quantity === 0) {
        outOfStockProducts.push({
          inventoryId: inventory.id,
          productId: inventory.product.id,
          name: inventory.product.name,
          sku: inventory.product.sku,
          category: inventory.product.category.name,
        });
      }
    }

    // 6. Category-wise inventory
    const categoryMap: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        productCount: number;
        stockQuantity: number;
        inventoryValue: number;
      }
    > = {};

    for (const inventory of inventories) {
      const category = inventory.product.category;

      if (!categoryMap[category.id]) {
        categoryMap[category.id] = {
          categoryId: category.id,
          categoryName: category.name,
          productCount: 0,
          stockQuantity: 0,
          inventoryValue: 0,
        };
      }

      categoryMap[category.id].productCount += 1;
      categoryMap[category.id].stockQuantity += inventory.quantity;

      categoryMap[category.id].inventoryValue +=
        inventory.quantity *
        inventory.product.purchasePrice;
    }

    // 7. Return report
    return NextResponse.json({
      success: true,

      summary: {
        totalProducts: inventories.length,
        totalStockQuantity,
        totalInventoryValue,
        totalSellingValue,
        potentialProfit:
          totalSellingValue - totalInventoryValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        expiringBatchCount: expiringBatches.length,
        expiredBatchCount: expiredBatches.length,
      },

      lowStockProducts,
      outOfStockProducts,
      expiringBatches,
      expiredBatches,

      byCategory: Object.values(categoryMap),
    });
  } catch (error) {
    console.error(
      "GET /api/reports/inventory error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate inventory report",
      },
      { status: 500 }
    );
  }
}