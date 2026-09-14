import { NextResponse } from "next/server";
import { updateInventory } from "@/services/inventory.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@/src/generated/prisma/client";
import { getCurrentUser, hasRole } from "@/lib/authorization";

const updateInventorySchema = z.object({
  quantity: z
    .number()
    .int()
    .min(0, "Quantity cannot be negative")
    .optional(),

  minimumStock: z
    .number()
    .int()
    .min(0, "Minimum stock cannot be negative")
    .optional(),

  maximumStock: z
    .number()
    .int()
    .positive("Maximum stock must be positive")
    .optional(),

  reorderPoint: z
    .number()
    .int()
    .min(0, "Reorder point cannot be negative")
    .optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
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

    // 2. Get inventory ID
    const { id } = await context.params;

    // 3. Find inventory
    const inventory = await prisma.inventory.findUnique({
      where: {
        id,
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

    // 4. Inventory not found
    if (!inventory) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory not found",
        },
        { status: 404 }
      );
    }

    // 5. Success response
    return NextResponse.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error(
      "GET /api/inventory/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory details",
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
    // 1. Check if user is logged in
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

    // 2. Check user permission
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to update inventory",
        },
        { status: 403 }
      );
    }

    // 3. Get inventory ID
    const { id } = await context.params;

    // 4. Read request body
    const body = await request.json();

    // 5. Validate request body
    const validation =
      updateInventorySchema.safeParse(body);

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

    // 6. Update inventory through service
    try {
      const inventory = await updateInventory(
        id,
        validation.data,
        currentUser.userId
      );

      // Inventory not found
      if (!inventory) {
        return NextResponse.json(
          {
            success: false,
            message: "Inventory not found",
          },
          { status: 404 }
        );
      }

      // 7. Success response
      return NextResponse.json({
        success: true,
        message: "Inventory updated successfully",
        inventory,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update inventory";

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

      if (
        message ===
        "Quantity cannot exceed maximum stock"
      ) {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 400 }
        );
      }

      if (
        message ===
        "Reorder point cannot be less than minimum stock"
      ) {
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 400 }
        );
      }

      if (
        message ===
        "Reorder point cannot be greater than maximum stock"
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
      "PUT /api/inventory/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update inventory",
      },
      { status: 500 }
    );
  }
}