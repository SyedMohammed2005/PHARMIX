import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import {
  PaymentStatus,
  StockTransactionType,
  UserRole,
} from "@/src/generated/prisma/client";

const createReturnSchema = z.object({
  saleId: z.string().min(1, "Sale ID is required"),

  items: z
    .array(
      z.object({
        saleItemId: z
          .string()
          .min(1, "Sale item ID is required"),

        quantity: z
          .number()
          .int()
          .positive(
            "Return quantity must be greater than 0"
          ),
      })
    )
    .min(1, "At least one return item is required"),

  reason: z.string().optional(),
});

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
      UserRole.PHARMACIST,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view returns",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // 4. Fetch returns and total count
    const [returns, total] = await Promise.all([
      prisma.saleReturn.findMany({
        include: {
          sale: {
            include: {
              customer: true,
            },
          },
          items: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.saleReturn.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // 5. Return response
    return NextResponse.json({
      success: true,
      count: returns.length,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      returns,
    });
  } catch (error) {
    console.error(
      "GET /api/sales/returns error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch returns",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to process returns",
        },
        { status: 403 }
      );
    }

    // 3. Read request body
    const body = await request.json();

    // 4. Validate request body
    const validation =
      createReturnSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 5. Find original sale
    const sale = await prisma.sale.findUnique({
      where: {
        id: data.saleId,
      },

      include: {
        items: true,
        payment: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale not found",
        },
        { status: 404 }
      );
    }

    // 6. Prevent duplicate sale items
    const itemIds = data.items.map(
      (item) => item.saleItemId
    );

    if (
      new Set(itemIds).size !== itemIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate sale item found",
        },
        { status: 400 }
      );
    }

    // 7. Validate return quantities
    const returnItems: {
      saleItem: (typeof sale.items)[number];
      quantity: number;
      refundAmount: number;
    }[] = [];

    for (const item of data.items) {
      const saleItem = sale.items.find(
        (existingItem) =>
          existingItem.id === item.saleItemId
      );

      if (!saleItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Sale item not found: ${item.saleItemId}`,
          },
          { status: 404 }
        );
      }

      // Calculate already returned quantity
      const previousReturns =
        await prisma.returnItem.aggregate({
          where: {
            saleItemId: saleItem.id,

            return: {
              status: "COMPLETED",
            },
          },

          _sum: {
            quantity: true,
          },
        });

      const alreadyReturned =
        previousReturns._sum.quantity ?? 0;

      const remainingQuantity =
        saleItem.quantity - alreadyReturned;

      // Check requested quantity
      if (item.quantity > remainingQuantity) {
        return NextResponse.json(
          {
            success: false,

            message: `Cannot return ${item.quantity}. Only ${remainingQuantity} remaining for this sale item`,
          },
          { status: 400 }
        );
      }

      // Calculate refund
      const refundAmount =
        saleItem.unitPrice * item.quantity;

      returnItems.push({
        saleItem,
        quantity: item.quantity,
        refundAmount,
      });
    }

    // 8. Calculate total refund
    const totalRefund = returnItems.reduce(
      (total, item) =>
        total + item.refundAmount,
      0
    );

    // 9. Generate return number
    const returnNumber = `RET-${Date.now()}`;

    // 10. Process everything atomically
    const result = await prisma.$transaction(
      async (tx) => {
        // Create sale return
        const saleReturn =
          await tx.saleReturn.create({
            data: {
              returnNumber,
              saleId: sale.id,
              totalRefund,
              reason: data.reason,
              status: "COMPLETED",
            },
          });

        // Process every returned item
        for (const item of returnItems) {
          // Create return item
          await tx.returnItem.create({
            data: {
              returnId: saleReturn.id,
              saleItemId: item.saleItem.id,
              quantity: item.quantity,
              refundAmount: item.refundAmount,
            },
          });

          // Restore batch quantity
          await tx.batch.update({
            where: {
              id: item.saleItem.batchId,
            },

            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });

          // Find inventory
          const inventory =
            await tx.inventory.findFirst({
              where: {
                productId:
                  item.saleItem.productId,
              },

              select: {
                id: true,
              },
            });

          if (!inventory) {
            throw new Error(
              `Inventory not found for product ${item.saleItem.productId}`
            );
          }

          // Restore inventory quantity
          await tx.inventory.update({
            where: {
              id: inventory.id,
            },

            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });

          // Create stock transaction
          await tx.stockTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: StockTransactionType.RETURN,
              quantity: item.quantity,
              reason: `Return ${returnNumber}`,
            },
          });
        }

        // Update payment ONCE
        if (sale.payment) {
          const newRefundedAmount =
            sale.payment.refundedAmount +
            totalRefund;

          if (
            newRefundedAmount >
            sale.payment.amount
          ) {
            throw new Error(
              "Refund amount cannot exceed payment amount"
            );
          }

          await tx.payment.update({
            where: {
              id: sale.payment.id,
            },

            data: {
              refundedAmount:
                newRefundedAmount,

              status:
                newRefundedAmount ===
                sale.payment.amount
                  ? PaymentStatus.REFUNDED
                  : PaymentStatus.COMPLETED,
            },
          });
        }

        return saleReturn;
      },

      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    // 11. Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "Sale return processed successfully",
        return: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/sales/returns error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to process sale return";

    // Business errors
    if (
      message.includes("Inventory not found") ||
      message.includes(
        "Refund amount cannot exceed"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process sale return",
      },
      { status: 500 }
    );
  }
}