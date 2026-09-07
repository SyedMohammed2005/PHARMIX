import { NextResponse } from "next/server";
import { evaluateDemandModel } from "@/services/model-evaluation.service";

export async function GET() {
  try {
    const result = await evaluateDemandModel();

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/predictions/evaluate error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to evaluate demand model",
      },
      { status: 500 }
    );
  }
}