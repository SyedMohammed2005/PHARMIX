import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

export async function GET() {
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
          message: "You are not authorized to view customer reports",
        },
        { status: 403 }
      );
    }

    // 3. Get customers with their sales
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          select: {
            id: true,
            invoiceNumber: true,
            subtotal: true,
            discount: true,
            tax: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Calculate customer analytics
    let customersWithPurchases = 0;
    let totalCustomerRevenue = 0;

    const customerAnalytics = customers.map((customer) => {
      const totalOrders = customer.sales.length;

      let totalSpent = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      for (const sale of customer.sales) {
        totalSpent += sale.totalAmount;
        totalDiscount += sale.discount;
        totalTax += sale.tax;
      }

      if (totalOrders > 0) {
        customersWithPurchases += 1;
      }

      totalCustomerRevenue += totalSpent;

      return {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalOrders,
        totalSpent,
        totalDiscount,
        totalTax,
        averageOrderValue:
          totalOrders > 0
            ? totalSpent / totalOrders
            : 0,
        lastPurchaseAt:
          customer.sales.length > 0
            ? customer.sales[0].createdAt
            : null,
        purchaseHistory: customer.sales,
      };
    });

    // 5. Top customers
    const topCustomers = [...customerAnalytics]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((customer, index) => ({
        rank: index + 1,
        customerId: customer.customerId,
        name: customer.name,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
      }));

    // 6. Return report
    return NextResponse.json({
      success: true,

      summary: {
        totalCustomers: customers.length,
        customersWithPurchases,
        customersWithoutPurchases:
          customers.length - customersWithPurchases,
        totalCustomerRevenue,
      },

      topCustomers,

      customers: customerAnalytics,
    });
  } catch (error) {
    console.error(
      "GET /api/reports/customers error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate customer report",
      },
      { status: 500 }
    );
  }
}