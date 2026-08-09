import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validations/product";
import { UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        supplier: true,
        inventory: true,
        batches: true,
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

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
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
          message: "You are not authorized to update products",
        },
        { status: 403 }
      );
    }

    // Get product ID
    const { id } = await context.params;

    // Read request body
    const body = await request.json();

    // Validate request body
    const validation = updateProductSchema.safeParse(body);

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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Check duplicate SKU
    if (data.sku && data.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          sku: data.sku,
          NOT: {
            id,
          },
        },
      });

      if (duplicateSku) {
        return NextResponse.json(
          {
            success: false,
            message: "Another product already uses this SKU",
          },
          { status: 409 }
        );
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data,
      include: {
        category: true,
        supplier: true,
        inventory: true,
        batches: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "PUT /api/products/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
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

    // Only ADMIN can delete products
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to delete products",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        inventory: true,
        batches: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    if (
      existingProduct.inventory ||
      existingProduct.batches.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete a product that has inventory or batches",
        },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/products/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}