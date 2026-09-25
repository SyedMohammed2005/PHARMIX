import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authorization";
import { getMedicineSubstitutionOptions } from "@/services/medicine-substitution.service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const productId =
      request.nextUrl.searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      );
    }

    const substitutionOptions =
      await getMedicineSubstitutionOptions(productId);

    return NextResponse.json({
      success: true,
      data: substitutionOptions,
    });
  } catch (error) {
    console.error(
      "GET /api/medicine-substitution error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch substitution options";

    if (message === "Product not found") {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to fetch substitution options",
      },
      { status: 500 },
    );
  }
}