import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/authorization";

import {
  generateDemandAnomalyNotifications,
} from "@/services/demand-anomaly.service";

export async function POST(request: Request) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } =
      new URL(request.url);

    const daysParam =
      searchParams.get("days");

    const days =
      daysParam === null
        ? 7
        : Math.max(
            Number(daysParam) || 7,
            1,
          );

    const result =
      await generateDemandAnomalyNotifications(
        currentUser.userId,
        days,
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
      "POST /api/notifications/generate/demand-anomaly error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate demand anomaly notifications",
      },
      { status: 500 },
    );
  }
}