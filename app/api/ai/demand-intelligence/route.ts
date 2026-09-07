import { NextResponse } from "next/server";
import { getDemandIntelligenceSummary } from "@/services/demand-intelligence-summary.service";

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
      searchParams.get("days") ?? 7,
    );

    const topProducts = Number(
      searchParams.get("topProducts") ?? 5,
    );

    // Validate coordinates
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid latitude and longitude are required",
        },
        { status: 400 },
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
        { status: 400 },
      );
    }

    // Validate forecast days
    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 90
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "days must be an integer between 1 and 90",
        },
        { status: 400 },
      );
    }

    // Validate top products
    if (
      !Number.isInteger(topProducts) ||
      topProducts < 1 ||
      topProducts > 20
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "topProducts must be an integer between 1 and 20",
        },
        { status: 400 },
      );
    }

    const result =
      await getDemandIntelligenceSummary({
        latitude,
        longitude,
        days,
        topProducts,
      });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET /api/ai/demand-intelligence error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate demand intelligence summary",
      },
      { status: 500 },
    );
  }
}