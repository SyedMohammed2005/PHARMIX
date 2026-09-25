import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authorization";
import { hasRole } from "@/lib/authorization";
import {
  createMedicineAlternative,
  getMedicineAlternatives,
} from "@/services/medicine-alternative.service";
import { z } from "zod";

const createMedicineAlternativeSchema = z.object({
  sourceProductId: z.string().min(1),
  alternativeProductId: z.string().min(1),
  reason: z.string().trim().optional(),
});

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

    const alternatives =
      await getMedicineAlternatives(productId);

    return NextResponse.json({
      success: true,
      data: alternatives,
    });
  } catch (error) {
    console.error(
      "GET /api/medicine-alternatives error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch medicine alternatives",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !hasRole(user.role, [
        "ADMIN",
        "PHARMACIST",
      ])
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validation =
      createMedicineAlternativeSchema.safeParse(
        body,
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const alternative =
      await createMedicineAlternative(
        validation.data,
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Medicine alternative created successfully",
        data: alternative,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/medicine-alternatives error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create medicine alternative";

    if (
      message === "Source product not found" ||
      message === "Alternative product not found" ||
      message ===
        "A medicine cannot be an alternative to itself" ||
      message ===
        "This medicine alternative already exists"
    ) {
      return NextResponse.json(
        { error: message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to create medicine alternative",
      },
      { status: 500 },
    );
  }
}