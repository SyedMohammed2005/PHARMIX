import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/authorization";

import { detectCopilotIntent } from "@/services/copilot/copilot-intent.service";

import { buildCopilotContext } from "@/services/copilot/copilot-context.service";

import { generateCopilotResponse } from "@/services/copilot/copilot-reasoning.service";

import { validateCopilotResponse } from "@/services/copilot/copilot-validator.service";

import { validateCopilotEvidenceConsistency } from "@/services/copilot/copilot-evidence-validator.service";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question is required",
        },
        { status: 400 },
      );
    }

    const latitude =
      typeof body.latitude === "number"
        ? body.latitude
        : 17.398945;

    const longitude =
      typeof body.longitude === "number"
        ? body.longitude
        : 78.457085;

    const days =
      typeof body.days === "number"
        ? body.days
        : 7;

    const intentResult =
      detectCopilotIntent(question);

    const context =
      await buildCopilotContext({
        question,
        intent: intentResult.intent,
        latitude,
        longitude,
        days,
        userId: currentUser.userId,
      });

    const copilotResponse =
      await generateCopilotResponse(
        context,
        intentResult.confidence,
      );

    const responseValidation =
      validateCopilotResponse(
        context,
        copilotResponse,
      );

    const evidenceValidation =
      validateCopilotEvidenceConsistency(
        context,
        copilotResponse,
      );

    const warnings = [
      ...responseValidation.warnings,
      ...evidenceValidation.warnings,
    ];

    const validationPassed =
      responseValidation.valid &&
      evidenceValidation.valid;

    if (!validationPassed) {
      console.warn(
        "Copilot validation warnings:",
        warnings,
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...copilotResponse,
        answer: responseValidation.answer,
        validation: {
          valid: validationPassed,
          warnings,
        },
      },
    });
  } catch (error) {
    console.error(
      "Copilot API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process Copilot request",
      },
      { status: 500 },
    );
  }
}