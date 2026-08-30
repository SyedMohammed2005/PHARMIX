import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
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
          message:
            "You are not authorized to view this return",
        },
        { status: 403 }
      );
    }

    // 3. Get return ID
    const { id } = await context.params;

    // 4. Find return
    const saleReturn =
      await prisma.saleReturn.findUnique({
        where: {
          id,
        },

        include: {
          items: {
            include: {
              saleItem: {
                include: {
                  product: true,
                  batch: true,
                },
              },
            },
          },

          sale: {
            include: {
              customer: true,
              payment: true,
            },
          },
        },
      });

    // 5. Return not found
    if (!saleReturn) {
      return NextResponse.json(
        {
          success: false,
          message: "Return not found",
        },
        { status: 404 }
      );
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      return: saleReturn,
    });
  } catch (error) {
    console.error(
      "GET /api/sales/returns/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch return details",
      },
      { status: 500 }
    );
  }
}