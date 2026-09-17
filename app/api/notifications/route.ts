import { NextRequest, NextResponse } from "next/server";

// import { getCurrentUser } from "@/lib/auth";
import { getCurrentUser } from "@/lib/authorization";
import {
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
} from "@/services/notification.service";

import {
  NotificationSeverity,
  NotificationType,
} from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam
      ? Number(pageParam)
      : 1;

    const limit = limitParam
      ? Number(limitParam)
      : 20;

    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Page must be a positive integer",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Limit must be between 1 and 100",
        },
        { status: 400 },
      );
    }

    const isReadParam = searchParams.get("isRead");

    let isRead: boolean | undefined;

    if (isReadParam !== null) {
      if (
        isReadParam !== "true" &&
        isReadParam !== "false"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "isRead must be true or false",
          },
          { status: 400 },
        );
      }

      isRead = isReadParam === "true";
    }

    const typeParam = searchParams.get("type");

    let type: NotificationType | undefined;

    if (typeParam) {
      if (
        !Object.values(NotificationType).includes(
          typeParam as NotificationType,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification type",
          },
          { status: 400 },
        );
      }

      type = typeParam as NotificationType;
    }

    const severityParam =
      searchParams.get("severity");

    let severity:
      | NotificationSeverity
      | undefined;

    if (severityParam) {
      if (
        !Object.values(
          NotificationSeverity,
        ).includes(
          severityParam as NotificationSeverity,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid notification severity",
          },
          { status: 400 },
        );
      }

      severity =
        severityParam as NotificationSeverity;
    }

    const result = await getNotifications({
      userId: currentUser.userId,
      isRead,
      type,
      severity,
      page,
      limit,
    });

    const unreadCount =
      await getUnreadNotificationCount(
        currentUser.userId,
      );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        unreadCount,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/notifications error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notifications",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const {
      type,
      severity,
      title,
      message,
      entity,
      entityId,
    } = body;

    if (
      !type ||
      !severity ||
      !title ||
      !message
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "type, severity, title, and message are required",
        },
        { status: 400 },
      );
    }

    if (
      !Object.values(NotificationType).includes(
        type as NotificationType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification type",
        },
        { status: 400 },
      );
    }

    if (
      !Object.values(
        NotificationSeverity,
      ).includes(
        severity as NotificationSeverity,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification severity",
        },
        { status: 400 },
      );
    }

    const notification =
      await createNotification({
        userId: currentUser.userId,
        type: type as NotificationType,
        severity:
          severity as NotificationSeverity,
        title,
        message,
        entity,
        entityId,
      });

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/notifications error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create notification",
      },
      { status: 500 },
    );
  }
}

export async function deleteInvalidTestNotifications() {
  return prisma.notification.deleteMany({
    where: {
      id: "",
    },
  });
}