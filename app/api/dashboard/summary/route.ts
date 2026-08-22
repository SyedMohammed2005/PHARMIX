import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { getDashboardSummary } from "@/services/analytics.service";

export async function GET() {
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
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view dashboard analytics",
        },
        { status: 403 }
      );
    }

    // 3. Get dashboard data from service
    const dashboard = await getDashboardSummary();

    // 4. Return response
    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/summary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard summary",
      },
      { status: 500 }
    );
  }
}