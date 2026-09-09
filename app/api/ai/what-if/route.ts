import { NextResponse } from "next/server";
import { simulateDemandScenario } from "@/services/what-if-demand.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));

    const days = Number(searchParams.get("days") ?? 7);

    const productId =
      searchParams.get("productId")?.trim() || undefined;

    const demandChangePercent = Number(
      searchParams.get("demandChangePercent") ?? 0,
    );

    const stockAdjustmentUnits = Number(
      searchParams.get("stockAdjustmentUnits") ?? 0,
    );

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid latitude.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid longitude.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Days must be an integer between 1 and 30.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(demandChangePercent) ||
      demandChangePercent < -100 ||
      demandChangePercent > 300
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demand change must be between -100% and 300%.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(stockAdjustmentUnits)) {
      return NextResponse.json(
        {
          success: false,
          message: "Stock adjustment must be a valid number.",
        },
        { status: 400 },
      );
    }

    const result = await simulateDemandScenario({
      latitude,
      longitude,
      days,
      productId,
      demandChangePercent,
      stockAdjustmentUnits,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/ai/what-if error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to simulate demand scenario.",
      },
      { status: 500 },
    );
  }
}