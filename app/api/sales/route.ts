import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { getSales } from "@/services/sales.service";
import { createSale } from "@/services/sales.service";
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
    const { sales, total, totalPages } = await getSales({
  customerId: customerId ?? undefined,
  page,
  limit,
});

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

    // 5. Create sale through service
    const result = await createSale(validation.data);

    // 6. Return response
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

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create sale";

    // Business validation errors
    const validationMessages = [
      "Customer not found",
      "Duplicate product and batch found in sale items",
      "Batch not found",
      "Batch does not belong to product",
      "is expired",
      "Insufficient batch stock",
      "Inventory not found",
      "Discount cannot be greater than sale amount",
    ];

    const isValidationError = validationMessages.some(
      (item) => message.includes(item)
    );

    if (isValidationError) {
      const status = message.includes("not found")
        ? 404
        : 400;

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create sale",
      },
      { status: 500 }
    );
  }
}