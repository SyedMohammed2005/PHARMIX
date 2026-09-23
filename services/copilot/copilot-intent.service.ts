import {
  CopilotIntent,
  CopilotIntentResult,
} from "@/services/copilot/copilot.types";

type IntentRule = {
  intent: CopilotIntent;
  keywords: string[];
  reason: string;
};

const INTENT_RULES: IntentRule[] = [
  {
    intent: "GREETING",
    keywords: [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
    ],
    reason:
      "The question contains a common conversational greeting.",
  },

  {
    intent: "STOCKOUT_RISK",
    keywords: [
      "stockout",
      "stock out",
      "run out",
      "running out",
      "shortage",
      "short",
      "out of stock",
    ],
    reason:
      "The question contains language related to stock shortages or products running out.",
  },

  {
    intent: "REORDER",
    keywords: [
      "reorder",
      "re-stock",
      "restock",
      "replenish",
      "replenishment",
      "what should i order",
      "what should we order",
      "what should i buy",
      "what should we buy",
    ],
    reason:
      "The question asks about replenishment or what inventory should be ordered.",
  },

  {
    intent: "EXPIRY_RISK",
    keywords: [
      "expiry",
      "expire",
      "expires",
      "expiring",
      "expired",
      "expiration",
      "batch expiry",
    ],
    reason:
      "The question contains language related to medicine or batch expiry.",
  },

  {
    intent: "SEASONAL_DEMAND",
    keywords: [
      "seasonal",
      "season",
      "weather demand",
      "weather",
      "rain",
      "temperature",
      "humidity",
      "seasonally relevant",
    ],
    reason:
      "The question asks about seasonal or environmental demand signals.",
  },

  {
    intent: "DEMAND_TREND",
    keywords: [
      "demand",
      "demand trend",
      "demand increase",
      "demand decrease",
      "demand spike",
      "demand drop",
      "sales increase",
      "sales decrease",
      "increasing",
      "decreasing",
      "trend",
      "growth",
    ],
    reason:
      "The question asks about demand, sales movement, or a demand trend.",
  },

  {
    intent: "NOTIFICATION_SUMMARY",
    keywords: [
      "notification",
      "notifications",
      "alerts",
      "alert",
      "warnings",
      "warning",
      "important alerts",
      "today's alerts",
      "todays alerts",
    ],
    reason:
      "The question asks about PHARMIX notifications or operational alerts.",
  },

  {
    intent: "INVENTORY_OVERVIEW",
    keywords: [
      "inventory",
      "stock situation",
      "inventory situation",
      "inventory overview",
      "stock overview",
      "inventory status",
      "stock status",
      "how is inventory",
      "how is our inventory",
    ],
    reason:
      "The question asks for a general overview of the pharmacy inventory.",
  },
];

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function detectCopilotIntent(
  question: string,
): CopilotIntentResult {
  const normalizedQuestion =
    normalizeQuestion(question);

  if (!normalizedQuestion) {
    return {
      intent: "INVENTORY_OVERVIEW",
      confidence: 0,
      reason:
        "No question was provided, so no specific intent could be detected.",
    };
  }

  for (const rule of INTENT_RULES) {
    const matchedKeyword =
      rule.intent === "GREETING"
        ? rule.keywords.find((keyword) => {
            const escapedKeyword = keyword.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&",
            );

            const pattern = new RegExp(
              `(^|\\s)${escapedKeyword}(?=\\s|$|[!?.,])`,
            );

            return pattern.test(normalizedQuestion);
          })
        : rule.keywords.find((keyword) =>
            normalizedQuestion.includes(keyword),
          );

    if (matchedKeyword) {
      return {
        intent: rule.intent,
        confidence: 0.95,
        reason:
          `${rule.reason} Matched phrase: "${matchedKeyword}".`,
      };
    }
  }

  return {
    intent: "INVENTORY_OVERVIEW",
    confidence: 0.4,
    reason:
      "No specific supported intent was detected, so PHARMIX will use the general inventory overview context.",
  };
}