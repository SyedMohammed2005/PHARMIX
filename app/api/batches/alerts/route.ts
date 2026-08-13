import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET() {
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

    // Check permission
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
          message: "You are not authorized to view batch alerts",
        },
        { status: 403 }
      );
    }

    // Get today's date
    const today = new Date();

    // Date 30 days from now
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30
    );

    // Get expired batches
    const expired = await prisma.batch.findMany({
      where: {
        expiryDate: {
          lt: today,
        },
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
      include: {
        product: true,
      },
    });

    // Get batches expiring within 30 days
    const expiringSoon = await prisma.batch.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
      include: {
        product: true,
      },
    });

    // Get low-stock batches
    const lowStock = await prisma.batch.findMany({
      where: {
        quantity: {
          gt: 0,
          lte: 10,
        },
      },
      orderBy: {
        quantity: "asc",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({
      success: true,
      expired: {
        count: expired.length,
        batches: expired,
      },
      expiringSoon: {
        count: expiringSoon.length,
        batches: expiringSoon,
      },
      lowStock: {
        count: lowStock.length,
        batches: lowStock,
      },
    });
  } catch (error) {
    console.error("GET /api/batches/alerts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch batch alerts",
      },
      { status: 500 }
    );
  }
}