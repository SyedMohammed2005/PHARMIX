import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations/category";
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

    const products = await prisma.product.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  genericName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  brand: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  sku: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(categoryId
          ? {
              categoryId,
            }
          : {}),

        ...(supplierId
          ? {
              supplierId,
            }
          : {}),
      },

      include: {
        category: true,
        supplier: true,
        inventory: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 }
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
    { status: 401 }
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
      message: "You are not authorized to create categories",
    },
    { status: 403 }
  );
}
    const body = await request.json();

    const validation = createCategorySchema.safeParse(body);

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

    const existingCategory = await prisma.category.findUnique({
      where: {
        name: validation.data.name,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: validation.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 }
    );
  }
}