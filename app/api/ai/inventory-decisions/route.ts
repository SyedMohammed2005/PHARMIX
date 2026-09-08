import { NextResponse } from "next/server";
import { getInventoryDecisions } from "@/services/inventory-decision.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));
    const days = Number(searchParams.get("days") ?? 7);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid latitude and longitude are required",
        },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid latitude or longitude",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(days) || days < 1 || days > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "days must be an integer between 1 and 30",
        },
        { status: 400 }
      );
    }

    const decisions = await getInventoryDecisions({
      latitude,
      longitude,
      days,
    });

    return NextResponse.json(
      {
        success: true,
        count: decisions.length,
        data: {
          forecast: {
            days,
          },
          products: decisions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/ai/inventory-decisions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate inventory decisions",
      },
      { status: 500 }
    );
  }
}
