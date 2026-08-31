import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import {
Prisma,
UserRole,
} from "@/src/generated/prisma/client";

const createCustomerSchema = z.object({
name: z.string().min(1, "Customer name is required"),

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
.optional(),

address: z.string().optional(),
});

// GET ALL CUSTOMERS
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
  UserRole.PHARMACIST,
  UserRole.INVENTORY_MANAGER,
  UserRole.BUSINESS_ANALYST,
]);

if (!allowed) {
  return NextResponse.json(
    {
      success: false,
      message:
        "You are not authorized to view customers",
    },
    { status: 403 }
  );
}

// 3. Get query parameters
const { searchParams } = new URL(request.url);

const search =
  searchParams.get("search")?.trim() || "";

const page = Math.max(
  Number(searchParams.get("page")) || 1,
  1
);

const limit = Math.min(
  Math.max(
    Number(searchParams.get("limit")) || 10,
    1
  ),
  100
);

const skip = (page - 1) * limit;

// 4. Build Prisma filter
const where: Prisma.CustomerWhereInput = {};

if (search) {
  where.OR = [
    {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      phone: {
        contains: search,
      },
    },
    {
      email: {
        contains: search,
        mode: "insensitive",
      },
    },
  ];
}

// 5. Fetch customers and total count
const [customers, total] = await Promise.all([
  prisma.customer.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  }),

  prisma.customer.count({
    where,
  }),
]);

const totalPages = Math.ceil(total / limit);

// 6. Return response
return NextResponse.json({
  success: true,
  count: customers.length,

  pagination: {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  },

  customers,
});


} catch (error) {
console.error(
"GET /api/customers error:",
error
);


return NextResponse.json(
  {
    success: false,
    message: "Failed to fetch customers",
  },
  { status: 500 }
);


}
}

// CREATE CUSTOMER
export async function POST(request: Request) {
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
        "You are not authorized to create customers",
    },
    { status: 403 }
  );
}

// 3. Read request body
const body = await request.json();

// 4. Validate request
const validation =
  createCustomerSchema.safeParse(body);

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

// 5. Check duplicate phone
if (data.phone) {
  const existingPhone =
    await prisma.customer.findUnique({
      where: {
        phone: data.phone,
      },
    });

  if (existingPhone) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Customer with this phone number already exists",
      },
      { status: 409 }
    );
  }
}

// 6. Check duplicate email
if (data.email) {
  const existingEmail =
    await prisma.customer.findUnique({
      where: {
        email: data.email,
      },
    });

  if (existingEmail) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Customer with this email already exists",
      },
      { status: 409 }
    );
  }
}

// 7. Create customer
const customer = await prisma.customer.create({
  data,
});

// 8. Return response
return NextResponse.json(
  {
    success: true,
    message: "Customer created successfully",
    customer,
  },
  { status: 201 }
);


} catch (error) {
console.error(
"POST /api/customers error:",
error
);


return NextResponse.json(
  {
    success: false,
    message: "Failed to create customer",
  },
  { status: 500 }
);


}
}
