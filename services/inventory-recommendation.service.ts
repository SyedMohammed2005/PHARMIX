import { getInventoryDecisions } from "@/services/inventory-decision.service";

interface InventoryRecommendationOptions {
  latitude: number;
  longitude: number;
  days?: number;
}

export async function getInventoryRecommendations({
  latitude,
  longitude,
  days = 7,
}: InventoryRecommendationOptions) {
 const result = await getInventoryDecisions({
  latitude,
  longitude,
  days,
});

const products = result.map((product) => {
    const currentStock = product.inventory.currentStock;
    const reorderPoint = product.inventory.reorderPoint;

    const predictedDailyDemand =
      product.forecast.predictedDailyDemand;

    const forecastDemand =
      product.forecast.predictedDemand;

    const targetStock =
      Math.ceil(forecastDemand + reorderPoint);

    const recommendedRestockQuantity =
      Math.max(targetStock - currentStock, 0);

    let urgency:
      | "HIGH"
      | "MEDIUM"
      | "LOW";

    if (product.decision === "RESTOCK_NOW") {
      urgency = "HIGH";
    } else if (product.decision === "RESTOCK_SOON") {
      urgency = "MEDIUM";
    } else {
      urgency = "LOW";
    }
let recommendationBasis:
  | "DEMAND_FORECAST"
  | "INVENTORY_POLICY"
  | "COMBINED";

if (forecastDemand > 0 && reorderPoint > 0) {
  recommendationBasis = "COMBINED";
} else if (forecastDemand > 0) {
  recommendationBasis = "DEMAND_FORECAST";
} else {
  recommendationBasis = "INVENTORY_POLICY";
}

let reason: string;

if (recommendedRestockQuantity === 0) {
  reason =
    "Current stock is sufficient for the forecasted demand and inventory policy.";
} else if (recommendationBasis === "INVENTORY_POLICY") {
  reason =
    `Current stock is insufficient. Pharmix recommends replenishing ${recommendedRestockQuantity} units based on the inventory reorder policy.`;
} else if (recommendationBasis === "DEMAND_FORECAST") {
  reason =
    `Forecasted demand requires additional stock. Pharmix recommends replenishing ${recommendedRestockQuantity} units based on predicted demand.`;
} else {
  reason =
    `Pharmix recommends replenishing ${recommendedRestockQuantity} units based on forecasted demand and the inventory reorder point.`;
}

    return {
      productId: product.productId,
      productName: product.productName,

      decision: product.decision,

      inventory: {
        currentStock,
        reorderPoint,
      },

      forecast: {
        days,
        predictedDailyDemand,
        predictedDemand: forecastDemand,
      },

     recommendation: {
  targetStock,
  recommendedRestockQuantity,
  urgency,
  basis: recommendationBasis,
},

      demand: {
        trend: product.demand.trend,
        growthPercentage: product.demand.growthPercentage,
      },

      risk: {
        level: product.risk.level,
        score: product.risk.score,
        priority: product.risk.priority,
      },

      reason,
    };
  });

  return {
    forecast: {
      days,
    },
    products,
  };
}