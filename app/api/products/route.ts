import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProductSchema } from "@/lib/validations/product";
import { UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";

export async function GET(request: Request) {
  
  try {
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
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 10, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "name",
      "sellingPrice",
      "purchasePrice",
      "mrp",
      "createdAt",
    ];

    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
      const where = {
  ...(search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            genericName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            brand: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            sku: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {}),

  ...(categoryId ? { categoryId } : {}),

  ...(supplierId ? { supplierId } : {}),
};
const total = await prisma.product.count({
  where,
});
const products = await prisma.product.findMany({
  where,

  include: {
    category: true,
    supplier: true,
    inventory: true,
  },

  orderBy: {
    [validSortBy]: sortOrder,
  },

  skip,
  take: limit,
});

   return NextResponse.json({
  success: true,
  count: products.length,

  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1,
  },

  products,
});
  } catch (error) {
    console.error("GET /api/products error:", error);

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
    // Check authentication
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

    // Check authorization
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to create products",
        },
        { status: 403 }
      );
    }

    // Existing product creation logic
    const body = await request.json();

    const validation = createProductSchema.safeParse(body);

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

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku },
          ...(data.barcode ? [{ barcode: data.barcode }] : []),
        ],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product with this SKU or barcode already exists",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        genericName: data.genericName,
        brand: data.brand,
        sku: data.sku,
        barcode: data.barcode,

        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        mrp: data.mrp,

        gst: data.gst,
        requiresPrescription: data.requiresPrescription,

        categoryId: data.categoryId,
        supplierId: data.supplierId,
      },

      include: {
        category: true,
        supplier: true,
        inventory: true,
        batches: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      { status: 500 }
    );
  }
}