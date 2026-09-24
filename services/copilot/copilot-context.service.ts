import { getAIInventorySummary } from "@/services/ai-inventory-summary.service";
import { getInventoryIntelligence } from "@/services/inventory-intelligence.service";
import { getInventoryRecommendations } from "@/services/inventory-recommendation.service";
import { getPredictionMonitoring } from "@/services/prediction-monitoring.service";
import { getDemandIntelligence } from "@/services/demand-intelligence.service";
import { getExpiringBatches } from "@/services/batch.service";
import { getNotifications } from "@/services/notification.service";
import {
  CopilotContext,
  CopilotConversationMessage,
  CopilotEvidence,
  CopilotIntent,
  CopilotTimePeriod,
} from "@/services/copilot/copilot.types";

interface CopilotContextOptions {
  question: string;
  intent: CopilotIntent;
  latitude: number;
  longitude: number;
  days?: number;
  userId: string;
  conversationHistory?: CopilotConversationMessage[];
  timePeriod?: CopilotTimePeriod;
}

export async function buildCopilotContext({
  question,
  intent,
  latitude,
  longitude,
  days = 7,
  userId,
  conversationHistory = [],
  timePeriod = {
    days,
    label: `next ${days} days`,
  },
}: CopilotContextOptions): Promise<CopilotContext> {
  const evidence: CopilotEvidence[] = [];

  const forecastDays = Math.min(
    Math.max(Math.floor(timePeriod.days || days), 1),
    30,
  );

  const normalizedTimePeriod: CopilotTimePeriod = {
    ...timePeriod,
    days: forecastDays,
  };

  switch (intent) {
    case "INVENTORY_OVERVIEW": {
      const data = await getAIInventorySummary({
        latitude,
        longitude,
        days: forecastDays,
      });

      evidence.push({
        source: "INVENTORY_SUMMARY",
        label: "PHARMIX inventory summary",
        data,
      });

      break;
    }

    case "STOCKOUT_RISK": {
      const data = await getInventoryIntelligence({
        latitude,
        longitude,
        days: forecastDays,
      });

      const stockoutProducts = data.products.filter(
        (product) =>
          product.priority === "STOCKOUT" ||
          product.priority === "URGENT_RESTOCK",
      );

      evidence.push({
        source: "INVENTORY_INTELLIGENCE",
        label: "PHARMIX inventory risk intelligence",
        data: {
          forecast: data.forecast,
          summary: data.summary,
          products: stockoutProducts,
        },
      });

      break;
    }

    case "REORDER": {
      const data = await getInventoryRecommendations({
        latitude,
        longitude,
        days: forecastDays,
      });

      const products = data.products.filter(
        (product) =>
          product.decision === "RESTOCK_NOW" ||
          product.decision === "RESTOCK_SOON",
      );

      evidence.push({
        source: "INVENTORY_RECOMMENDATIONS",
        label: "PHARMIX replenishment recommendations",
        data: {
          forecast: data.forecast,
          products,
        },
      });

      break;
    }

    case "DEMAND_TREND": {
      const data = await getPredictionMonitoring({
        days: forecastDays,
      });

      evidence.push({
        source: "PREDICTION_MONITORING",
        label: "PHARMIX demand trend monitoring",
        data,
      });

      break;
    }

    case "SEASONAL_DEMAND": {
      const data = await getDemandIntelligence({
        latitude,
        longitude,
      });

      const relevantProducts = data.products.filter(
        (product) => product.seasonalRelevance,
      );

      evidence.push({
        source: "DEMAND_INTELLIGENCE",
        label: "PHARMIX seasonal demand intelligence",
        data: {
          weather: data.weather,
          seasonalSignals: data.seasonalSignals,
          summary: data.summary,
          products: relevantProducts,
        },
      });

      break;
    }

    case "EXPIRY_RISK": {
      const batches = await getExpiringBatches(
        Math.min(forecastDays, 30),
      );

      evidence.push({
        source: "BATCHES",
        label: "PHARMIX batch expiry information",
        data: batches,
      });

      break;
    }

    case "NOTIFICATION_SUMMARY": {
      const data = await getNotifications({
        userId,
        isRead: false,
        page: 1,
        limit: 20,
      });

      evidence.push({
        source: "NOTIFICATIONS",
        label: "PHARMIX unread notifications",
        data,
      });

      break;
    }

    case "GREETING":
      break;
  }

  return {
    intent,
    question,
    conversationHistory,
    evidence,
    timePeriod: normalizedTimePeriod,
  };
}