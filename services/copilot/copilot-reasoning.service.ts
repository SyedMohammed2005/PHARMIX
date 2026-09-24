import { gemini } from "@/lib/gemini";

import {
  CopilotContext,
  CopilotResponse,
} from "@/services/copilot/copilot.types";

function buildCopilotPrompt(
  context: CopilotContext,
): string {
  const conversationHistory =
    context.conversationHistory.length > 0
      ? context.conversationHistory
          .map(
            (message) =>
              `${message.role.toUpperCase()}: ${message.content}`,
          )
          .join("\n")
      : "No previous conversation.";

  return `
You are the AI Pharmacy Copilot for PHARMIX, a pharmacy management system.

Your job is to answer the user's question using the PHARMIX evidence provided below.

IMPORTANT RULES:
- Use the PHARMIX evidence as the primary source of truth.
- Do not invent pharmacy data.
- If the evidence does not contain enough information, clearly say so.
- Use the conversation history to understand references such as:
  "those products", "that medicine", "the previous ones", "them", "it", or similar follow-up language.
- The conversation history provides context only. Current PHARMIX evidence should be used for the actual current answer.
- If the current question changes the subject, follow the current question.
- Keep the answer clear, practical, and useful for pharmacy operations.

CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUESTION:
${context.question}

DETECTED INTENT:
${context.intent}

PHARMIX EVIDENCE:
${JSON.stringify(
  context.evidence,
  null,
  2,
)}

Answer the user's current question using the PHARMIX evidence above and the conversation history when necessary.
`;
}

export async function generateCopilotResponse(
  context: CopilotContext,
  confidence: number,
): Promise<CopilotResponse> {
  if (context.intent === "GREETING") {
    return {
      answer:
        "Hi! 👋 I'm PHARMIX Copilot.\n\nI can help you with:\n• Inventory\n• Stockout risks\n• Reordering\n• Demand trends\n• Expiry risks\n• Seasonal demand\n• Alerts",
      intent: context.intent,
      confidence,
      evidence: context.evidence,
    };
  }

  const prompt =
    buildCopilotPrompt(context);

  const response =
    await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

  const answer =
    response.text?.trim();

  if (!answer) {
    throw new Error(
      "Gemini returned an empty Copilot response",
    );
  }

  return {
    answer,
    intent: context.intent,
    confidence,
    evidence: context.evidence,
  };
}