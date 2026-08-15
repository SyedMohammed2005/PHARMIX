import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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

    // 2. Authorization
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
          message: "You are not authorized to view this sale",
        },
        { status: 403 }
      );
    }

    // 3. Get sale ID
    const { id } = await context.params;

    // 4. Find sale
    const sale = await prisma.sale.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        payment: true,
      },
    });

    // 5. Sale not found
    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale not found",
        },
        { status: 404 }
      );
    }

    // 6. Return sale
    return NextResponse.json({
      success: true,
      sale,
    });
  } catch (error) {
    console.error("GET /api/sales/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sale",
      },
      { status: 500 }
    );
  }
}