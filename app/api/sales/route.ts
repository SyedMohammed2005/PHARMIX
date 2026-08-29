import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PaymentMethod,
  UserRole,
} from "@/src/generated/prisma/client";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import {
  getSales,
  createSale,
} from "@/services/sales.service";

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  quantity: z
    .number()
    .int()
    .positive("Quantity must be greater than 0"),
});

const createSaleSchema = z.object({
  customerId: z.string().optional(),

  items: z
    .array(saleItemSchema)
    .min(1, "At least one item is required"),

  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .default(0),

  paymentMethod: z.nativeEnum(PaymentMethod),
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
          message: "You are not authorized to view sales",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters
    const { searchParams } = new URL(request.url);
const customerId =
  searchParams.get("customerId") || undefined;

const search =
  searchParams.get("search") || undefined;

const paymentMethodParam =
  searchParams.get("paymentMethod");

const paymentMethod =
  paymentMethodParam &&
  Object.values(PaymentMethod).includes(
    paymentMethodParam as PaymentMethod
  )
    ? (paymentMethodParam as PaymentMethod)
    : undefined;

const startDateParam =
  searchParams.get("startDate");

const endDateParam =
  searchParams.get("endDate");

const startDate =
  startDateParam &&
  !Number.isNaN(
    new Date(startDateParam).getTime()
  )
    ? new Date(startDateParam)
    : undefined;

let endDate: Date | undefined;

if (
  endDateParam &&
  !Number.isNaN(
    new Date(endDateParam).getTime()
  )
) {
  endDate = new Date(endDateParam);

  // Include the complete selected day
  endDate.setHours(23, 59, 59, 999);
}

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

    // 4. Get sales from service
    const result = await getSales({
  customerId,
  search,
  paymentMethod,
  startDate,
  endDate,
  page,
  limit,
});

    // 5. Return response
    return NextResponse.json({
      success: true,
      count: result.sales.length,

      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },

      sales: result.sales,
    });
  } catch (error) {
    console.error(
      "GET /api/sales error:",
      error
    );

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
    const validation =
      createSaleSchema.safeParse(body);

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

    // 5. Create sale through service
    const result = await createSale({
      customerId: data.customerId,
      items: data.items,
      discount: data.discount,
      paymentMethod: data.paymentMethod,
    });

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
    console.error(
      "POST /api/sales error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create sale";

    // Known business errors
    if (
      message === "Customer not found" ||
      message.startsWith("Batch not found") ||
      message.startsWith("Inventory not found")
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 404 }
      );
    }

    if (
      message.startsWith(
        "Duplicate product and batch"
      ) ||
      message.startsWith(
        "Batch does not belong to product"
      ) ||
      message.startsWith("Batch") ||
      message.startsWith(
        "Insufficient batch stock"
      ) ||
      message.startsWith(
        "Discount cannot be greater"
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
        message: "Failed to create sale",
      },
      { status: 500 }
    );
  }
}