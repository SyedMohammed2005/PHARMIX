import { NextResponse } from "next/server";
import { getTrainingData } from "@/services/training-data.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "productId is required",
        },
        { status: 400 }
      );
    }

    const trainingData = await getTrainingData(productId);

    return NextResponse.json({
      success: true,
      count: trainingData.length,
      productId,
      trainingData,
    });
  } catch (error) {
    console.error(
      "GET /api/predictions/training-data error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate training data",
      },
      { status: 500 }
    );
  }
}