import { NextResponse } from "next/server";

import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";

import {
  UserRole,
} from "@/src/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    // ----------------------------------
    // 1. AUTHENTICATION
    // ----------------------------------

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        {
          status: 401,
        },
      );
    }

    // ----------------------------------
    // 2. AUTHORIZATION
    // ----------------------------------

    const allowed = hasRole(
      currentUser.role,
      [
        UserRole.ADMIN,
        UserRole.INVENTORY_MANAGER,
        UserRole.BUSINESS_ANALYST,
      ],
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view purchase returns",
        },
        {
          status: 403,
        },
      );
    }

    // ----------------------------------
    // 3. GET RETURN ID
    // ----------------------------------

    const { id } =
      await context.params;

    // ----------------------------------
    // 4. FIND PURCHASE RETURN
    // ----------------------------------

    const purchaseReturn =
      await prisma.purchaseReturn.findUnique({
        where: {
          id,
        },

        include: {
          purchase: {
            include: {
              supplier: true,
            },
          },

          items: {
            include: {
              purchaseItem: {
                include: {
                  product: true,
                  batch: true,
                },
              },
            },
          },
        },
      });

    // ----------------------------------
    // 5. NOT FOUND
    // ----------------------------------

    if (!purchaseReturn) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase return not found",
        },
        {
          status: 404,
        },
      );
    }

    // ----------------------------------
    // 6. SUCCESS
    // ----------------------------------

    return NextResponse.json(
      {
        success: true,
        purchaseReturn,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/purchase-returns/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch purchase return",
      },
      {
        status: 500,
      },
    );
  }
}