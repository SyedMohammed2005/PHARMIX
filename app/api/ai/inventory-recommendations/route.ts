import { NextResponse } from "next/server";
import { getInventoryRecommendations } from "@/services/inventory-recommendation.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));
    const days = Math.max(
      Number(searchParams.get("days")) || 7,
      1
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
        { status: 400 }
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

    const data = await getInventoryRecommendations({
      latitude,
      longitude,
      days,
    });

    return NextResponse.json(
      {
        success: true,
        count: data.products.length,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/ai/inventory-recommendations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate inventory recommendations",
      },
      { status: 500 }
    );
  }
}