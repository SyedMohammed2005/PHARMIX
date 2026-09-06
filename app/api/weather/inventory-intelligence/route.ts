import { NextResponse } from "next/server";
import { getInventoryIntelligence } from "@/services/inventory-intelligence.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid latitude and longitude are required",
        },
        { status: 400 },
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude must be between -90 and 90",
        },
        { status: 400 },
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          message: "Longitude must be between -180 and 180",
        },
        { status: 400 },
      );
    }

    const intelligence = await getInventoryIntelligence({
      latitude,
      longitude,
    });

    return NextResponse.json(
      {
        success: true,
        ...intelligence,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET /api/weather/inventory-intelligence error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate inventory intelligence",
      },
      { status: 500 },
    );
  }
}