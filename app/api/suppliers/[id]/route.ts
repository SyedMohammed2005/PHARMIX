import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSupplierSchema = z.object({
  name: z.string().min(2).optional(),

  email: z.string().email("Invalid email").optional(),

  phone: z.string().min(10).optional(),

  address: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const validation = updateSupplierSchema.safeParse(body);

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

    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        id,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 }
      );
    }

    if (validation.data.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: {
          email: validation.data.email,
          NOT: {
            id,
          },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Another supplier already uses this email",
          },
          { status: 409 }
        );
      }
    }

    const supplier = await prisma.supplier.update({
      where: {
        id,
      },
      data: validation.data,
      include: {
        products: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error("PUT /api/suppliers/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update supplier",
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
    const { id } = await context.params;

    const supplier = await prisma.supplier.findUnique({
      where: {
        id,
      },
      include: {
        products: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 }
      );
    }

    if (supplier.products.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete supplier because products are linked to this supplier",
          productCount: supplier.products.length,
        },
        { status: 409 }
      );
    }

    await prisma.supplier.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/suppliers/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete supplier",
      },
      { status: 500 }
    );
  }
}