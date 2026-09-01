import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";

import {
  UserRole,
} from "@/src/generated/prisma/client";

import {
  createPurchaseReturn,
} from "@/services/purchase-return.service";

const purchaseReturnSchema = z.object({
  reason: z
    .string()
    .trim()
    .optional()
    .nullable(),

  items: z
    .array(
      z.object({
        purchaseItemId: z
          .string()
          .min(
            1,
            "Purchase item ID is required",
          ),

        quantity: z
          .number()
          .int()
          .positive(
            "Return quantity must be greater than 0",
          ),
      }),
    )
    .min(
      1,
      "At least one return item is required",
    ),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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
      ],
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to process purchase returns",
        },
        {
          status: 403,
        },
      );
    }

    // ----------------------------------
    // 3. PURCHASE ID
    // ----------------------------------

    const { id } =
      await context.params;

    // ----------------------------------
    // 4. BODY VALIDATION
    // ----------------------------------

    const body = await request.json();

    const validation =
      purchaseReturnSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten()
              .fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    // ----------------------------------
    // 5. PROCESS RETURN
    // ----------------------------------

    const purchaseReturn =
      await createPurchaseReturn({
        purchaseId: id,

        reason:
          validation.data.reason,

        items:
          validation.data.items,
      });

    // ----------------------------------
    // 6. SUCCESS
    // ----------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Purchase return processed successfully",
        return: purchaseReturn,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/purchases/[id]/returns error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to process purchase return";

    if (message === "Purchase not found") {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 404,
        },
      );
    }

    if (
      message.includes(
        "does not belong",
      ) ||
      message.includes(
        "Cannot return",
      ) ||
      message.includes(
        "Return quantity",
      ) ||
      message.includes(
        "Duplicate purchase item",
      ) ||
      message.includes(
        "Insufficient batch stock",
      ) ||
      message.includes(
        "Insufficient inventory stock",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process purchase return",
      },
      {
        status: 500,
      },
    );
  }
}