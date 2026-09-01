import { prisma } from "@/lib/prisma";
import {
  ReturnStatus,
  StockTransactionType,
} from "@/src/generated/prisma/client";

type PurchaseReturnItemInput = {
  purchaseItemId: string;
  quantity: number;
};

type CreatePurchaseReturnInput = {
  purchaseId: string;
  reason?: string | null;
  items: PurchaseReturnItemInput[];
};

type ValidatedReturnItem = {
  purchaseItemId: string;
  productId: string;
  batchId: string;
  inventoryId: string;
  quantity: number;
  refundAmount: number;
};

export async function createPurchaseReturn(
  data: CreatePurchaseReturnInput,
) {
  const { purchaseId, reason, items } = data;

  // ----------------------------------
  // 1. BASIC VALIDATION
  // ----------------------------------

  if (!purchaseId) {
    throw new Error("Purchase ID is required");
  }

  if (!items || items.length === 0) {
    throw new Error(
      "At least one item is required for a return",
    );
  }

  // Prevent same purchase item twice
  const purchaseItemIds = items.map(
    (item) => item.purchaseItemId,
  );

  if (
    new Set(purchaseItemIds).size !==
    purchaseItemIds.length
  ) {
    throw new Error(
      "Duplicate purchase item found in return",
    );
  }

  // ----------------------------------
  // 2. LOAD ORIGINAL PURCHASE
  // ----------------------------------

  const purchase = await prisma.purchase.findUnique({
    where: {
      id: purchaseId,
    },

    include: {
      items: {
        include: {
          product: {
            include: {
              inventory: true,
            },
          },

          batch: true,

          returnItems: {
            include: {
              return: true,
            },
          },
        },
      },
    },
  });

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  // ----------------------------------
  // 3. VALIDATE RETURN ITEMS
  // ----------------------------------

  const validatedItems: ValidatedReturnItem[] = [];

  for (const returnItem of items) {
    if (
      !Number.isInteger(returnItem.quantity) ||
      returnItem.quantity <= 0
    ) {
      throw new Error(
        "Return quantity must be a positive whole number",
      );
    }

    const purchaseItem = purchase.items.find(
      (item) =>
        item.id === returnItem.purchaseItemId,
    );

    if (!purchaseItem) {
      throw new Error(
        "Purchase item does not belong to this purchase",
      );
    }

    // Count only completed previous returns
    const alreadyReturnedQuantity =
      purchaseItem.returnItems
        .filter(
          (returnItemRecord) =>
            returnItemRecord.return.status ===
            ReturnStatus.COMPLETED,
        )
        .reduce(
          (total, returnItemRecord) =>
            total + returnItemRecord.quantity,
          0,
        );

    const availableQuantity =
      purchaseItem.quantity -
      alreadyReturnedQuantity;

    if (
      returnItem.quantity > availableQuantity
    ) {
      throw new Error(
        `Cannot return ${returnItem.quantity} item(s) of ${purchaseItem.product.name}. Only ${availableQuantity} item(s) are available for return.`,
      );
    }

    // Inventory must exist
    const inventory =
      purchaseItem.product.inventory;

    if (!inventory) {
      throw new Error(
        `Inventory not found for product: ${purchaseItem.product.name}`,
      );
    }

    // Purchase return removes stock from pharmacy
    if (
      purchaseItem.batch.quantity <
      returnItem.quantity
    ) {
      throw new Error(
        `Insufficient batch stock for ${purchaseItem.product.name}`,
      );
    }

    if (
      inventory.quantity <
      returnItem.quantity
    ) {
      throw new Error(
        `Insufficient inventory stock for ${purchaseItem.product.name}`,
      );
    }

    const refundAmount =
      purchaseItem.unitPrice *
      returnItem.quantity;

    validatedItems.push({
      purchaseItemId: purchaseItem.id,
      productId: purchaseItem.productId,
      batchId: purchaseItem.batchId,
      inventoryId: inventory.id,
      quantity: returnItem.quantity,
      refundAmount,
    });
  }

  // ----------------------------------
  // 4. CALCULATE TOTAL REFUND
  // ----------------------------------

  const totalRefund = validatedItems.reduce(
    (total, item) =>
      total + item.refundAmount,
    0,
  );

  const returnNumber = `PRET-${Date.now()}`;

  // ----------------------------------
  // 5. ATOMIC DATABASE TRANSACTION
  // ----------------------------------

  const result = await prisma.$transaction(
    async (tx) => {
      // Create main return record
      const purchaseReturn =
        await tx.purchaseReturn.create({
          data: {
            returnNumber,
            purchaseId,
            totalRefund,
            reason: reason?.trim() || null,
            status: ReturnStatus.COMPLETED,
          },
        });

      for (const item of validatedItems) {
        // Create return item
        await tx.purchaseReturnItem.create({
          data: {
            // Your Prisma field is returnId
            returnId: purchaseReturn.id,

            purchaseItemId:
              item.purchaseItemId,

            quantity: item.quantity,

            refundAmount:
              item.refundAmount,
          },
        });

        // Remove returned stock from batch
        await tx.batch.update({
          where: {
            id: item.batchId,
          },

          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Remove returned stock from inventory
        await tx.inventory.update({
          where: {
            id: item.inventoryId,
          },

          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Your enum currently uses RETURN.
        // The reason identifies it as a supplier purchase return.
        await tx.stockTransaction.create({
          data: {
            inventoryId:
              item.inventoryId,

            type:
              StockTransactionType.RETURN,

            quantity: item.quantity,

            reason:
              `Purchase Return ${returnNumber}`,
          },
        });
      }

      // Return complete saved return
      return tx.purchaseReturn.findUnique({
        where: {
          id: purchaseReturn.id,
        },

        include: {
          items: {
            include: {
              purchaseItem: {
                include: {
                  product: true,
                  batch: true,
                },
              },
            },
          },

          purchase: {
            include: {
              supplier: true,
            },
          },
        },
      });
    },

    {
      maxWait: 5000,
      timeout: 30000,
    },
  );

  return result;
}