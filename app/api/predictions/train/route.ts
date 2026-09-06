import { NextResponse } from "next/server";
import { trainMLModel } from "@/services/ml-training.service";

export async function POST() {
  try {
    const result =
      await trainMLModel();

    return NextResponse.json(
      result,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "POST /api/predictions/train error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to train ML model",
      },
      { status: 500 }
    );
  }
}