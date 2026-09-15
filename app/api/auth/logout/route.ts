import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createAuditLog } from "@/services/audit.service";
import { AuditAction } from "@/src/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const token = request.headers
      .get("cookie")
      ?.split(";")
      .find((cookie) =>
        cookie.trim().startsWith("auth_token=")
      )
      ?.split("=")[1];

    if (token) {
      try {
        const payload = await verifyToken(token);

        if (payload.userId) {
          await createAuditLog({
            userId: String(payload.userId),
            action: AuditAction.LOGOUT,
            entity: "User",
            entityId: String(payload.userId),
            description: "User logged out successfully",
            beforeData: {
              userId: String(payload.userId),
              role: payload.role
                ? String(payload.role)
                : null,
            },
          });
        }
      } catch (tokenError) {
        console.warn(
          "Unable to create logout audit:",
          tokenError
        );
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    });

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "POST /api/auth/logout error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to logout",
      },
      { status: 500 }
    );
  }
}