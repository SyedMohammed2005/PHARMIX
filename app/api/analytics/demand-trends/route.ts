import { NextResponse } from "next/server";
import { getDemandTrends } from "@/services/demand-trend.service";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const weeksParam =
      searchParams.get("weeks");

    const productId =
      searchParams.get("productId")?.trim() ||
      undefined;

    const weeks = weeksParam
      ? Number(weeksParam)
      : 12;

    if (
      !Number.isInteger(weeks) ||
      weeks < 2 ||
      weeks > 52
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "weeks must be an integer between 2 and 52",
        },
        { status: 400 }
      );
    }

    const trends = await getDemandTrends({
      weeks,
      productId,
    });

    return NextResponse.json(
      {
        success: true,
        count: trends.length,
        data: {
          period: {
            weeks,
          },
          products: trends,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/analytics/demand-trends error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate demand trends",
      },
      { status: 500 }
    );
  }
}