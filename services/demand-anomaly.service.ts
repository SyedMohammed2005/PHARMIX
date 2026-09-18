import { prisma } from "@/lib/prisma";

import { createNotification } from "@/services/notification.service";

import {
  NotificationSeverity,
  NotificationType,
} from "../src/generated/prisma/client";

const DEFAULT_LOOKBACK_DAYS = 7;

const SPIKE_THRESHOLD_PERCENT = 50;
const DROP_THRESHOLD_PERCENT = -50;

const MIN_RECENT_DEMAND = 5;
const MIN_PREVIOUS_DEMAND = 5;

type DemandAnomalyResult = {
  checkedProducts: number;
  spikesFound: number;
  dropsFound: number;
  notificationsCreated: number;
  notifications: unknown[];
};

export async function generateDemandAnomalyNotifications(
  userId: string,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
): Promise<DemandAnomalyResult> {
  const days = Math.max(
    Math.floor(lookbackDays),
    1,
  );

  const now = new Date();

  /*
   * Recent period:
   * [now - days, now]
   */
  const recentStart = new Date(now);

  recentStart.setDate(
    recentStart.getDate() - days,
  );

  /*
   * Previous period:
   * [now - 2*days, now - days]
   */
  const previousStart = new Date(now);

  previousStart.setDate(
    previousStart.getDate() - days * 2,
  );

  /*
   * Fetch all sale items from the two
   * comparison periods.
   *
   * We intentionally read SaleItem quantities
   * directly instead of creating another
   * sales-calculation system.
   */
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        createdAt: {
          gte: previousStart,
          lte: now,
        },
      },
    },
    select: {
      productId: true,
      quantity: true,
      sale: {
        select: {
          createdAt: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  /*
   * Store demand for each product.
   */
  const demandByProduct = new Map<
    string,
    {
      productName: string;
      recentDemand: number;
      previousDemand: number;
    }
  >();

  for (const item of saleItems) {
    const existing =
      demandByProduct.get(item.productId) ?? {
        productName: item.product.name,
        recentDemand: 0,
        previousDemand: 0,
      };

    if (item.sale.createdAt >= recentStart) {
      existing.recentDemand += item.quantity;
    } else {
      existing.previousDemand += item.quantity;
    }

    demandByProduct.set(
      item.productId,
      existing,
    );
  }

  const notifications = [];

  let spikesFound = 0;
  let dropsFound = 0;

  /*
   * Analyze each product.
   */
  for (const [
    productId,
    demand,
  ] of demandByProduct) {
    /*
     * Ignore products with insufficient
     * demand history.
     *
     * This prevents tiny changes such as
     * 1 → 2 units from being interpreted
     * as a 100% demand spike.
     */
    if (
      demand.recentDemand <
        MIN_RECENT_DEMAND ||
      demand.previousDemand <
        MIN_PREVIOUS_DEMAND
    ) {
      continue;
    }

    const percentageChange =
      ((demand.recentDemand -
        demand.previousDemand) /
        demand.previousDemand) *
      100;

    const isSpike =
      percentageChange >=
      SPIKE_THRESHOLD_PERCENT;

    const isDrop =
      percentageChange <=
      DROP_THRESHOLD_PERCENT;

    if (!isSpike && !isDrop) {
      continue;
    }

    const notificationType = isSpike
      ? NotificationType.DEMAND_SPIKE
      : NotificationType.DEMAND_DROP;

    if (isSpike) {
      spikesFound++;
    }

    if (isDrop) {
      dropsFound++;
    }

    /*
     * Prevent duplicate unread notifications
     * for the same product and anomaly type.
     */
    const existingNotification =
      await prisma.notification.findFirst({
        where: {
          userId,
          type: notificationType,
          entity: "Product",
          entityId: productId,
          isRead: false,
        },
      });

    if (existingNotification) {
      continue;
    }

    const roundedChange =
      Number(
        Math.abs(
          percentageChange,
        ).toFixed(1),
      );

    const severity = isSpike
      ? NotificationSeverity.WARNING
      : NotificationSeverity.INFO;

    const title = isSpike
      ? "Demand spike detected"
      : "Demand drop detected";

    const message = isSpike
      ? `${demand.productName} demand increased by approximately ${roundedChange}% compared with the previous ${days}-day period. Recent demand: ${demand.recentDemand} units. Previous demand: ${demand.previousDemand} units.`
      : `${demand.productName} demand decreased by approximately ${roundedChange}% compared with the previous ${days}-day period. Recent demand: ${demand.recentDemand} units. Previous demand: ${demand.previousDemand} units.`;

    const notification =
      await createNotification({
        userId,
        type: notificationType,
        severity,
        title,
        message,
        entity: "Product",
        entityId: productId,
      });

    notifications.push(notification);
  }

  return {
    checkedProducts:
      demandByProduct.size,
    spikesFound,
    dropsFound,
    notificationsCreated:
      notifications.length,
    notifications,
  };
}