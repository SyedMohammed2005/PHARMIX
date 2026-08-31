import { NextResponse } from "next/server";
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
// Check if user is logged in
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

// Check if user has permission
const allowed = hasRole(currentUser.role, [
  UserRole.ADMIN,
  UserRole.INVENTORY_MANAGER,
]);

if (!allowed) {
  return NextResponse.json(
    {
      success: false,
      message: "You are not authorized to update inventory",
    },
    { status: 403 }
  );
}

// Get inventory ID
const { id } = await context.params;

// Read request body
const body = await request.json();

// Validate request body
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

// Check if inventory exists
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

// Calculate the final stock limits
const minimumStock =
  data.minimumStock ?? existingInventory.minimumStock;

const maximumStock =
  data.maximumStock ?? existingInventory.maximumStock;

const quantity =
  data.quantity ?? existingInventory.quantity;

  const reorderPoint =
  data.reorderPoint ?? existingInventory.reorderPoint;

// Validate minimum and maximum stock relationship
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

// Validate quantity against maximum stock
if (
  maximumStock !== null &&
  quantity > maximumStock
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Quantity cannot exceed maximum stock",
    },
    { status: 400 }
  );
}

// Validate reorder point
if (
  reorderPoint !== null &&
  reorderPoint < minimumStock
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Reorder point cannot be less than minimum stock",
    },
    { status: 400 }
  );
}

if (
  reorderPoint !== null &&
  maximumStock !== null &&
  reorderPoint > maximumStock
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Reorder point cannot be greater than maximum stock",
    },
    { status: 400 }
  );
}
// Update inventory
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
