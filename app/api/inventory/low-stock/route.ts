import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
      orderBy: {
        quantity: "asc",
      },
    });

    const lowStock = inventory.filter(
      (item) => item.quantity <= item.reorderPoint
    );

    return NextResponse.json({
      success: true,
      count: lowStock.length,
      lowStock,
    });
  } catch (error) {
    console.error("GET /api/inventory/low-stock error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch low-stock inventory",
      },
      { status: 500 }
    );
  }
}