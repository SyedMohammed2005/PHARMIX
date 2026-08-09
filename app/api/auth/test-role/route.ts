import { NextResponse } from "next/server";
import { UserRole } from "@/src/generated/prisma/client";
import { hasRole, getCurrentUser } from "@/lib/authorization";

export async function GET() {
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

  const allowed = hasRole(currentUser.role, [
    UserRole.ADMIN,
    UserRole.INVENTORY_MANAGER,
  ]);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to access this resource",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "You are authorized",
  });
}