import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/authorization";

import { markAllNotificationsAsRead } from "@/services/notification.service";

export async function PATCH() {
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
      await markAllNotificationsAsRead(
        currentUser.userId,
      );

    return NextResponse.json(
      {
        success: true,
        data: {
          updatedCount: result.count,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "PATCH /api/notifications/read-all error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to mark all notifications as read",
      },
      { status: 500 },
    );
  }
}