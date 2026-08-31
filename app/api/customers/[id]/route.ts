import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, "Customer name is required")
    .optional(),

  phone: z
    .string()
    .regex(
      /^\d{10}$/,
      "Phone number must contain exactly 10 digits"
    )
    .optional(),

  email: z
    .string()
    .email("Invalid email")
    .nullable()
    .optional(),

  address: z
    .string()
    .nullable()
    .optional(),
});

// ============================================
// GET SINGLE CUSTOMER + PURCHASE HISTORY
// ============================================

export async function GET(
  request: Request,
  context: RouteContext
) {
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
      UserRole.PHARMACIST,
      UserRole.INVENTORY_MANAGER,
      UserRole.BUSINESS_ANALYST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view this customer",
        },
        { status: 403 }
      );
    }

    // 3. Get customer ID
    const { id } = await context.params;

    // 4. Fetch customer with complete purchase history
    const customer = await prisma.customer.findUnique({
      where: {
        id,
      },
      include: {
        sales: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
                batch: {
                  select: {
                    id: true,
                    batchNumber: true,
                  },
                },
              },
            },
            payment: true,
          },
        },
      },
    });

    // 5. Customer not found
    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // 6. Calculate customer statistics
    const totalPurchases = customer.sales.length;

    const totalAmountSpent = customer.sales.reduce(
      (total, sale) => total + sale.totalAmount,
      0
    );

    const totalItemsPurchased = customer.sales.reduce(
      (total, sale) =>
        total +
        sale.items.reduce(
          (itemTotal, item) =>
            itemTotal + item.quantity,
          0
        ),
      0
    );

    // 7. Return customer details + statistics + history
    return NextResponse.json({
      success: true,

      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },

      statistics: {
        totalPurchases,
        totalAmountSpent,
        totalItemsPurchased,
      },

      purchaseHistory: customer.sales,
    });
  } catch (error) {
    console.error(
      "GET /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer details",
      },
      { status: 500 }
    );
  }
}

// ============================================
// UPDATE CUSTOMER
// ============================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
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
      UserRole.PHARMACIST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to update customers",
        },
        { status: 403 }
      );
    }

    // 3. Get customer ID
    const { id } = await context.params;

    // 4. Check customer exists
    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          id,
        },
      });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // 5. Get request body
    const body = await request.json();

    // 6. Validate data
    const validation =
      updateCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 7. Check duplicate phone
    if (
      data.phone &&
      data.phone !== existingCustomer.phone
    ) {
      const customerWithPhone =
        await prisma.customer.findUnique({
          where: {
            phone: data.phone,
          },
        });

      if (customerWithPhone) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another customer already uses this phone number",
          },
          { status: 409 }
        );
      }
    }

    // 8. Check duplicate email
    if (
      data.email &&
      data.email !== existingCustomer.email
    ) {
      const customerWithEmail =
        await prisma.customer.findUnique({
          where: {
            email: data.email,
          },
        });

      if (customerWithEmail) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another customer already uses this email address",
          },
          { status: 409 }
        );
      }
    }

    // 9. Update customer
    const customer =
      await prisma.customer.update({
        where: {
          id,
        },
        data,
      });

    // 10. Return updated customer
    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error(
      "PUT /api/customers/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer",
      },
      { status: 500 }
    );
  }
}