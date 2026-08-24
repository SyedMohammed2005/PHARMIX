import { NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { createSupplierSchema } from "@/lib/validations/supplier";
import {
  getSuppliers,
  createSupplier,
} from "@/services/supplier.service";

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
          message: "You are not authorized to view suppliers",
        },
        { status: 403 },
      );
    }

    const suppliers = await getSuppliers();

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

    try {
      const supplier = await createSupplier(validation.data);

      return NextResponse.json(
        {
          success: true,
          message: "Supplier created successfully",
          supplier,
        },
        { status: 201 },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "SUPPLIER_EMAIL_EXISTS"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Supplier with this email already exists",
          },
          { status: 409 },
        );
      }

      throw error;
    }
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