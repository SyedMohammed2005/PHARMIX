import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // 2. Authorization
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view product analytics",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters
    const { searchParams } = new URL(request.url);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 10, 1),
      50
    );

    // 4. Get all sale items
    const saleItems = await prisma.saleItem.findMany({
      select: {
        productId: true,
        quantity: true,
        subtotal: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    // 5. Group sales by product
    const productSales: Record<
      string,
      {
        productId: string;
        name: string;
        sku: string;
        quantitySold: number;
        salesAmount: number;
        orderCount: number;
      }
    > = {};

    for (const item of saleItems) {
      const productId = item.productId;

      if (!productSales[productId]) {
        productSales[productId] = {
          productId,
          name: item.product.name,
          sku: item.product.sku,
          quantitySold: 0,
          salesAmount: 0,
          orderCount: 0,
        };
      }

      productSales[productId].quantitySold += item.quantity;
      productSales[productId].salesAmount += item.subtotal;
      productSales[productId].orderCount += 1;
    }

    // 6. Sort by quantity sold
    const topProducts = Object.values(productSales)
      .sort((a, b) => {
        if (b.quantitySold !== a.quantitySold) {
          return b.quantitySold - a.quantitySold;
        }

        return b.salesAmount - a.salesAmount;
      })
      .slice(0, limit);

    // 7. Return response
    return NextResponse.json({
      success: true,
      count: topProducts.length,
      limit,
      products: topProducts,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/top-products error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch top products",
      },
      { status: 500 }
    );
  }
}