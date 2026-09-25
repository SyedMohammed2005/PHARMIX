import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authorization";
import { hasRole } from "@/lib/authorization";
import {
  createMedicineInformationSchema,
} from "@/lib/validations/medicine-information";
import {
  createMedicineInformation,
  getMedicineInformation,
} from "@/services/medicine-information.service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const productId =
      request.nextUrl.searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      );
    }

    const medicineInformation =
      await getMedicineInformation(productId);

    if (!medicineInformation) {
      return NextResponse.json(
        { error: "Medicine information not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: medicineInformation,
    });
  } catch (error) {
    console.error(
      "GET /api/medicine-information error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to fetch medicine information" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !hasRole(user.role, [
        "ADMIN",
        "PHARMACIST",
      ])
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validation =
      createMedicineInformationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const medicineInformation =
      await createMedicineInformation(validation.data);

    return NextResponse.json(
      {
        success: true,
        message:
          "Medicine information created successfully",
        data: medicineInformation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/medicine-information error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create medicine information";

    if (
      message === "Product not found" ||
      message ===
        "Medicine information already exists for this product"
    ) {
      return NextResponse.json(
        { error: message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create medicine information" },
      { status: 500 },
    );
  }
}