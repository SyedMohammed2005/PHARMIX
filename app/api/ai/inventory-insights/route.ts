import { NextResponse } from "next/server";
import { getInventoryIntelligence } from "@/services/inventory-intelligence.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

   const latitudeParam =
  searchParams.get("latitude");

const longitudeParam =
  searchParams.get("longitude");

const daysParam =
  searchParams.get("days");

if (
  latitudeParam === null ||
  longitudeParam === null
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Latitude and longitude are required",
    },
    { status: 400 },
  );
}

const latitude = Number(latitudeParam);
const longitude = Number(longitudeParam);

const days =
  daysParam === null
    ? 7
    : Number(daysParam);
    // Validate coordinates.
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
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

    // Validate forecast period.
    if (
      !Number.isFinite(days) ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 90
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "days must be an integer between 1 and 90",
        },
        { status: 400 },
      );
    }

    /*
     * Reuse the existing inventory intelligence engine.
     *
     * This route is an AI/business-facing aggregation layer.
     * Risk calculations remain inside inventory-intelligence.service.ts.
     */
    const intelligence =
      await getInventoryIntelligence({
        latitude,
        longitude,
        days,
      });

    const products = intelligence.products;

    const stockoutProducts = products.filter(
      (product) =>
        product.priority === "STOCKOUT",
    );

    const urgentRestockProducts =
      products.filter(
        (product) =>
          product.priority === "URGENT_RESTOCK",
      );

    const restockProducts =
      products.filter(
        (product) =>
          product.priority === "RESTOCK",
      );

    const monitorProducts =
      products.filter(
        (product) =>
          product.priority === "MONITOR",
      );

    const healthyProducts =
      products.filter(
        (product) =>
          product.priority === "HEALTHY",
      );

    const highestRiskProduct =
      products.length > 0
        ? products[0]
        : null;

    let overallStatus:
      | "CRITICAL"
      | "ATTENTION_REQUIRED"
      | "MONITOR"
      | "HEALTHY";

    if (
      intelligence.summary.criticalRiskProducts > 0 ||
      intelligence.summary.stockoutProducts > 0
    ) {
      overallStatus = "CRITICAL";
    } else if (
      intelligence.summary.highRiskProducts > 0 ||
      intelligence.summary.urgentRestockProducts > 0
    ) {
      overallStatus = "ATTENTION_REQUIRED";
    } else if (
      intelligence.summary.mediumRiskProducts > 0
    ) {
      overallStatus = "MONITOR";
    } else {
      overallStatus = "HEALTHY";
    }

    return NextResponse.json(
      {
        success: true,

        overallStatus,

        environment: {
          weather: intelligence.weather,
          seasonalSignals:
            intelligence.seasonalSignals,
        },

        forecast: intelligence.forecast,

        summary: intelligence.summary,

        insights: {
          highestRiskProduct,

          stockoutProducts,

          urgentRestockProducts,

          restockProducts,

          monitorProducts,

          healthyProducts,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET /api/ai/inventory-insights error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate AI inventory insights",
      },
      { status: 500 },
    );
  }
}

