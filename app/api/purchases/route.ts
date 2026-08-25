import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PaymentMethod,
  UserRole,
} from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  createPurchase,
  findSupplierById,
  getPurchases,
  validatePurchaseItems,
} from "@/services/purchase.service";

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  gst: z.number().min(0, "GST cannot be negative").default(0),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID is required"),
  items: z
    .array(purchaseItemSchema)
    .min(1, "At least one item is required"),
  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .default(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export async function POST(request: Request) {
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
          message: "You are not authorized to create purchases",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

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

    const supplier = await findSupplierById(data.supplierId);

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 },
      );
    }

    const itemKeys = data.items.map(
      (item) => `${item.productId}-${item.batchId}`,
    );

    if (new Set(itemKeys).size !== itemKeys.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate product and batch found in purchase items",
        },
        { status: 400 },
      );
    }

    try {
      await validatePurchaseItems(data.items);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid purchase item";

      if (message.startsWith("Product not found")) {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 404 },
        );
      }

      if (message.startsWith("Batch not found")) {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 },
      );
    }

    const purchase = await createPurchase({
      supplierId: data.supplierId,
      items: data.items,
      discount: data.discount,
      paymentMethod: data.paymentMethod,
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

    const search =
      searchParams.get("search")?.trim() || "";

    const supplierId =
      searchParams.get("supplierId")?.trim() || "";

    const startDate =
      searchParams.get("startDate")?.trim() || "";

    const endDate =
      searchParams.get("endDate")?.trim() || "";

    const paymentMethod =
      searchParams
        .get("paymentMethod")
        ?.trim()
        .toUpperCase() || "";

    const validPaymentMethods =
      Object.values(PaymentMethod);

    if (
      paymentMethod &&
      !validPaymentMethods.includes(
        paymentMethod as PaymentMethod,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 },
      );
    }

    const requestedSort =
      searchParams.get("sortBy") || "createdAt";

    const allowedSortFields = [
      "createdAt",
      "purchaseNumber",
      "totalAmount",
      "subtotal",
    ];

    const sortBy = allowedSortFields.includes(
      requestedSort,
    )
      ? requestedSort
      : "createdAt";

    const order =
      searchParams.get("order") === "asc"
        ? "asc"
        : "desc";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 10,
        1,
      ),
      100,
    );

    const result = await getPurchases({
      search,
      supplierId,
      startDate,
      endDate,
      paymentMethod: paymentMethod
        ? (paymentMethod as PaymentMethod)
        : undefined,
      sortBy,
      order,
      page,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        count: result.purchases.length,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(
            result.total / result.limit,
          ),
        },
        purchases: result.purchases,
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