import { NextResponse } from "next/server";
import {
  getAllForecastingFeatures,
  getForecastingFeatures,
} from "@/services/forecasting.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get("productId")?.trim();

    if (productId) {
      const features =
        await getForecastingFeatures(productId);

      return NextResponse.json({
        success: true,
        count: 1,
        features: [features],
      });
    }

    const features =
      await getAllForecastingFeatures();

    return NextResponse.json({
      success: true,
      count: features.length,
      features,
    });
  } catch (error) {
    console.error(
      "GET /api/predictions/features error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate forecasting features",
      },
      { status: 500 }
    );
  }
}