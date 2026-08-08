import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const validation = updateInventorySchema.safeParse(body);

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

    const existingInventory = await prisma.inventory.findUnique({
      where: {
        id,
      },
    });

    if (!existingInventory) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory not found",
        },
        { status: 404 }
      );
    }

    const minimumStock =
      data.minimumStock ?? existingInventory.minimumStock;

    const maximumStock =
      data.maximumStock ?? existingInventory.maximumStock;

    if (
      maximumStock !== null &&
      maximumStock < minimumStock
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum stock cannot be less than minimum stock",
        },
        { status: 400 }
      );
    }

    const inventory = await prisma.inventory.update({
      where: {
        id,
      },
      data,
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      inventory,
    });
  } catch (error) {
    console.error("PUT /api/inventory/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update inventory",
      },
      { status: 500 }
    );
  }
}