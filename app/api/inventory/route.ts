import { NextResponse } from "next/server";
import { createInventorySchema } from "@/lib/validations/inventory";
import { UserRole } from "@/src/generated/prisma/client";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import {
  getInventory,
  createInventory,
} from "@/services/inventory.service";

export async function GET() {
  try {
    // 1. Authentication
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

    // 2. Get inventory through service
    const inventory = await getInventory();

    return NextResponse.json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error(
      "GET /api/inventory error:",
      error
    );

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
    // 1. Authentication
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

    // 2. Authorization
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to create inventory",
        },
        { status: 403 }
      );
    }

    // 3. Read request body
    const body = await request.json();

    // 4. Validate request body
    const validation =
      createInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 5. Create inventory through service
    try {
      const inventory = await createInventory(
        validation.data
      );

      return NextResponse.json(
        {
          success: true,
          message: "Inventory created successfully",
          inventory,
        },
        { status: 201 }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create inventory";

      if (message === "Product not found") {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 404 }
        );
      }

      if (
        message ===
        "Inventory already exists for this product"
      ) {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 409 }
        );
      }

      if (
        message ===
        "Maximum stock cannot be less than minimum stock"
      ) {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error(
      "POST /api/inventory error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create inventory",
      },
      { status: 500 }
    );
  }
}