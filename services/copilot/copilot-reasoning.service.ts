import { gemini } from "@/lib/gemini";
import {
  CopilotContext,
  CopilotResponse,
} from "@/services/copilot/copilot.types";

function buildCopilotPrompt(
  context: CopilotContext,
): string {
  return `
You are the AI Pharmacy Copilot for PHARMIX, a pharmacy management system.

Your job is to help pharmacy staff understand their PHARMIX operational data.

IMPORTANT RULES:

1. Use the supplied PHARMIX evidence as the primary source of truth.
2. Do not invent products, quantities, forecasts, risks, sales, or alerts.
3. If the evidence does not contain enough information to answer the question, clearly say that the available PHARMIX data is insufficient.
4. Do not provide personalized medical diagnosis, treatment, or individualized dosage instructions.
5. Do not independently recommend replacing one medicine with another.
6. This Copilot is for pharmacy operations such as inventory, demand, expiry, replenishment, alerts, and trends.
7. When discussing inventory risk, describe it as PHARMIX's inventory model/risk model rather than an objective medical fact.
8. Keep answers concise, practical, and understandable to pharmacy staff.
9. Mention important numbers from the evidence when they help explain the answer.
10. Never claim that an action was performed unless the evidence explicitly shows it.

USER QUESTION:
${context.question}

DETECTED INTENT:
${context.intent}

PHARMIX EVIDENCE:
${JSON.stringify(context.evidence, null, 2)}

Answer the user's question using the PHARMIX evidence above.
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
  };
}