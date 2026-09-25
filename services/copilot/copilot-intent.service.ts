import {
  CopilotConversationMessage,
  CopilotIntent,
  CopilotIntentResult,
  CopilotTimePeriod,
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

function detectTimePeriod(
  question: string,
  fallbackDays: number,
): CopilotTimePeriod {
  const normalizedQuestion = normalizeQuestion(question);

  const periodRules: Array<{
    days: number;
    label: string;
    keywords: string[];
  }> = [
    {
      days: 1,
      label: "today",
      keywords: [
        "today",
        "for today",
        "today's",
        "todays",
      ],
    },
    {
      days: 7,
      label: "next 7 days",
      keywords: [
        "next 7 days",
        "next seven days",
        "7 days",
        "seven days",
        "this week",
        "next week",
        "weekly",
      ],
    },
    {
      days: 14,
      label: "next 14 days",
      keywords: [
        "next 14 days",
        "next fourteen days",
        "14 days",
        "fourteen days",
        "next 2 weeks",
        "next two weeks",
        "2 weeks",
        "two weeks",
        "fortnight",
        "biweekly",
      ],
    },
    {
      days: 30,
      label: "next 30 days",
      keywords: [
        "next 30 days",
        "next thirty days",
        "30 days",
        "thirty days",
        "next month",
        "this month",
        "monthly",
        "one month",
        "1 month",
      ],
    },
  ];

  for (const rule of periodRules) {
    const matchedKeyword = rule.keywords.find((keyword) =>
      normalizedQuestion.includes(keyword),
    );

    if (matchedKeyword) {
      return {
        days: rule.days,
        label: rule.label,
        matchedPhrase: matchedKeyword,
      };
    }
  }

  return {
    days: fallbackDays,
    label:
      fallbackDays === 1
        ? "today"
        : fallbackDays === 7
          ? "next 7 days"
          : fallbackDays === 14
            ? "next 14 days"
            : fallbackDays === 30
              ? "next 30 days"
              : `next ${fallbackDays} days`,
  };
}

function isContextualFollowUp(question: string): boolean {
  const normalizedQuestion = normalizeQuestion(question);

  const contextualPhrases = [
    "those products",
    "those medicines",
    "those medicine",
    "what about them",
    "what about those",
    "what about these",
    "show them",
    "show those",
    "show these",
    "tell me about them",
    "tell me about those",
    "tell me about these",
    "and those",
    "and these",
    "what about that",
    "what about the above",
    "show the above",
  ];

  return contextualPhrases.some((phrase) =>
    normalizedQuestion.includes(phrase),
  );
}

function getPreviousUserQuestion(
  conversationHistory: CopilotConversationMessage[],
): string | null {
  for (let index = conversationHistory.length - 1; index >= 0; index--) {
    const message = conversationHistory[index];

    if (message.role === "user") {
      return message.content;
    }
  }

  return null;
}

export function detectCopilotIntent(
  question: string,
  fallbackDays = 7,
  conversationHistory: CopilotConversationMessage[] = [],
): CopilotIntentResult {
  const normalizedQuestion = normalizeQuestion(question);

  const timePeriod = detectTimePeriod(
    question,
    fallbackDays,
  );

  if (!normalizedQuestion) {
    return {
      intent: "INVENTORY_OVERVIEW",
      confidence: 0,
      reason:
        "No question was provided, so no specific intent could be detected.",
      timePeriod,
    };
  }

  if (isContextualFollowUp(question)) {
    const previousUserQuestion =
      getPreviousUserQuestion(conversationHistory);

    if (previousUserQuestion) {
      const previousIntent = detectCopilotIntent(
        previousUserQuestion,
        fallbackDays,
      );

      if (
        previousIntent.intent !== "INVENTORY_OVERVIEW" &&
        previousIntent.intent !== "GREETING"
      ) {
        return {
          intent: previousIntent.intent,
          confidence: 0.9,
          reason:
            `The current question is a contextual follow-up to the previous user question. ` +
            `Inherited intent: ${previousIntent.intent}. ` +
            `Time period: ${timePeriod.label}.`,
          timePeriod,
        };
      }
    }
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

            return pattern.test(
              normalizedQuestion,
            );
          })
        : rule.keywords.find((keyword) =>
            normalizedQuestion.includes(keyword),
          );

    if (matchedKeyword) {
      return {
        intent: rule.intent,
        confidence: 0.95,
        reason:
          `${rule.reason} Matched phrase: "${matchedKeyword}". ` +
          `Time period: ${timePeriod.label}.`,
        timePeriod,
      };
    }
  }

  return {
    intent: "INVENTORY_OVERVIEW",
    confidence: 0.4,
    reason:
      "No specific supported intent was detected, so PHARMIX will use the general inventory overview context.",
    timePeriod,
  };
}