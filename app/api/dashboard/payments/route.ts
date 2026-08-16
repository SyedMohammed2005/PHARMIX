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
          message: "You are not authorized to view payment analytics",
        },
        { status: 403 }
      );
    }

    // 3. Group payments by method
    const paymentBreakdown = await prisma.payment.groupBy({
      by: ["method"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        refundedAmount: true,
      },
    });

    // 4. Calculate overall totals
    const totals = await prisma.payment.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
        refundedAmount: true,
      },
    });

    // 5. Format payment data
    const payments = paymentBreakdown.map((payment) => ({
      method: payment.method,
      transactionCount: payment._count.id,
      totalAmount: payment._sum.amount ?? 0,
      refundedAmount: payment._sum.refundedAmount ?? 0,
      netAmount:
        (payment._sum.amount ?? 0) -
        (payment._sum.refundedAmount ?? 0),
    }));

    // 6. Response
    return NextResponse.json({
      success: true,
      summary: {
        totalTransactions: totals._count.id,
        totalAmount: totals._sum.amount ?? 0,
        totalRefundedAmount: totals._sum.refundedAmount ?? 0,
        netAmount:
          (totals._sum.amount ?? 0) -
          (totals._sum.refundedAmount ?? 0),
      },
      payments,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/payments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payment analytics",
      },
      { status: 500 }
    );
  }
}