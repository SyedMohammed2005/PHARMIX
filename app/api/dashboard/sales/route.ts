import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { getSalesAnalytics } from "@/services/analytics.service";

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
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view sales analytics",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const days = Math.min(
      Math.max(Number(searchParams.get("days")) || 7, 1),
      90,
    );

    const salesAnalytics = await getSalesAnalytics(days);

    return NextResponse.json({
      success: true,
      ...salesAnalytics,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/sales error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales analytics",
      },
      { status: 500 },
    );
  }
}