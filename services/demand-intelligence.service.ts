import { prisma } from "@/lib/prisma";
import {
  getCurrentWeather,
} from "@/services/weather.service";
import {
  getSeasonalDemandSignals,
} from "@/services/seasonal-health.service";

interface DemandIntelligenceOptions {
  latitude: number;
  longitude: number;
}

interface ProductDemandSignal {
  productId: string;
  productName: string;
  category: string;

  currentStock: number;
  recentSalesQuantity: number;

  seasonalRelevance: boolean;

  demandSignal:
    | "LOW"
    | "MODERATE"
    | "HIGH";

  reason: string;
}

const CATEGORY_KEYWORDS: Record<
  string,
  string[]
> = {
  RESPIRATORY: [
    "respiratory",
    "cold",
    "cough",
    "flu",
    "respiratory",
  ],

  FEVER_COLD: [
    "fever",
    "cold",
    "flu",
    "paracetamol",
    "ibuprofen",
    "antipyretic",
  ],

  GASTROINTESTINAL: [
    "gastro",
    "stomach",
    "digestive",
    "diarrhea",
    "diarrhoea",
    "oral rehydration",
    "ors",
  ],

  VECTOR_BORNE_PREVENTION: [
    "mosquito",
    "repellent",
    "vector",
    "prevention",
  ],

  ALLERGY: [
    "allergy",
    "allergic",
    "antihistamine",
    "cetirizine",
    "loratadine",
  ],

  DEHYDRATION: [
    "dehydration",
    "oral rehydration",
    "ors",
    "electrolyte",
  ],
};

function matchesCategory(
  productText: string,
  category: string,
): boolean {
  const keywords =
    CATEGORY_KEYWORDS[category] ?? [];

  return keywords.some((keyword) =>
    productText.includes(keyword),
  );
}

function getDemandSignal(
  seasonalRelevance: boolean,
  recentSalesQuantity: number,
): "LOW" | "MODERATE" | "HIGH" {
  if (!seasonalRelevance) {
    return "LOW";
  }

  if (recentSalesQuantity >= 10) {
    return "HIGH";
  }

  if (recentSalesQuantity >= 5) {
    return "MODERATE";
  }

  return "MODERATE";
}

export async function getDemandIntelligence({
  latitude,
  longitude,
}: DemandIntelligenceOptions) {
  const weather =
    await getCurrentWeather(
      latitude,
      longitude,
    );

  const seasonalSignals =
    getSeasonalDemandSignals(weather);

  const products =
    await prisma.product.findMany({
      include: {
        inventory: true,
        category: true,
        saleItems: {
          where: {
            sale: {
              createdAt: {
                gte: new Date(
                  Date.now() -
                    30 * 24 * 60 * 60 * 1000,
                ),
              },
            },
          },
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

  const productSignals: ProductDemandSignal[] =
    products.map((product) => {
      const productText =
        [
          product.name,
          product.genericName,
          product.brand,
          product.category.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      const matchedCategories =
        seasonalSignals.categories.filter(
          (category) =>
            matchesCategory(
              productText,
              category,
            ),
        );

      const recentSalesQuantity =
        product.saleItems.reduce(
          (total, item) =>
            total + item.quantity,
          0,
        );

      const seasonalRelevance =
        matchedCategories.length > 0;

      const demandSignal =
        getDemandSignal(
          seasonalRelevance,
          recentSalesQuantity,
        );

      let reason =
        "No strong seasonal relevance detected.";

      if (seasonalRelevance) {
        reason =
          `Seasonal signal matched: ${matchedCategories.join(
            ", ",
          )}.`;

        if (recentSalesQuantity > 0) {
          reason += ` ${recentSalesQuantity} units sold in the last 30 days.`;
        }
      }

      return {
        productId: product.id,
        productName: product.name,
        category: product.category.name,

        currentStock:
          product.inventory?.quantity ?? 0,

        recentSalesQuantity,

        seasonalRelevance,

        demandSignal,

        reason,
      };
    });

  const relevantProducts =
    productSignals.filter(
      (product) =>
        product.seasonalRelevance,
    );

  return {
    weather,
    seasonalSignals,

    summary: {
      totalProducts: products.length,
      seasonallyRelevantProducts:
        relevantProducts.length,

      highDemandSignalProducts:
        relevantProducts.filter(
          (product) =>
            product.demandSignal === "HIGH",
        ).length,

      moderateDemandSignalProducts:
        relevantProducts.filter(
          (product) =>
            product.demandSignal === "MODERATE",
        ).length,
    },

    products: productSignals,
  };
}