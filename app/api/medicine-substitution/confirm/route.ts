import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authorization";
import { hasRole } from "@/lib/authorization";
import { z } from "zod";
import { confirmMedicineSubstitution } from "@/services/medicine-substitution.service";

const confirmSubstitutionSchema = z.object({
  sourceProductId: z.string().min(1),
  alternativeProductId: z.string().min(1),
  reason: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasRole(user.role, ["PHARMACIST"])) {
      return NextResponse.json(
        {
          error:
            "Only pharmacists can confirm substitutions",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validation =
      confirmSubstitutionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const substitution =
      await confirmMedicineSubstitution(
        validation.data.sourceProductId,
        validation.data.alternativeProductId,
       user.userId,
        validation.data.reason,
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Medicine substitution confirmed successfully",
        data: substitution,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/medicine-substitution/confirm error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to confirm medicine substitution";

    if (
      message ===
        "Configured medicine alternative not found" ||
      message === "Pharmacist not found" ||
      message ===
        "Only pharmacists can confirm substitutions"
    ) {
      return NextResponse.json(
        { error: message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to confirm medicine substitution",
      },
      { status: 500 },
    );
  }
}