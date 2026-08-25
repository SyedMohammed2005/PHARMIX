import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { getStockMovementAnalytics } from "@/services/analytics.service";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view stock analytics",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const days = Math.min(
      Math.max(Number(searchParams.get("days")) || 30, 1),
      365,
    );

    const analytics =
      await getStockMovementAnalytics(days);

    return NextResponse.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/stock-movements error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stock movement analytics",
      },
      { status: 500 },
    );
  }
}