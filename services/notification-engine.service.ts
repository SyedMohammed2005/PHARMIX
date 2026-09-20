import {
  generateStockoutRiskNotifications,
} from "@/services/stockout-risk.service";

import {
  generateDemandAnomalyNotifications,
} from "@/services/demand-anomaly.service";

import {
  generateExpiryRiskNotifications,
} from "@/services/batch.service";

type NotificationEngineResult = {
  stockoutRisk: {
    checkedProducts: number;
    risksFound: number;
    notificationsCreated: number;
  };

  demandAnomaly: {
    checkedProducts: number;
    spikesFound: number;
    dropsFound: number;
    notificationsCreated: number;
  };

  expiryRisk: {
    checkedBatches: number;
    notificationsCreated: number;
  };

  totalNotificationsCreated: number;
};

/**
 * Central PHARMIX Notification Intelligence Engine.
 *
 * This service orchestrates the existing notification
 * generators. It does not contain their business logic.
 */
export async function generateNotificationIntelligence(
  userId: string,
  options?: {
    forecastDays?: number;
    demandLookbackDays?: number;
    expiryDays?: number;
  },
): Promise<NotificationEngineResult> {
  const forecastDays =
    Math.max(
      Math.floor(
        options?.forecastDays ?? 7,
      ),
      1,
    );

  const demandLookbackDays =
    Math.max(
      Math.floor(
        options?.demandLookbackDays ?? 7,
      ),
      1,
    );

  const expiryDays =
    Math.max(
      Math.floor(
        options?.expiryDays ?? 30,
      ),
      1,
    );

  /**
   * Run all existing intelligence generators.
   *
   * Promise.all allows the independent systems
   * to execute concurrently.
   */
  const [
    stockoutRisk,
    demandAnomaly,
    expiryRisk,
  ] = await Promise.all([
    generateStockoutRiskNotifications(
      userId,
      forecastDays,
    ),

    generateDemandAnomalyNotifications(
      userId,
      demandLookbackDays,
    ),

    generateExpiryRiskNotifications(
      userId,
      expiryDays,
    ),
  ]);

  const totalNotificationsCreated =
    stockoutRisk.notificationsCreated +
    demandAnomaly.notificationsCreated +
    expiryRisk.notificationsCreated;

  return {
    stockoutRisk: {
      checkedProducts:
        stockoutRisk.checkedProducts,

      risksFound:
        stockoutRisk.risksFound,

      notificationsCreated:
        stockoutRisk.notificationsCreated,
    },

    demandAnomaly: {
      checkedProducts:
        demandAnomaly.checkedProducts,

      spikesFound:
        demandAnomaly.spikesFound,

      dropsFound:
        demandAnomaly.dropsFound,

      notificationsCreated:
        demandAnomaly.notificationsCreated,
    },

    expiryRisk: {
      checkedBatches:
        expiryRisk.checkedBatches,

      notificationsCreated:
        expiryRisk.notificationsCreated,
    },

    totalNotificationsCreated,
  };
}