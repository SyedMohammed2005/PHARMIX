// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { getCurrentUser, hasRole } from "@/lib/authorization";
// import {
//   getCustomers,
//   createCustomer,
// } from "@/services/customer.service";
// import { UserRole } from "@/src/generated/prisma/client";

// const createCustomerSchema = z.object({
//   name: z.string().min(1, "Customer name is required"),
//   phone: z
//     .string()
//     .min(10, "Phone number must be at least 10 characters")
//     .optional(),
//   email: z.string().email("Invalid email").optional(),
//   address: z.string().optional(),
// });

// export async function GET() {
//   try {
//     const currentUser = await getCurrentUser();

//     if (!currentUser) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Not authenticated",
//         },
//         { status: 401 }
//       );
//     }

//     const allowed = hasRole(currentUser.role, [
//       UserRole.ADMIN,
//       UserRole.PHARMACIST,
//       UserRole.INVENTORY_MANAGER,
//       UserRole.BUSINESS_ANALYST,
//     ]);

//     if (!allowed) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "You are not authorized to view customers",
//         },
//         { status: 403 }
//       );
//     }

//     const customers = await getCustomers();

//     return NextResponse.json({
//       success: true,
//       count: customers.length,
//       customers,
//     });
//   } catch (error) {
//     console.error("GET /api/customers error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch customers",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const currentUser = await getCurrentUser();

//     if (!currentUser) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Not authenticated",
//         },
//         { status: 401 }
//       );
//     }

//     const allowed = hasRole(currentUser.role, [
//       UserRole.ADMIN,
//       UserRole.PHARMACIST,
//     ]);

//     if (!allowed) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "You are not authorized to create customers",
//         },
//         { status: 403 }
//       );
//     }

//     const body = await request.json();

//     const validation = createCustomerSchema.safeParse(body);

//     if (!validation.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Validation failed",
//           errors: validation.error.flatten().fieldErrors,
//         },
//         { status: 400 }
//       );
//     }

//     const customer = await createCustomer(validation.data);

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Customer created successfully",
//         customer,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("POST /api/customers error:", error);

//     const message =
//       error instanceof Error
//         ? error.message
//         : "Failed to create customer";

//     if (
//       message ===
//         "Customer with this phone number already exists" ||
//       message ===
//         "Customer with this email already exists"
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message,
//         },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to create customer",
//       },
//       { status: 500 }
//     );
//   }
// }

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

    // 3. Fetch customers with their sales
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Calculate customer statistics
    const customerAnalytics = customers.map((customer) => {
      const totalOrders = customer.sales.length;

      const totalSpent = customer.sales.reduce(
        (total, sale) => total + sale.totalAmount,
        0
      );

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        createdAt: customer.createdAt,
        totalOrders,
        totalSpent,
      };
    });

    // 5. Customers who have made purchases
    const activeCustomers = customerAnalytics.filter(
      (customer) => customer.totalOrders > 0
    );

    // 6. Total customer revenue
    const totalCustomerRevenue = customerAnalytics.reduce(
      (total, customer) => total + customer.totalSpent,
      0
    );

    // 7. Top customers
    const topCustomers = [...customerAnalytics]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // 8. Average customer spending
    const averageCustomerSpending =
      activeCustomers.length > 0
        ? totalCustomerRevenue / activeCustomers.length
        : 0;

    // 9. Return report
    return NextResponse.json({
      success: true,

      summary: {
        totalCustomers: customers.length,
        activeCustomers: activeCustomers.length,
        inactiveCustomers:
          customers.length - activeCustomers.length,
        totalCustomerRevenue,
        averageCustomerSpending,
      },

      topCustomers,

      recentCustomers: customerAnalytics.slice(0, 10),

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