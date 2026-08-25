import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { getDashboardAlerts } from "@/services/analytics.service";

export async function GET() {
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
      UserRole.PHARMACIST,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view inventory alerts",
        },
        { status: 403 },
      );
    }

    const dashboardAlerts = await getDashboardAlerts();

    return NextResponse.json({
      success: true,
      ...dashboardAlerts,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/alerts error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory alerts",
      },
      { status: 500 },
    );
  }
}