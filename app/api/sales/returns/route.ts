import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { StockTransactionType, UserRole } from "@/src/generated/prisma/client";
import {
  PaymentStatus
} from "@/src/generated/prisma/client";

const createReturnSchema = z.object({
  saleId: z.string().min(1, "Sale ID is required"),
  items: z
    .array(
      z.object({
        saleItemId: z.string().min(1, "Sale item ID is required"),
        quantity: z
          .number()
          .int()
          .positive("Return quantity must be greater than 0"),
      }),
    )
    .min(1, "At least one return item is required"),
  reason: z.string().optional(),
});

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
        { status: 401 },
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
          message: "You are not authorized to process returns",
        },
        { status: 403 },
      );
    }

    // 3. Read body
    const body = await request.json();

    // 4. Validate body
    const validation = createReturnSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // 6. Prevent duplicate sale items
    const itemIds = data.items.map((item) => item.saleItemId);

    if (new Set(itemIds).size !== itemIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate sale item found",
        },
        { status: 400 },
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
        (existingItem) => existingItem.id === item.saleItemId,
      );

      if (!saleItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Sale item not found: ${item.saleItemId}`,
          },
          { status: 404 },
        );
      }

      // Calculate already returned quantity
      const previousReturns = await prisma.returnItem.aggregate({
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

      const alreadyReturned = previousReturns._sum.quantity ?? 0;

      const remainingQuantity = saleItem.quantity - alreadyReturned;

      if (item.quantity > remainingQuantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot return ${item.quantity}. Only ${remainingQuantity} remaining for this sale item`,
          },
          { status: 400 },
        );
      }

      const refundAmount = saleItem.unitPrice * item.quantity;

      returnItems.push({
        saleItem,
        quantity: item.quantity,
        refundAmount,
      });
    }

    // 8. Calculate total refund
    const totalRefund = returnItems.reduce(
      (total, item) => total + item.refundAmount,
      0,
    );

    // 9. Generate return number
    const returnNumber = `RET-${Date.now()}`;

    // 10. Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const saleReturn = await tx.saleReturn.create({
        data: {
          returnNumber,
          saleId: sale.id,
          totalRefund,
          reason: data.reason,
          status: "COMPLETED",
        },
      });

      for (const item of returnItems) {
        await tx.returnItem.create({
          data: {
            returnId: saleReturn.id,
            saleItemId: item.saleItem.id,
            quantity: item.quantity,
            refundAmount: item.refundAmount,
          },
        });

        // Update payment refund amount
if (sale.payment) {
  const newRefundedAmount =
    sale.payment.refundedAmount + totalRefund;

  if (newRefundedAmount > sale.payment.amount) {
    throw new Error(
      "Refund amount cannot exceed payment amount"
    );
  }

  await tx.payment.update({
    where: {
      id: sale.payment.id,
    },
    data: {
      refundedAmount: newRefundedAmount,
      status:
        newRefundedAmount === sale.payment.amount
          ? PaymentStatus.REFUNDED
          : PaymentStatus.COMPLETED,
    },
  });
}

        // Restore batch stock
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

        // Find inventory through product
        const product = await tx.product.findUnique({
          where: {
            id: item.saleItem.productId,
          },
          include: {
            inventory: true,
          },
        });

        if (!product?.inventory) {
          throw new Error(
            `Inventory not found for product ${item.saleItem.productId}`,
          );
        }

        // Restore inventory stock
        await tx.inventory.update({
          where: {
            id: product.inventory.id,
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // Create RETURN stock transaction
        await tx.stockTransaction.create({
          data: {
            inventoryId: product.inventory.id,
            type: StockTransactionType.RETURN,
            quantity: item.quantity,
            reason: `Return ${returnNumber}`,
          },
        });
      }

      return saleReturn;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sale return processed successfully",
        return: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/sales/returns error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process sale return",
      },
      { status: 500 },
    );
  }
}
