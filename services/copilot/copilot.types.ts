export type CopilotIntent =
  | "INVENTORY_OVERVIEW"
  | "STOCKOUT_RISK"
  | "REORDER"
  | "DEMAND_TREND"
  | "EXPIRY_RISK"
  | "SEASONAL_DEMAND"
  | "NOTIFICATION_SUMMARY"
  | "GREETING";

export type CopilotContextSource =
  | "INVENTORY_SUMMARY"
  | "INVENTORY_INTELLIGENCE"
  | "INVENTORY_RECOMMENDATIONS"
  | "PREDICTION_MONITORING"
  | "DEMAND_INTELLIGENCE"
  | "BATCHES"
  | "NOTIFICATIONS";

export interface CopilotIntentResult {
  intent: CopilotIntent;
  confidence: number;
  reason: string;
}

export interface CopilotConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotEvidence {
  source: CopilotContextSource;
  label: string;
  data: unknown;
}

export interface CopilotContext {
  intent: CopilotIntent;
  question: string;
  conversationHistory: CopilotConversationMessage[];
  evidence: CopilotEvidence[];
}

export interface CopilotResponse {
  answer: string;
  intent: CopilotIntent;
  confidence: number;
  evidence: CopilotEvidence[];
}