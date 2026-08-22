import { NextResponse } from "next/server";
import { getDemandPredictions } from "@/services/prediction.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const days = Math.max(
      Number(searchParams.get("days")) || 7,
      1
    );

    const productId =
      searchParams.get("productId")?.trim() || undefined;

    const predictions = await getDemandPredictions({
      days,
      productId,
    });

    return NextResponse.json(
      {
        success: true,
        count: predictions.length,
        prediction: {
          days,
          products: predictions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/predictions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate demand predictions",
      },
      { status: 500 }
    );
  }
}