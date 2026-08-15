import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStockTransactionSchema } from "@/lib/validations/stockTransaction";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET(request: Request) {
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
      UserRole.PHARMACIST,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view transactions",
        },
        { status: 403 }
      );
    }

    // Read query parameters
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const inventoryId = searchParams.get("inventoryId");
    
    const validTypes = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "DAMAGE",
  "ADJUSTMENT",
];

if (type && !validTypes.includes(type)) {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid transaction type",
    },
    { status: 400 }
  );
}

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // Build filter
    const where: {
      type?: "PURCHASE" | "SALE" | "RETURN" | "DAMAGE" | "ADJUSTMENT";
      inventoryId?: string;
    } = {};

    if (
      type === "PURCHASE" ||
      type === "SALE" ||
      type === "RETURN" ||
      type === "DAMAGE" ||
      type === "ADJUSTMENT"
    ) {
      where.type = type;
    }

    if (inventoryId) {
      where.inventoryId = inventoryId;
    }

    // Get transactions + total count
    const transactions = await prisma.stockTransaction.findMany({
  where,
  include: {
    inventory: {
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
  skip,
  take: limit,
});

const total = await prisma.stockTransaction.count({
  where,
});
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      count: transactions.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      transactions,
    });
  } catch (error) {
    console.error(
      "GET /api/inventory/transactions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    // Validate request body
    const body = await request.json();

    const validation =
      createStockTransactionSchema.safeParse(body);

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

    // Check role
    const isAdminOrManager = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
    ]);

    const isPharmacist = currentUser.role === UserRole.PHARMACIST;

    // Pharmacists can only process SALE and RETURN
    if (
      !isAdminOrManager &&
      !(
        isPharmacist &&
        (data.type === "SALE" || data.type === "RETURN")
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to create this stock transaction",
        },
        { status: 403 }
      );
    }

    // Find inventory
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: data.inventoryId,
      },
    });

    if (!inventory) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory not found",
        },
        { status: 404 }
      );
    }

    let newQuantity = inventory.quantity;

    // ADJUSTMENT is intentionally handled separately later.
   if (
  data.type === "PURCHASE" ||
  data.type === "RETURN"
) {
  newQuantity += Math.abs(data.quantity);
}

if (
  data.type === "SALE" ||
  data.type === "DAMAGE"
) {
  newQuantity -= Math.abs(data.quantity);
}

if (data.type === "ADJUSTMENT") {
  newQuantity += data.quantity;
}

    if (newQuantity < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient stock",
        },
        { status: 400 }
      );
    }

    // Create transaction and update inventory atomically
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.stockTransaction.create({
        data: {
          inventoryId: data.inventoryId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
        },
      });

      const updatedInventory = await tx.inventory.update({
        where: {
          id: data.inventoryId,
        },
        data: {
          quantity: newQuantity,
        },
      });

      return {
        transaction,
        inventory: updatedInventory,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Stock transaction created successfully",
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/inventory/transactions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create stock transaction",
      },
      { status: 500 }
    );
  }
}