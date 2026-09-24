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

OUTPUT FORMAT:
- Start with the answer immediately.
- Do not mention or repeat the forecast/time period in the answer because the UI already displays it.
- Use short headings and concise bullet points.
- Keep the normal response within 6-10 short lines when possible.
- Never list more than 5 products.
- Prioritize products that require action.
- If more products exist than are displayed, summarize the remaining products with a count.
- Do not repeat the same product information.
- Do not provide long explanations unless the user explicitly asks for details.
- Do not repeat the forecast period in the opening sentence because the UI already displays it.

INTENT-SPECIFIC FORMAT:
- For REORDER:
  Show the products requiring restocking, recommended quantity, current stock, and urgency.
  Put immediate restocking actions first.
  Summarize products requiring no action instead of listing them.

  
- For STOCKOUT_RISK:
  Show the highest-risk products first.
  Include current stock, risk level, and required action.
  Summarize products without immediate risk.

- For DEMAND_TREND:
  Show the most significant increasing and decreasing demand trends.
  Include product name, predicted demand, and important percentage change.
  Do not list every product.

- For INVENTORY_OVERVIEW:
  Show total products and the most important inventory actions.
  Highlight stockouts, critical risks, and products requiring attention.
  Summarize healthy products by count.

- For EXPIRY_RISK:
  Show only the most urgent expiry risks.
  Include product or batch and the required action.
  Summarize lower-risk batches by count.

- For SEASONAL_DEMAND:
  Show only the most relevant seasonal or weather-driven demand signals.
  Highlight products requiring preparation or monitoring.
  Avoid listing every product.

- For NOTIFICATION_SUMMARY:
  Prioritize critical and warning alerts.
  Show the most important unresolved alerts first.
  Summarize lower-priority alerts by count.

- Do not claim that data covers a longer period than the PHARMIX evidence actually provides.
- Do not invent dates or forecast values.  
- For GREETING:
  Keep the response very short.


CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUESTION:
${context.question}

DETECTED INTENT:
${context.intent}

DETECTED TIME PERIOD:
${context.timePeriod.label}
Number of days:
${context.timePeriod.days}

Matched time phrase:
${context.timePeriod.matchedPhrase ?? "No explicit time phrase; default period used."}

PHARMIX EVIDENCE:
${JSON.stringify(context.evidence, null, 2)}

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
      timePeriod: context.timePeriod,
    };
  }

  const prompt = buildCopilotPrompt(context);

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
    timePeriod: context.timePeriod,
  };
}