import { prisma } from "@/lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
} from "@/src/generated/prisma/client";

type PurchaseItemInput = {
  productId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  gst: number;
};

type CreatePurchaseInput = {
  supplierId: string;
  items: PurchaseItemInput[];
  discount: number;
  paymentMethod: PaymentMethod;
};

export async function findSupplierById(supplierId: string) {
  return prisma.supplier.findUnique({
    where: {
      id: supplierId,
    },
  });
}

export async function validatePurchaseItems(
  items: PurchaseItemInput[],
) {
  const validatedItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: {
        id: item.productId,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const batch = await prisma.batch.findUnique({
      where: {
        id: item.batchId,
      },
    });

    if (!batch) {
      throw new Error(`Batch not found: ${item.batchId}`);
    }

    if (batch.productId !== item.productId) {
      throw new Error(
        `Batch does not belong to product: ${product.name}`,
      );
    }

    validatedItems.push({
      item,
      product,
      batch,
    });
  }

  return validatedItems;
}

export function calculatePurchaseTotals(
  items: PurchaseItemInput[],
  discount: number,
) {
  let subtotal = 0;
  let tax = 0;

  const purchaseItemsData = items.map((item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    const itemTax = itemSubtotal * (item.gst / 100);

    subtotal += itemSubtotal;
    tax += itemTax;

    return {
      productId: item.productId,
      batchId: item.batchId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gst: item.gst,
      subtotal: itemSubtotal,
    };
  });

  const totalAmount = subtotal + tax - discount;

  return {
    purchaseItemsData,
    subtotal,
    tax,
    totalAmount,
  };
}

export async function createPurchase(
  data: CreatePurchaseInput,
) {
  const {
    supplierId,
    items,
    discount,
    paymentMethod,
  } = data;

  const {
    purchaseItemsData,
    subtotal,
    tax,
    totalAmount,
  } = calculatePurchaseTotals(items, discount);

  const purchaseNumber = `PUR-${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    const createdPurchase = await tx.purchase.create({
      data: {
        purchaseNumber,
        supplierId,
        subtotal,
        discount,
        tax,
        totalAmount,

        items: {
          create: purchaseItemsData,
        },

        payment: {
          create: {
            amount: totalAmount,
            method: paymentMethod,
            status: PaymentStatus.COMPLETED,
          },
        },
      },

      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        payment: true,
      },
    });

    for (const item of items) {
      await tx.batch.update({
        where: {
          id: item.batchId,
        },
        data: {
          quantity: {
            increment: item.quantity,
          },
          purchasePrice: item.unitPrice,
        },
      });

      const inventory = await tx.inventory.findUnique({
        where: {
          productId: item.productId,
        },
      });

      if (!inventory) {
        throw new Error(
          `Inventory not found for product: ${item.productId}`,
        );
      }

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

      await tx.stockTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: "PURCHASE",
          quantity: item.quantity,
          reason: `Purchase ${purchaseNumber}`,
        },
      });
    }

    return createdPurchase;
  });
}

type PurchaseFilters = {
  search?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  sortBy?: string;
  order?: "asc" | "desc";
  page: number;
  limit: number;
};

const allowedSortFields = [
  "createdAt",
  "purchaseNumber",
  "totalAmount",
  "subtotal",
] as const;

export async function getPurchases(
  filters: PurchaseFilters,
) {
  const {
    search = "",
    supplierId = "",
    startDate = "",
    endDate = "",
    paymentMethod,
    sortBy = "createdAt",
    order = "desc",
    page,
    limit,
  } = filters;

  const safeSortBy = allowedSortFields.includes(
    sortBy as (typeof allowedSortFields)[number],
  )
    ? sortBy
    : "createdAt";

  const skip = (page - 1) * limit;

  const where = {
    ...(search
      ? {
          OR: [
            {
              purchaseNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              supplier: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),

    ...(supplierId
      ? {
          supplierId,
        }
      : {}),

    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate
              ? {
                  gte: new Date(
                    `${startDate}T00:00:00.000Z`,
                  ),
                }
              : {}),

            ...(endDate
              ? {
                  lte: new Date(
                    `${endDate}T23:59:59.999Z`,
                  ),
                }
              : {}),
          },
        }
      : {}),

    ...(paymentMethod
      ? {
          payment: {
            method: paymentMethod,
          },
        }
      : {}),
  };

  const total = await prisma.purchase.count({
    where,
  });

  const purchases = await prisma.purchase.findMany({
    where,
    skip,
    take: limit,

    orderBy: {
      [safeSortBy]: order,
    },

    include: {
      supplier: true,

      items: {
        include: {
          product: true,
          batch: true,
        },
      },

      payment: true,
    },
  });

  return {
    purchases,
    total,
    page,
    limit,
  };
}