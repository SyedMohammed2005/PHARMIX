import { NextResponse } from "next/server";
import { createProductSchema } from "@/lib/validations/product";
import { UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  getProducts,
  createProduct,
} from "@/services/product.service";

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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const categoryId =
      searchParams.get("categoryId") || undefined;
    const supplierId =
      searchParams.get("supplierId") || undefined;

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

    const sortBy =
      searchParams.get("sortBy") || "createdAt";

    const sortOrder =
      searchParams.get("sortOrder") === "asc"
        ? "asc"
        : "desc";

    const result = await getProducts({
      search,
      categoryId,
      supplierId,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      count: result.products.length,

      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage:
          result.page < result.totalPages,
        hasPreviousPage:
          result.page > 1,
      },

      products: result.products,
    });
  } catch (error) {
    console.error(
      "GET /api/products error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}

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
          message:
            "You are not authorized to create products",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validation =
      createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const product = await createProduct(
      validation.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/products error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message.includes(
        "SKU or barcode already exists",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      { status: 500 },
    );
  }
}