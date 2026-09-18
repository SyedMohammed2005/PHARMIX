import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/authorization";

import { generateExpiryRiskNotifications } from "@/services/batch.service";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const result =
      await generateExpiryRiskNotifications(
        currentUser.userId,
      );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "POST /api/notifications/generate error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate notifications",
      },
      { status: 500 },
    );
  }
}