import { prisma } from "@/lib/prisma";
import {
  PaymentStatus,
  Prisma,
  StockTransactionType,
} from "@/src/generated/prisma/client";

type GetSalesParams = {
  customerId?: string;
  page: number;
  limit: number;
};

export async function getSales({
  customerId,
  page,
  limit,
}: GetSalesParams) {
  const skip = (page - 1) * limit;

  const where: Prisma.SaleWhereInput = {};

  if (customerId) {
    where.customerId = customerId;
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.sale.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    sales,
    total,
    totalPages,
  };
}

type ValidatedSaleItem = {
  item: {
    productId: string;
    batchId: string;
    quantity: number;
  };
  batch: Prisma.BatchGetPayload<{
    include: {
      product: {
        include: {
          inventory: true;
        };
      };
    };
  }>;
};

type CreateSaleParams = {
  customerId?: string;
  items: {
    productId: string;
    batchId: string;
    quantity: number;
  }[];
  discount: number;
  paymentMethod: Prisma.PaymentCreateInput["method"];
};

export async function createSale({
  customerId,
  items,
  discount,
  paymentMethod,
}: CreateSaleParams) {
  // 1. Check customer
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }
  }

  // 2. Prevent duplicate product + batch
  const itemKeys = items.map(
    (item) => `${item.productId}-${item.batchId}`
  );

  if (new Set(itemKeys).size !== itemKeys.length) {
    throw new Error(
      "Duplicate product and batch found in sale items"
    );
  }

  // 3. Validate batches
 const validatedItems: ValidatedSaleItem[] = [];

  for (const item of items) {
    const batch = await prisma.batch.findUnique({
      where: {
        id: item.batchId,
      },
      include: {
        product: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error(`Batch not found: ${item.batchId}`);
    }

    if (batch.productId !== item.productId) {
      throw new Error(
        `Batch does not belong to product: ${item.productId}`
      );
    }

    const today = new Date();

    if (batch.expiryDate < today) {
      throw new Error(
        `Batch ${batch.batchNumber} is expired`
      );
    }

    if (batch.quantity < item.quantity) {
      throw new Error(
        `Insufficient batch stock for ${batch.product.name}`
      );
    }

    if (!batch.product.inventory) {
      throw new Error(
        `Inventory not found for ${batch.product.name}`
      );
    }

    validatedItems.push({
      item,
      batch,
    });
  }

  // 4. Calculate totals
  let subtotal = 0;
  let tax = 0;

  for (const { item, batch } of validatedItems) {
    const itemSubtotal =
      batch.sellingPrice * item.quantity;

    const itemTax =
      itemSubtotal * (batch.product.gst / 100);

    subtotal += itemSubtotal;
    tax += itemTax;
  }

  const totalAmount =
    subtotal + tax - discount;

  if (totalAmount < 0) {
    throw new Error(
      "Discount cannot be greater than sale amount"
    );
  }

  // 5. Generate invoice
  const invoiceNumber = `INV-${Date.now()}`;

  // 6. Atomic transaction
  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        invoiceNumber,
        customerId,
        subtotal,
        discount,
        tax,
        totalAmount,
      },
    });

    for (const { item, batch } of validatedItems) {
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: batch.sellingPrice,
          gst: batch.product.gst,
          subtotal:
            batch.sellingPrice * item.quantity,
        },
      });

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

      await tx.inventory.update({
        where: {
          id: batch.product.inventory!.id,
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });

      await tx.stockTransaction.create({
        data: {
          inventoryId: batch.product.inventory!.id,
          type: StockTransactionType.SALE,
          quantity: item.quantity,
          reason: `Sale ${invoiceNumber}`,
        },
      });
    }

    const payment = await tx.payment.create({
      data: {
        saleId: sale.id,
        amount: totalAmount,
        method: paymentMethod,
        status: PaymentStatus.COMPLETED,
      },
    });

    return {
      sale,
      payment,
    };
  });
}