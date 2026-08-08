import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStockTransactionSchema } from "@/lib/validations/stockTransaction";

export async function POST(request: Request) {
  try {
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

    if (newQuantity < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient stock",
        },
        { status: 400 }
      );
    }

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