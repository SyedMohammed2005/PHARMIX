import { NextResponse } from "next/server";

import { getCurrentWeather } from "@/services/weather.service";
import {
  getSeasonalDemandSignals,
} from "@/services/seasonal-health.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(
      searchParams.get("latitude"),
    );

    const longitude = Number(
      searchParams.get("longitude"),
    );

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

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Latitude must be between -90 and 90",
        },
        { status: 400 },
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Longitude must be between -180 and 180",
        },
        { status: 400 },
      );
    }

    const weather = await getCurrentWeather(
      latitude,
      longitude,
    );

    const intelligence =
      getSeasonalDemandSignals(weather);

    return NextResponse.json({
      success: true,

      location: {
        latitude: weather.latitude,
        longitude: weather.longitude,
        timezone: weather.timezone,
      },

      weather,

      intelligence,
    });
  } catch (error) {
    console.error(
      "GET /api/weather/intelligence error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate weather intelligence",
      },
      { status: 500 },
    );
  }
}