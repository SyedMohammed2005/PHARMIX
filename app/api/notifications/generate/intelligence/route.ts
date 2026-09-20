import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/authorization";

import {
  generateNotificationIntelligence,
} from "@/services/notification-engine.service";

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

    const forecastDaysParam =
      searchParams.get("forecastDays");

    const demandLookbackDaysParam =
      searchParams.get(
        "demandLookbackDays",
      );

    const expiryDaysParam =
      searchParams.get("expiryDays");

    const forecastDays =
      forecastDaysParam === null
        ? 7
        : Math.max(
            Number(forecastDaysParam) || 7,
            1,
          );

    const demandLookbackDays =
      demandLookbackDaysParam === null
        ? 7
        : Math.max(
            Number(
              demandLookbackDaysParam,
            ) || 7,
            1,
          );

    const expiryDays =
      expiryDaysParam === null
        ? 30
        : Math.max(
            Number(expiryDaysParam) || 30,
            1,
          );

    const result =
      await generateNotificationIntelligence(
        currentUser.userId,
        {
          forecastDays,
          demandLookbackDays,
          expiryDays,
        },
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
      "POST /api/notifications/generate/intelligence error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate notification intelligence",
      },
      { status: 500 },
    );
  }
}