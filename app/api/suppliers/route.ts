import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        { status: 401 },
      );
    }
    const suppliers = await prisma.supplier.findMany({
      include: {
        products: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("GET /api/suppliers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch suppliers",
      },
      { status: 500 },
    );
  }
}

import { createSupplierSchema } from "@/lib/validations/supplier";

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
          message: "You are not authorized to create suppliers",
        },
        { status: 403 },
      );
    }
    const body = await request.json();

    const validation = createSupplierSchema.safeParse(body);

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

    if (data.email) {
      const existingSupplier = await prisma.supplier.findUnique({
        where: {
          email: data.email,
        },
      });

      if (existingSupplier) {
        return NextResponse.json(
          {
            success: false,
            message: "Supplier with this email already exists",
          },
          { status: 409 },
        );
      }
    }

    const supplier = await prisma.supplier.create({
      data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Supplier created successfully",
        supplier,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/suppliers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create supplier",
      },
      { status: 500 },
    );
  }
}
