import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hasRole,
} from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { getTopProducts } from "@/services/analytics.service";

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
          message: "You are not authorized to view product analytics",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 10, 1),
      50,
    );

    const result = await getTopProducts(limit);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/top-products error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch top products",
      },
      { status: 500 },
    );
  }
}