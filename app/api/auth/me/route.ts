import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authorization";
import { successResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse("Not authenticated", 401);
    }

    // 2. Get current user from database
    const user = await prisma.user.findUnique({
      where: {
        id: currentUser.userId,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // 3. Remove password before sending response
    const { password: _, ...safeUser } = user;

    // 4. Success response
    return successResponse({
      user: safeUser,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);

    return errorResponse(
      "Failed to fetch current user",
      500
    );
  }
}