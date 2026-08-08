import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProductSchema } from "@/lib/validations/product";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        inventory: true,
        batches: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = createProductSchema.safeParse(body);

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

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku },
          ...(data.barcode ? [{ barcode: data.barcode }] : []),
        ],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product with this SKU or barcode already exists",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        genericName: data.genericName,
        brand: data.brand,
        sku: data.sku,
        barcode: data.barcode,

        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        mrp: data.mrp,

        gst: data.gst,
        requiresPrescription: data.requiresPrescription,

        categoryId: data.categoryId,
        supplierId: data.supplierId,
      },

      include: {
        category: true,
        supplier: true,
        inventory: true,
        batches: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      { status: 500 }
    );
  }
}