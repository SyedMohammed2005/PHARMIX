import {
  CopilotContext,
  CopilotResponse,
} from "@/services/copilot/copilot.types";

interface EvidenceValidationResult {
  valid: boolean;
  warnings: string[];
}

interface ProductEvidence {
  productName: string;
  currentStock?: number;
  reorderPoint?: number;
  predictedDemand?: number;
  predictedDailyDemand?: number;
  recommendedRestockQuantity?: number;
  targetStock?: number;
  forecastDays?: number;
  riskLevel?: string;
  urgency?: string;
}

function collectProductEvidence(
  context: CopilotContext,
): ProductEvidence[] {
  const products: ProductEvidence[] = [];

  for (const evidence of context.evidence) {
    if (
      !evidence.data ||
      typeof evidence.data !== "object"
    ) {
      continue;
    }

    const data =
      evidence.data as Record<string, unknown>;

    if (!Array.isArray(data.products)) {
      continue;
    }

    for (const product of data.products) {
      if (
        !product ||
        typeof product !== "object"
      ) {
        continue;
      }

      const item =
        product as Record<string, unknown>;

      const inventory =
        item.inventory;

      const forecast =
        item.forecast;

      const recommendation =
        item.recommendation;

      const risk =
        item.risk;

      const productName =
        typeof item.productName === "string"
          ? item.productName
          : "";

      if (!productName) {
        continue;
      }

      products.push({
        productName,

        currentStock:
          inventory &&
          typeof inventory === "object" &&
          typeof (
            inventory as Record<string, unknown>
          ).currentStock === "number"
            ? (
                inventory as Record<
                  string,
                  unknown
                >
              ).currentStock as number
            : undefined,

        reorderPoint:
          inventory &&
          typeof inventory === "object" &&
          typeof (
            inventory as Record<string, unknown>
          ).reorderPoint === "number"
            ? (
                inventory as Record<
                  string,
                  unknown
                >
              ).reorderPoint as number
            : undefined,

        predictedDemand:
          forecast &&
          typeof forecast === "object" &&
          typeof (
            forecast as Record<string, unknown>
          ).predictedDemand === "number"
            ? (
                forecast as Record<
                  string,
                  unknown
                >
              ).predictedDemand as number
            : undefined,

        predictedDailyDemand:
          forecast &&
          typeof forecast === "object" &&
          typeof (
            forecast as Record<string, unknown>
          ).predictedDailyDemand === "number"
            ? (
                forecast as Record<
                  string,
                  unknown
                >
              ).predictedDailyDemand as number
            : undefined,

        forecastDays:
          forecast &&
          typeof forecast === "object" &&
          typeof (
            forecast as Record<string, unknown>
          ).days === "number"
            ? (
                forecast as Record<
                  string,
                  unknown
                >
              ).days as number
            : undefined,

        recommendedRestockQuantity:
          recommendation &&
          typeof recommendation === "object" &&
          typeof (
            recommendation as Record<
              string,
              unknown
            >
          ).recommendedRestockQuantity ===
            "number"
            ? (
                recommendation as Record<
                  string,
                  unknown
                >
              )
                .recommendedRestockQuantity as number
            : undefined,

        targetStock:
          recommendation &&
          typeof recommendation === "object" &&
          typeof (
            recommendation as Record<
              string,
              unknown
            >
          ).targetStock === "number"
            ? (
                recommendation as Record<
                  string,
                  unknown
                >
              ).targetStock as number
            : undefined,

        riskLevel:
          risk &&
          typeof risk === "object" &&
          typeof (
            risk as Record<string, unknown>
          ).level === "string"
            ? (
                risk as Record<
                  string,
                  unknown
                >
              ).level as string
            : undefined,

        urgency:
          recommendation &&
          typeof recommendation === "object" &&
          typeof (
            recommendation as Record<
              string,
              unknown
            >
          ).urgency === "string"
            ? (
                recommendation as Record<
                  string,
                  unknown
                >
              ).urgency as string
            : undefined,
      });
    }
  }

  return products;
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function extractNumberMentions(
  answer: string,
): number[] {
  const matches =
    answer.match(
      /\b\d+(?:\.\d+)?\b/g,
    ) ?? [];

  return matches.map(Number);
}

function approximatelyEqual(
  first: number,
  second: number,
): boolean {
  return Math.abs(first - second) < 0.01;
}

export function validateCopilotEvidenceConsistency(
  context: CopilotContext,
  response: CopilotResponse,
): EvidenceValidationResult {
  const warnings: string[] = [];

  const products =
    collectProductEvidence(context);

  if (products.length === 0) {
    return {
      valid: true,
      warnings: [],
    };
  }

  const answer = response.answer;

  const numbers =
    extractNumberMentions(answer);

  for (const product of products) {
    const productMentioned =
      normalize(answer).includes(
        normalize(product.productName),
      );

    if (!productMentioned) {
      continue;
    }

    if (
      product.recommendedRestockQuantity !==
        undefined &&
      response.intent === "REORDER"
    ) {
      const expected =
        product.recommendedRestockQuantity;

      const containsExpected =
        numbers.some((number) =>
          approximatelyEqual(
            number,
            expected,
          ),
        );

      if (!containsExpected) {
        warnings.push(
          `${product.productName}: the response does not clearly contain the PHARMIX recommended restock quantity of ${expected}.`,
        );
      }
    }

    if (
      product.currentStock !== undefined &&
      response.intent === "REORDER"
    ) {
      const expected =
        product.currentStock;

      const containsExpected =
        numbers.some((number) =>
          approximatelyEqual(
            number,
            expected,
          ),
        );

      if (!containsExpected) {
        warnings.push(
          `${product.productName}: the response does not clearly contain the PHARMIX current stock value of ${expected}.`,
        );
      }
    }

    if (
      product.reorderPoint !== undefined &&
      response.intent === "REORDER"
    ) {
      const expected =
        product.reorderPoint;

      const containsExpected =
        numbers.some((number) =>
          approximatelyEqual(
            number,
            expected,
          ),
        );

      if (!containsExpected) {
        warnings.push(
          `${product.productName}: the response does not clearly contain the PHARMIX reorder point of ${expected}.`,
        );
      }
    }

  
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}