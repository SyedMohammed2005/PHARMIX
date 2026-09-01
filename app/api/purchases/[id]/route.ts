import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const purchase = await prisma.purchase.findUnique({
      where: {
        id,
      },

      include: {
        supplier: true,

        items: {
          include: {
            product: true,
            batch: true,
            returnItems: true,
          },
        },

        payment: true,

        returns: {
          include: {
            items: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        purchase,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "GET /api/purchases/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch purchase",
      },
      {
        status: 500,
      },
    );
  }
}