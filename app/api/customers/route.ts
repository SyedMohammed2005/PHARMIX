import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters").optional(),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
});

export async function GET() {
  try {
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
          message: "You are not authorized to view customers",
        },
        { status: 403 }
      );
    }

    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("GET /api/customers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.PHARMACIST,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to create customers",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validation = createCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: {
          phone: data.phone,
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer with this phone number already exists",
          },
          { status: 409 }
        );
      }
    }

    if (data.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: {
          email: data.email,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/customers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer",
      },
      { status: 500 }
    );
  }
}