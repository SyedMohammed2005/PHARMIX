import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  StockTransactionType,
  UserRole,
} from "@/src/generated/prisma/client";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

const createSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .default(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

type ValidatedItem = {
  item: z.infer<typeof saleItemSchema>;
  batch: {
    id: string;
    batchNumber: string;
    productId: string;
    manufactureDate: Date;
    expiryDate: Date;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    createdAt: Date;
    updatedAt: Date;
    product: {
      id: string;
      gst: number;
      inventory: {
        id: string;
        productId: string;
        quantity: number;
        minimumStock: number;
        maximumStock: number | null;
        reorderPoint: number;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    };
  };
};

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
          message: "You are not authorized to view sales",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters
    const { searchParams } = new URL(request.url);

    const customerId = searchParams.get("customerId");

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

    // 4. Build filter
    const where: Prisma.SaleWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    // 5. Get sales + total count
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

    // 6. Return response
    return NextResponse.json({
      success: true,
      count: sales.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      sales,
    });
  } catch (error) {
    console.error("GET /api/sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales",
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
          message: "You are not authorized to create sales",
        },
        { status: 403 }
      );
    }

    // 3. Read request body
    const body = await request.json();

    // 4. Validate request
    const validation = createSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 5. Check customer if provided
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: data.customerId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer not found",
          },
          { status: 404 }
        );
      }
    }

    // 6. Prevent duplicate products/batches in same sale
    const itemKeys = data.items.map(
      (item) => `${item.productId}-${item.batchId}`
    );

    if (new Set(itemKeys).size !== itemKeys.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate product and batch found in sale items",
        },
        { status: 400 }
      );
    }

    // 7. Load and validate all batches before transaction
   const validatedItems: ValidatedItem[] = [];

    for (const item of data.items) {
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
        return NextResponse.json(
          {
            success: false,
            message: `Batch not found: ${item.batchId}`,
          },
          { status: 404 }
        );
      }

      // Batch must belong to selected product
      if (batch.productId !== item.productId) {
        return NextResponse.json(
          {
            success: false,
            message: `Batch does not belong to product: ${item.productId}`,
          },
          { status: 400 }
        );
      }

      // Expiry check
      const today = new Date();

      if (batch.expiryDate < today) {
        return NextResponse.json(
          {
            success: false,
            message: `Batch ${batch.batchNumber} is expired`,
          },
          { status: 400 }
        );
      }

      // Batch stock check
      if (batch.quantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient batch stock for ${batch.product.name}`,
          },
          { status: 400 }
        );
      }

      // Product inventory must exist
      if (!batch.product.inventory) {
        return NextResponse.json(
          {
            success: false,
            message: `Inventory not found for ${batch.product.name}`,
          },
          { status: 404 }
        );
      }

      validatedItems.push({
        item,
        batch,
      });
    }

    // 8. Calculate totals
    let subtotal = 0;
    let tax = 0;

    const saleItemsData = validatedItems.map(({ item, batch }) => {
      const unitPrice = batch.sellingPrice;

      const itemSubtotal = unitPrice * item.quantity;

      const itemTax =
        itemSubtotal * (batch.product.gst / 100);

      subtotal += itemSubtotal;
      tax += itemTax;

      return {
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice,
        gst: batch.product.gst,
        subtotal: itemSubtotal,
      };
    });

    const totalAmount =
      subtotal + tax - data.discount;

    if (totalAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount cannot be greater than sale amount",
        },
        { status: 400 }
      );
    }

    // 9. Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // 10. Atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          subtotal,
          discount: data.discount,
          tax,
          totalAmount,
        },
      });

      // Create Sale Items + update stock
      for (const {
        item,
        batch,
      } of validatedItems) {
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

        // Reduce batch stock
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

        // Reduce inventory stock
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

        // Create stock transaction
        await tx.stockTransaction.create({
          data: {
            inventoryId: batch.product.inventory!.id,
            type: StockTransactionType.SALE,
            quantity: item.quantity,
            reason: `Sale ${invoiceNumber}`,
          },
        });
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: totalAmount,
          method: data.paymentMethod,
          status: PaymentStatus.COMPLETED,
        },
      });

      return {
        sale,
        payment,
      };
    });

    // 11. Return response
    return NextResponse.json(
      {
        success: true,
        message: "Sale created successfully",
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create sale",
      },
      { status: 500 }
    );
  }
}