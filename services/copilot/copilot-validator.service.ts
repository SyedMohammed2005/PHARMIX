import {
  CopilotContext,
  CopilotResponse,
} from "@/services/copilot/copilot.types";

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  answer: string;
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function collectEvidenceProductNames(
  context: CopilotContext,
): string[] {
  const names: string[] = [];

  for (const evidence of context.evidence) {
    const data = evidence.data;

    if (!data || typeof data !== "object") {
      continue;
    }

    const evidenceObject =
      data as Record<string, unknown>;

    const products = evidenceObject.products;

    if (Array.isArray(products)) {
      for (const product of products) {
        if (
          product &&
          typeof product === "object"
        ) {
          const productObject =
            product as Record<string, unknown>;

          if (
            typeof productObject.productName ===
            "string"
          ) {
            names.push(productObject.productName);
          }
        }
      }
    }

    const priorities =
      evidenceObject.priorities;

    if (
      priorities &&
      typeof priorities === "object"
    ) {
      const prioritiesObject =
        priorities as Record<
          string,
          unknown
        >;

      const priorityProducts = [
        prioritiesObject.highestRiskProduct,
        prioritiesObject.highestDemandProduct,
      ];

      for (const product of priorityProducts) {
        if (
          product &&
          typeof product === "object"
        ) {
          const productObject =
            product as Record<
              string,
              unknown
            >;

          if (
            typeof productObject.productName ===
            "string"
          ) {
            names.push(
              productObject.productName,
            );
          }
        }
      }
    }
  }

  return [...new Set(names)];
}

function containsUnsupportedMedicalAdvice(
  answer: string,
): boolean {
  const normalized = normalizeText(answer);

  const medicalAdvicePatterns = [
    "you should take",
    "take this medicine",
    "take this medication",
    "increase your dose",
    "decrease your dose",
    "change your dose",
    "stop taking",
    "start taking",
    "diagnose",
    "you have diabetes",
    "you have an infection",
    "prescribe",
    "prescription",
  ];

  return medicalAdvicePatterns.some(
    (pattern) =>
      normalized.includes(pattern),
  );
}

function containsUnsupportedActionClaim(
  answer: string,
): boolean {
  const normalized = normalizeText(answer);

  const actionPatterns = [
    "i reordered",
    "i have reordered",
    "i placed the order",
    "order has been placed",
    "i updated the inventory",
    "inventory has been updated",
    "i changed the stock",
    "stock has been updated",
  ];

  return actionPatterns.some(
    (pattern) =>
      normalized.includes(pattern),
  );
}

function validateEvidenceReferences(
  answer: string,
  context: CopilotContext,
): string[] {
  const warnings: string[] = [];

  const normalizedAnswer =
    normalizeText(answer);

  const productNames =
    collectEvidenceProductNames(context);

  /*
   * We only validate product names that are
   * explicitly known from PHARMIX evidence.
   *
   * We do NOT try to extract every capitalized
   * phrase from Gemini's answer because normal
   * English phrases such as:
   *
   * "Product"
   * "Reason"
   * "HIGH"
   * "PHARMIX"
   *
   * are not product names.
   */

  if (productNames.length === 0) {
    return warnings;
  }

  const mentionedEvidenceProducts =
    productNames.filter((productName) =>
      normalizedAnswer.includes(
        normalizeText(productName),
      ),
    );

  /*
   * If the evidence contains products but the
   * answer discusses a specific product-oriented
   * intent without mentioning any known product,
   * flag it for review.
   */
  const productSpecificIntents = [
    "STOCKOUT_RISK",
    "REORDER",
    "EXPIRY_RISK",
    "DEMAND_TREND",
    "SEASONAL_DEMAND",
  ];

  if (
    productSpecificIntents.includes(
      context.intent,
    ) &&
    mentionedEvidenceProducts.length === 0
  ) {
    warnings.push(
      "The AI response does not clearly reference any product found in the supplied PHARMIX evidence.",
    );
  }

  return warnings;
}

export function validateCopilotResponse(
  context: CopilotContext,
  response: CopilotResponse,
): ValidationResult {
  const warnings: string[] = [];

  const answer =
    response.answer?.trim() ?? "";

  if (!answer) {
    return {
      valid: false,
      warnings: [
        "Gemini returned an empty response.",
      ],
      answer:
        "PHARMIX could not generate a reliable answer from the available data.",
    };
  }

  if (
    containsUnsupportedMedicalAdvice(answer)
  ) {
    warnings.push(
      "The AI response contains potentially unsupported medical advice.",
    );
  }

  if (
    containsUnsupportedActionClaim(answer)
  ) {
    warnings.push(
      "The AI response claims an operational action that PHARMIX has not confirmed.",
    );
  }

  warnings.push(
    ...validateEvidenceReferences(
      answer,
      context,
    ),
  );

  return {
    valid: warnings.length === 0,
    warnings,
    answer,
  };
}