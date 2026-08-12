import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/authorization";
import { UserRole } from "@/src/generated/prisma/client";
import { z } from "zod";

const createBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  productId: z.string().min(1, "Product ID is required"),
  manufactureDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  purchasePrice: z.number().min(0, "Purchase price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
});

export async function GET() {
  try {
    // Check if user is logged in
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

    // Check if user has permission
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
          message: "You are not authorized to view batches",
        },
        { status: 403 }
      );
    }

    // Get all batches
    const batches = await prisma.batch.findMany({
      orderBy: {
        expiryDate: "asc",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: batches.length,
      batches,
    });
  } catch (error) {
    console.error("GET /api/batches error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch batches",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is logged in
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

    // Check if user has permission
    const allowed = hasRole(currentUser.role, [
      UserRole.ADMIN,
      UserRole.INVENTORY_MANAGER,
    ]);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to create batches",
        },
        { status: 403 }
      );
    }

    // Read request body
    const body = await request.json();

    // Validate request body
    const validation = createBatchSchema.safeParse(body);

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

    // Validate expiry date
    if (data.expiryDate <= data.manufactureDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Expiry date must be after manufacture date",
        },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: {
        id: data.productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Check duplicate batch number
    const existingBatch = await prisma.batch.findUnique({
      where: {
        batchNumber: data.batchNumber,
      },
    });

    if (existingBatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch with this batch number already exists",
        },
        { status: 409 }
      );
    }

    // Create batch
    const batch = await prisma.batch.create({
      data,
      include: {
        product: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Batch created successfully",
        batch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/batches error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create batch",
      },
      { status: 500 }
    );
  }
}