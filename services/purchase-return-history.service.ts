import { prisma } from "@/lib/prisma";

import {
  ReturnStatus,
} from "@/src/generated/prisma/client";

type PurchaseReturnFilters = {
  search?: string;
  status?: ReturnStatus;
  page: number;
  limit: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

const allowedSortFields = [
  "createdAt",
  "returnNumber",
  "totalRefund",
] as const;

export async function getPurchaseReturns(
  filters: PurchaseReturnFilters,
) {
  const {
    search = "",
    status,
    page,
    limit,
    sortBy = "createdAt",
    order = "desc",
  } = filters;

  const safeSortBy = allowedSortFields.includes(
    sortBy as (typeof allowedSortFields)[number],
  )
    ? sortBy
    : "createdAt";

  const skip = (page - 1) * limit;

  const where = {
    ...(search
      ? {
          OR: [
            {
              returnNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },

            {
              purchase: {
                supplier: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),

    ...(status
      ? {
          status,
        }
      : {}),
  };

  const total = await prisma.purchaseReturn.count({
    where,
  });

  const returns =
    await prisma.purchaseReturn.findMany({
      where,

      skip,

      take: limit,

      orderBy: {
        [safeSortBy]: order,
      },

      include: {
        purchase: {
          include: {
            supplier: true,
          },
        },

        items: {
          include: {
            purchaseItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

  return {
    returns,
    total,
    page,
    limit,
  };
}