import { NextResponse } from "next/server";
import { getInventoryAlerts } from "@/services/inventory-alert.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(
      searchParams.get("latitude"),
    );

    const longitude = Number(
      searchParams.get("longitude"),
    );

    const days = Number(
      searchParams.get("days") || 7,
    );

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid latitude",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid longitude",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Days must be an integer between 1 and 30",
        },
        { status: 400 },
      );
    }

    const result = await getInventoryAlerts({
      latitude,
      longitude,
      days,
    });

    return NextResponse.json({
      success: true,
      data: {
        forecast: {
          days,
        },
        summary: result.summary,
        alerts: result.alerts,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/ai/inventory-alerts error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate inventory alerts",
      },
      { status: 500 },
    );
  }
}