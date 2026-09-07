import { NextResponse } from "next/server";
import { getModelPerformance } from "@/services/model-performance.service";

export async function GET() {
  try {
    const performance =
      await getModelPerformance();

    return NextResponse.json(
      {
        success: true,
        data: performance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/predictions/performance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate model performance",
      },
      { status: 500 }
    );
  }
}