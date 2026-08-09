import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInventorySchema } from "@/lib/validations/inventory";
import { UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";

export async function GET() {

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
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("GET /api/inventory error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory",
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
      message: "You are not authorized to create inventory",
    },
    { status: 403 }
  );
}
    const body = await request.json();

    const validation = createInventorySchema.safeParse(body);

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

    const product = await prisma.product.findUnique({
      where: {
        id: data.productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    const existingInventory = await prisma.inventory.findUnique({
      where: {
        productId: data.productId,
      },
    });

    if (existingInventory) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory already exists for this product",
        },
        { status: 409 }
      );
    }

    if (
      data.maximumStock !== undefined &&
      data.maximumStock < data.minimumStock
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum stock cannot be less than minimum stock",
        },
        { status: 400 }
      );
    }

    const inventory = await prisma.inventory.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        minimumStock: data.minimumStock,
        maximumStock: data.maximumStock,
        reorderPoint: data.reorderPoint,
      },
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Inventory created successfully",
        inventory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inventory error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create inventory",
      },
      { status: 500 }
    );
  }
}