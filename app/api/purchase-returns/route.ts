import { NextRequest, NextResponse } from "next/server";

import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";

import {
  ReturnStatus,
  UserRole,
} from "@/src/generated/prisma/client";

import {
  getPurchaseReturns,
} from "@/services/purchase-return-history.service";

export async function GET(
  request: NextRequest,
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
    // 3. QUERY PARAMETERS
    // ----------------------------------

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search") || "";

    const statusParam =
      searchParams.get("status");

    const sortBy =
      searchParams.get("sortBy") ||
      "createdAt";

    const orderParam =
      searchParams.get("order");

    const pageParam =
      searchParams.get("page");

    const limitParam =
      searchParams.get("limit");

    const page = Math.max(
      Number(pageParam) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(Number(limitParam) || 10, 1),
      100,
    );

    const order =
      orderParam === "asc"
        ? "asc"
        : "desc";

    // ----------------------------------
    // 4. VALIDATE STATUS
    // ----------------------------------

    let status:
      | ReturnStatus
      | undefined;

    if (statusParam) {
      const validStatus =
        Object.values(ReturnStatus).includes(
          statusParam as ReturnStatus,
        );

      if (!validStatus) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid return status",
          },
          {
            status: 400,
          },
        );
      }

      status =
        statusParam as ReturnStatus;
    }

    // ----------------------------------
    // 5. GET PURCHASE RETURNS
    // ----------------------------------

    const result =
      await getPurchaseReturns({
        search,
        status,
        page,
        limit,
        sortBy,
        order,
      });

    // ----------------------------------
    // 6. SUCCESS RESPONSE
    // ----------------------------------

    return NextResponse.json(
      {
        success: true,

        returns: result.returns,

        pagination: {
          page: result.page,

          limit: result.limit,

          total: result.total,

          totalPages: Math.max(
            Math.ceil(
              result.total / result.limit,
            ),
            1,
          ),
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/purchase-returns error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch purchase returns",
      },
      {
        status: 500,
      },
    );
  }
}