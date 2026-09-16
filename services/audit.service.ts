import { prisma } from "@/lib/prisma";
import {
  AuditAction,
  Prisma,
  UserRole,
} from "../src/generated/prisma/client";


type AuditLogInput = {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description?: string;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

type AuditLogFilters = {
  userId?: string;
  role?: UserRole;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
};

function toJsonValue(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  try {
    return JSON.parse(
      JSON.stringify(value),
    ) as Prisma.InputJsonValue;
  } catch {
    return {
      error: "Unable to serialize audit data",
    };
  }
}

export async function createAuditLog(
  data: AuditLogInput,
) {
  return prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      description: data.description,
      beforeData: toJsonValue(data.beforeData),
      afterData: toJsonValue(data.afterData),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
) {
  const {
    userId,
    role,
    action,
    entity,
    entityId,
    search,
    from,
    to,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(entityId ? { entityId } : {}),
    ...(role
      ? {
        user: {
          role,
        },
      }
      : {}),
    ...(from || to
      ? {
        createdAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      }
      : {}),
    ...(search
      ? {
        OR: [
          {
            entity: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            entityId: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({
      where,
    }),

    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAuditLogById(
  id: string,
) {
  return prisma.auditLog.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getAuditStats() {
  const actionGroups = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: {
      action: true,
    },
  });

  const actionCounts = Object.fromEntries(
    actionGroups.map((group) => [
      group.action,
      group._count.action,
    ]),
  ) as Record<AuditAction, number>;

  const totalLogs = await prisma.auditLog.count();

  return {
    totalLogs,

    createCount:
      actionCounts[AuditAction.CREATE] ?? 0,

    updateCount:
      actionCounts[AuditAction.UPDATE] ?? 0,

    deleteCount:
      actionCounts[AuditAction.DELETE] ?? 0,

    loginCount:
      actionCounts[AuditAction.LOGIN] ?? 0,

    logoutCount:
      actionCounts[AuditAction.LOGOUT] ?? 0,

    stockAdjustmentCount:
      actionCounts[AuditAction.STOCK_ADJUSTMENT] ?? 0,

    saleCreatedCount:
      actionCounts[AuditAction.SALE_CREATED] ?? 0,

    saleReturnedCount:
      actionCounts[AuditAction.SALE_RETURNED] ?? 0,

    saleRefundedCount:
      actionCounts[AuditAction.SALE_REFUNDED] ?? 0,

    purchaseCreatedCount:
      actionCounts[AuditAction.PURCHASE_CREATED] ?? 0,

    purchaseReturnedCount:
      actionCounts[AuditAction.PURCHASE_RETURNED] ?? 0,

    batchCreatedCount:
      actionCounts[AuditAction.BATCH_CREATED] ?? 0,

    batchUpdatedCount:
      actionCounts[AuditAction.BATCH_UPDATED] ?? 0,

    roleChangedCount:
      actionCounts[AuditAction.ROLE_CHANGED] ?? 0,
  };
}

export async function getAuditActivityByUser() {
  const userGroups = await prisma.auditLog.groupBy({
    by: ["userId"],
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: "desc",
      },
    },
  });

  const userIds = userGroups
    .map((group) => group.userId)
    .filter((userId): userId is string => Boolean(userId));

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const userMap = new Map(
    users.map((user) => [user.id, user]),
  );

  return userGroups
    .filter(
      (group): group is typeof group & { userId: string } =>
        Boolean(group.userId),
    )
    .map((group) => ({
      user: userMap.get(group.userId) ?? null,
      actionCount: group._count.userId,
    }));
}

export async function getAuditActivityByEntity() {
  const entityGroups = await prisma.auditLog.groupBy({
    by: ["entity"],
    _count: {
      entity: true,
    },
    orderBy: {
      _count: {
        entity: "desc",
      },
    },
  });

  return entityGroups.map((group) => ({
    entity: group.entity,
    actionCount: group._count.entity,
  }));
}

export async function getAuditActivityTrend() {
  const logs = await prisma.auditLog.findMany({
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const trendMap = new Map<string, number>();

  for (const log of logs) {
    const date = log.createdAt.toISOString().split("T")[0];

    trendMap.set(
      date,
      (trendMap.get(date) ?? 0) + 1,
    );
  }

  return Array.from(trendMap.entries()).map(
    ([date, actionCount]) => ({
      date,
      actionCount,
    }),
  );
}
export async function getRecentAuditLogs(
  limit = 10,
) {
  return prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}