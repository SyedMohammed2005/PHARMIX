import { prisma } from "@/lib/prisma";

import { getDemandPredictions } from "@/services/prediction.service";

import { createNotification } from "@/services/notification.service";

import {
  NotificationSeverity,
  NotificationType,
} from "../src/generated/prisma/client";

const DEFAULT_FORECAST_DAYS = 7;

type StockoutRiskResult = {
  checkedProducts: number;
  risksFound: number;
  notificationsCreated: number;
  notifications: unknown[];
};

/**
 * Generates STOCKOUT_RISK notifications using
 * the existing PHARMIX demand prediction engine.
 *
 * The prediction service remains the source of truth
 * for predicted demand.
 */
export async function generateStockoutRiskNotifications(
  userId: string,
  days = DEFAULT_FORECAST_DAYS,
): Promise<StockoutRiskResult> {
  const forecastDays = Math.max(
    Math.floor(days),
    1,
  );

  /**
   * Reuse the existing prediction system.
   *
   * We deliberately do NOT create another forecasting
   * calculation here.
   */
  const predictions =
    await getDemandPredictions({
      days: forecastDays,
    });

  const notifications = [];

  let risksFound = 0;

  for (const item of predictions) {
    const predictedDailyDemand =
      item.prediction.predictedDailyDemand;

    const currentStock =
      item.prediction.currentStock;

    /**
     * We cannot estimate stockout time when
     * predicted demand is zero or negative.
     */
    if (
      predictedDailyDemand <= 0 ||
      currentStock <= 0
    ) {
      continue;
    }

    /**
     * Estimated number of days until stockout.
     */
    const estimatedStockoutDays =
      currentStock /
      predictedDailyDemand;

    /**
     * A stockout risk exists when the available
     * stock is expected to be consumed within
     * the selected forecast horizon.
     */
    const isStockoutRisk =
      estimatedStockoutDays <=
      forecastDays;

    if (!isStockoutRisk) {
      continue;
    }

    risksFound++;

    /**
     * Avoid duplicate unread notifications for
     * the same product.
     */
    const existingNotification =
      await prisma.notification.findFirst({
        where: {
          userId,
          type: NotificationType.STOCKOUT_RISK,
          entity: "Product",
          entityId: item.productId,
          isRead: false,
        },
      });

    if (existingNotification) {
      continue;
    }

    /**
     * Critical:
     * Stockout expected within 3 days.
     *
     * Warning:
     * Stockout expected after 3 days but within
     * the selected forecast horizon.
     */
    const severity =
      estimatedStockoutDays <= 3
        ? NotificationSeverity.CRITICAL
        : NotificationSeverity.WARNING;

    const roundedDays =
      Number(
        estimatedStockoutDays.toFixed(1),
      );

    const notification =
      await createNotification({
        userId,
        type: NotificationType.STOCKOUT_RISK,
        severity,
        title: "Stockout risk detected",
        message:
          `${item.productName} may run out of stock in approximately ` +
          `${roundedDays} days based on the current demand forecast. ` +
          `Current stock: ${currentStock}. ` +
          `Predicted daily demand: ${predictedDailyDemand}.`,
        entity: "Product",
        entityId: item.productId,
      });

    notifications.push(notification);
  }

  return {
    checkedProducts: predictions.length,
    risksFound,
    notificationsCreated:
      notifications.length,
    notifications,
  };
}