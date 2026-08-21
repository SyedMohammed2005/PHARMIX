import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { updateProductSchema } from "@/lib/validations/product";
import { UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/services/product.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "GET /api/products/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
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
            "You are not authorized to update products",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const body = await request.json();

    const validation =
      updateProductSchema.safeParse(body);

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

    const product = await updateProduct(
      id,
      validation.data,
    );

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(
      "PUT /api/products/[id] error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message.includes(
        "already uses this SKU",
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product with this SKU or barcode already exists",
          },
          { status: 409 },
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid category or supplier",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
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
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to delete products",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/products/[id] error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message.includes(
        "inventory or batches",
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
        message: "Failed to delete product",
      },
      { status: 500 },
    );
  }
}