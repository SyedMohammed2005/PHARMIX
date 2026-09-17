import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/authorization";

import {
  getNotificationById,
  markNotificationAsRead,
} from "@/services/notification.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification ID is required",
        },
        { status: 400 },
      );
    }

    const notification =
      await getNotificationById(
        id,
        currentUser.userId,
      );

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 },
      );
    }

    const updatedNotification =
      await markNotificationAsRead(
        id,
        currentUser.userId,
      );

    return NextResponse.json(
      {
        success: true,
        data: updatedNotification,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "PATCH /api/notifications/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to mark notification as read",
      },
      { status: 500 },
    );
  }
}