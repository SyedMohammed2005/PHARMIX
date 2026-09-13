import { prisma } from "@/lib/prisma";
import {
  AuditAction,
  Prisma,
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
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  search?: string;
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
    action,
    entity,
    entityId,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(entityId ? { entityId } : {}),
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
  const [
    totalLogs,
    createCount,
    updateCount,
    deleteCount,
    loginCount,
    stockAdjustmentCount,
  ] = await Promise.all([
    prisma.auditLog.count(),

    prisma.auditLog.count({
      where: {
        action: AuditAction.CREATE,
      },
    }),

    prisma.auditLog.count({
      where: {
        action: AuditAction.UPDATE,
      },
    }),

    prisma.auditLog.count({
      where: {
        action: AuditAction.DELETE,
      },
    }),

    prisma.auditLog.count({
      where: {
        action: AuditAction.LOGIN,
      },
    }),

    prisma.auditLog.count({
      where: {
        action: AuditAction.STOCK_ADJUSTMENT,
      },
    }),
  ]);

  return {
    totalLogs,
    createCount,
    updateCount,
    deleteCount,
    loginCount,
    stockAdjustmentCount,
  };
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