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

const updateBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number cannot be empty").optional(),
  manufactureDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  quantity: z.number().int().min(0, "Quantity cannot be negative").optional(),
  purchasePrice: z
    .number()
    .min(0, "Purchase price cannot be negative")
    .optional(),
  sellingPrice: z
    .number()
    .min(0, "Selling price cannot be negative")
    .optional(),
});

export async function GET(
  request: Request,
  context: RouteContext
) {
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
          message: "You are not authorized to view this batch",
        },
        { status: 403 }
      );
    }

    // Get batch ID
    const { id } = await context.params;

    // Find batch
    const batch = await prisma.batch.findUnique({
      where: {
        id,
      },
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
            inventory: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error("GET /api/batches/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch batch",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
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
          message: "You are not authorized to update batches",
        },
        { status: 403 }
      );
    }

    // Get batch ID
    const { id } = await context.params;

    // Read request body
    const body = await request.json();

    // Validate request body
    const validation = updateBatchSchema.safeParse(body);

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

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: {
        id,
      },
    });

    if (!existingBatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Batch not found",
        },
        { status: 404 }
      );
    }

    // Check duplicate batch number
    if (data.batchNumber) {
      const duplicateBatch = await prisma.batch.findFirst({
        where: {
          batchNumber: data.batchNumber,
          NOT: {
            id,
          },
        },
      });

      if (duplicateBatch) {
        return NextResponse.json(
          {
            success: false,
            message: "Batch with this batch number already exists",
          },
          { status: 409 }
        );
      }
    }

    // Validate dates
    const manufactureDate =
      data.manufactureDate ?? existingBatch.manufactureDate;

    const expiryDate =
      data.expiryDate ?? existingBatch.expiryDate;

    if (expiryDate <= manufactureDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Expiry date must be after manufacture date",
        },
        { status: 400 }
      );
    }

    // Update batch
    const batch = await prisma.batch.update({
      where: {
        id,
      },
      data,
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Batch updated successfully",
      batch,
    });
  } catch (error) {
    console.error("PUT /api/batches/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update batch",
      },
      { status: 500 }
    );
  }
}