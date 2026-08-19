import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from "@/src/generated/prisma/client";

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  gst: z.number().min(0, "GST cannot be negative").default(0),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID is required"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
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
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to create purchases",
        },
        { status: 403 },
      );
    }

    // 3. Read request body
    const body = await request.json();

    // 4. Validate request
    const validation = createPurchaseSchema.safeParse(body);

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

    // 5. Check supplier
    const supplier = await prisma.supplier.findUnique({
      where: {
        id: data.supplierId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 },
      );
    }

    // 6. Prevent duplicate product/batch combinations
    const itemKeys = data.items.map(
      (item) => `${item.productId}-${item.batchId}`,
    );

    if (new Set(itemKeys).size !== itemKeys.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate product and batch found in purchase items",
        },
        { status: 400 },
      );
    }

    // 7. Validate products and batches
    const validatedItems = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: `Product not found: ${item.productId}`,
          },
          { status: 404 },
        );
      }

      const batch = await prisma.batch.findUnique({
        where: {
          id: item.batchId,
        },
      });

      if (!batch) {
        return NextResponse.json(
          {
            success: false,
            message: `Batch not found: ${item.batchId}`,
          },
          { status: 404 },
        );
      }

      // Batch must belong to selected product
      if (batch.productId !== item.productId) {
        return NextResponse.json(
          {
            success: false,
            message: `Batch does not belong to product: ${product.name}`,
          },
          { status: 400 },
        );
      }

      validatedItems.push({
        item,
        product,
        batch,
      });
    }

    // 8. Calculate totals
    let subtotal = 0;
    let tax = 0;

    const purchaseItemsData = validatedItems.map(({ item }) => {
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

    const totalAmount = subtotal + tax - data.discount;

    if (totalAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount cannot be greater than purchase amount",
        },
        { status: 400 },
      );
    }

    // 9. Generate purchase number
    const purchaseNumber = `PUR-${Date.now()}`;

    // 10. Create purchase transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create purchase
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          subtotal,
          discount: data.discount,
          tax,
          totalAmount,

          items: {
            create: purchaseItemsData,
          },

          payment: {
            create: {
              amount: totalAmount,
              method: data.paymentMethod,
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

      // Update inventory and batches
      for (const item of data.items) {
        // Increase batch quantity
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

        // Find inventory
        const inventory = await tx.inventory.findUnique({
          where: {
            productId: item.productId,
          },
        });

        if (!inventory) {
          throw new Error(`Inventory not found for product: ${item.productId}`);
        }

        // Increase inventory quantity
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

        // Record stock movement
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

    return NextResponse.json(
      {
        success: true,
        message: "Purchase created successfully",
        purchase,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/purchases error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process purchase",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
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

    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view purchases",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

const search = searchParams.get("search")?.trim() || "";
const supplierId = searchParams.get("supplierId")?.trim() || "";
const startDate = searchParams.get("startDate")?.trim() || "";
const endDate = searchParams.get("endDate")?.trim() || "";
const paymentMethod =
  searchParams.get("paymentMethod")?.trim().toUpperCase() || "";

const requestedSort = searchParams.get("sortBy") || "createdAt";

const allowedSortFields = [
  "createdAt",
  "purchaseNumber",
  "totalAmount",
  "subtotal",
];

const sortBy = allowedSortFields.includes(requestedSort)
  ? requestedSort
  : "createdAt";

const order = searchParams.get("order") === "asc" ? "asc" : "desc";

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
                gte: new Date(`${startDate}T00:00:00.000Z`),
              }
            : {}),
          ...(endDate
            ? {
                lte: new Date(`${endDate}T23:59:59.999Z`),
              }
            : {}),
        },
      }
    : {}),
    ...(paymentMethod
  ? {
      payment: {
        method: paymentMethod as PaymentMethod,
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
    [sortBy]: order,
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
    return NextResponse.json(
      {
        success: true,
        count: purchases.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        purchases,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/purchases error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch purchases",
      },
      { status: 500 },
    );
  }
}
