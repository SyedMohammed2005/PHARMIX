import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  StockTransactionType,
  UserRole,
} from "@/src/generated/prisma/client";

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
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view stock analytics",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters
    const { searchParams } = new URL(request.url);

    const days = Math.min(
      Math.max(Number(searchParams.get("days")) || 30, 1),
      365
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // 4. Get stock transactions
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

    // 5. Initialize movement summary
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

    // 6. Calculate movement summary
    for (const transaction of transactions) {
      movementSummary[transaction.type].transactionCount += 1;
      movementSummary[transaction.type].totalQuantity += Math.abs(
        transaction.quantity
      );
    }

    // 7. Calculate net stock movement
    let stockAdded = 0;
    let stockRemoved = 0;

    for (const transaction of transactions) {
      if (
        transaction.type === StockTransactionType.PURCHASE ||
        transaction.type === StockTransactionType.RETURN
      ) {
        stockAdded += Math.abs(transaction.quantity);
      }

      if (
        transaction.type === StockTransactionType.SALE ||
        transaction.type === StockTransactionType.DAMAGE
      ) {
        stockRemoved += Math.abs(transaction.quantity);
      }

      if (transaction.type === StockTransactionType.ADJUSTMENT) {
        if (transaction.quantity >= 0) {
          stockAdded += transaction.quantity;
        } else {
          stockRemoved += Math.abs(transaction.quantity);
        }
      }
    }

    const netMovement = stockAdded - stockRemoved;

    // 8. Product-level movement
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

      const quantity = Math.abs(transaction.quantity);

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
          productMovement[product.id].adjusted += transaction.quantity;
          break;
      }
    }

    // 9. Return response
    return NextResponse.json({
      success: true,

      filters: {
        days,
        startDate,
      },

      summary: {
        totalTransactions: transactions.length,
        stockAdded,
        stockRemoved,
        netMovement,
      },

      byType: Object.entries(movementSummary).map(
        ([type, values]) => ({
          type,
          ...values,
        })
      ),

      byProduct: Object.values(productMovement),
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/stock-movements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stock movement analytics",
      },
      { status: 500 }
    );
  }
}