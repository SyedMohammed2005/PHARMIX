import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  StockTransactionType,
  UserRole,
} from "@/src/generated/prisma/client";

const createPurchaseReturnSchema = z.object({
  purchaseId: z.string().min(1, "Purchase ID is required"),

  items: z
    .array(
      z.object({
        purchaseItemId: z
          .string()
          .min(1, "Purchase item ID is required"),

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
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to process purchase returns",
        },
        { status: 403 },
      );
    }

    // 3. Read request body
    const body = await request.json();

    // 4. Validate request body
    const validation = createPurchaseReturnSchema.safeParse(body);

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

    // 5. Find original purchase
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: data.purchaseId,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase not found",
        },
        { status: 404 },
      );
    }

    // 6. Prevent duplicate purchase items
    const itemIds = data.items.map(
      (item) => item.purchaseItemId,
    );

    if (new Set(itemIds).size !== itemIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate purchase item found",
        },
        { status: 400 },
      );
    }

    // 7. Validate return quantities
    const returnItems: {
      purchaseItem: (typeof purchase.items)[number];
      quantity: number;
      refundAmount: number;
    }[] = [];

    for (const item of data.items) {
      const purchaseItem = purchase.items.find(
        (existingItem) =>
          existingItem.id === item.purchaseItemId,
      );

      if (!purchaseItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Purchase item not found: ${item.purchaseItemId}`,
          },
          { status: 404 },
        );
      }

      // Calculate previously returned quantity
      const previousReturns =
        await prisma.purchaseReturnItem.aggregate({
          where: {
            purchaseItemId: purchaseItem.id,
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
        purchaseItem.quantity - alreadyReturned;

      if (item.quantity > remainingQuantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot return ${item.quantity}. Only ${remainingQuantity} remaining for this purchase item`,
          },
          { status: 400 },
        );
      }

      const refundAmount =
        purchaseItem.unitPrice * item.quantity;

      returnItems.push({
        purchaseItem,
        quantity: item.quantity,
        refundAmount,
      });
    }

    // 8. Calculate total refund
    const totalRefund = returnItems.reduce(
      (total, item) => total + item.refundAmount,
      0,
    );

    // 9. Generate purchase return number
    const returnNumber = `PRET-${Date.now()}`;

    // 10. Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const purchaseReturn =
        await tx.purchaseReturn.create({
          data: {
            returnNumber,
            purchaseId: purchase.id,
            totalRefund,
            reason: data.reason,
            status: "COMPLETED",
          },
        });

      for (const item of returnItems) {
        // Create purchase return item
        await tx.purchaseReturnItem.create({
          data: {
            returnId: purchaseReturn.id,
            purchaseItemId: item.purchaseItem.id,
            quantity: item.quantity,
            refundAmount: item.refundAmount,
          },
        });

        // Decrease batch quantity
        await tx.batch.update({
          where: {
            id: item.purchaseItem.batchId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Find inventory through product
        const product = await tx.product.findUnique({
          where: {
            id: item.purchaseItem.productId,
          },
          include: {
            inventory: true,
          },
        });

        if (!product?.inventory) {
          throw new Error(
            `Inventory not found for product ${item.purchaseItem.productId}`,
          );
        }

        // Prevent negative inventory
        if (
          product.inventory.quantity < item.quantity
        ) {
          throw new Error(
            `Insufficient inventory for product ${item.purchaseItem.productId}`,
          );
        }

        // Decrease inventory quantity
        await tx.inventory.update({
          where: {
            id: product.inventory.id,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Create RETURN stock transaction
        await tx.stockTransaction.create({
          data: {
            inventoryId: product.inventory.id,
            type: StockTransactionType.RETURN,
            quantity: item.quantity,
            reason: `Purchase Return ${returnNumber}`,
          },
        });
      }

      return purchaseReturn;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Purchase return processed successfully",
        return: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/purchases/returns error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process purchase return",
      },
      { status: 500 },
    );
  }
}