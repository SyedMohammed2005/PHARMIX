import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStockTransactionSchema } from "@/lib/validations/stockTransaction";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

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

    if (
      data.type === "PURCHASE" ||
      data.type === "RETURN"
    ) {
      newQuantity += data.quantity;
    }

    if (
      data.type === "SALE" ||
      data.type === "DAMAGE"
    ) {
      newQuantity -= data.quantity;
    }

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