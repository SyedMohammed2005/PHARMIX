import { NextResponse } from "next/server";
import { getCurrentWeather } from "@/services/weather.service";

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

    const weather = await getCurrentWeather(latitude, longitude);

    return NextResponse.json({
      success: true,
      weather,
    });
  } catch (error) {
    console.error("GET /api/weather error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch weather data",
      },
      { status: 500 },
    );
  }
}