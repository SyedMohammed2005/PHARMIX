import { NextResponse } from "next/server";
import { getPredictionMonitoring } from "@/services/prediction-monitoring.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const daysParam = searchParams.get("days");
    const days = daysParam ? Number(daysParam) : 7;

    if (!Number.isInteger(days) || days < 1 || days > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "days must be an integer between 1 and 30",
        },
        { status: 400 }
      );
    }

    const monitoring = await getPredictionMonitoring({ days });

    return NextResponse.json(
      {
        success: true,
        count: monitoring.length,
        data: {
          forecast: {
            days,
          },
          products: monitoring,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/predictions/monitoring error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate prediction monitoring",
      },
      { status: 500 }
    );
  }
}