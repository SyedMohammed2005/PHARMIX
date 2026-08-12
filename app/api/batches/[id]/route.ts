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
    // Check if user is logged in
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

    // Check if user has permission
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
          message: "You are not authorized to view this batch",
        },
        { status: 403 }
      );
    }

    // Get batch ID
    const { id } = await context.params;

    // Find batch
    const batch = await prisma.batch.findUnique({
      where: {
        id,
      },
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
            inventory: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error("GET /api/batches/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch batch",
      },
      { status: 500 }
    );
  }
}