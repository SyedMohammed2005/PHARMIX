import { prisma } from "@/lib/prisma";

export async function getProducts(params: {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const {
    search,
    categoryId,
    supplierId,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "name",
    "sellingPrice",
    "purchasePrice",
    "mrp",
    "createdAt",
  ];

  const validSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const where = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              genericName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              brand: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              sku: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(categoryId ? { categoryId } : {}),
    ...(supplierId ? { supplierId } : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({
      where,
    }),

    prisma.product.findMany({
      where,

      include: {
        category: true,
        supplier: true,
        inventory: true,
      },

      orderBy: {
        [validSortBy]: sortOrder,
      },

      skip,
      take: limit,
    }),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: {
      id,
    },

    include: {
      category: true,
      supplier: true,
      inventory: true,
      batches: true,
    },
  });
}

export async function createProduct(data: {
  name: string;
  genericName?: string;
  brand?: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gst: number;
  requiresPrescription: boolean;
  categoryId: string;
  supplierId: string;
}) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      OR: [
        {
          sku: data.sku,
        },
        ...(data.barcode
          ? [
              {
                barcode: data.barcode,
              },
            ]
          : []),
      ],
    },
  });

  if (existingProduct) {
    throw new Error(
      "Product with this SKU or barcode already exists",
    );
  }

  return prisma.product.create({
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
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>,
) {
  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    return null;
  }

  if (
    typeof data.sku === "string" &&
    data.sku !== existingProduct.sku
  ) {
    const duplicateSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        NOT: {
          id,
        },
      },
    });

    if (duplicateSku) {
      throw new Error(
        "Another product already uses this SKU",
      );
    }
  }

  return prisma.product.update({
    where: {
      id,
    },

    data,

    include: {
      category: true,
      supplier: true,
      inventory: true,
      batches: true,
    },
  });
}

export async function deleteProduct(id: string) {
  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },

    include: {
      inventory: true,
      batches: true,
    },
  });

  if (!existingProduct) {
    return null;
  }

  if (
    existingProduct.inventory ||
    existingProduct.batches.length > 0
  ) {
    throw new Error(
      "Cannot delete a product that has inventory or batches",
    );
  }

  await prisma.product.delete({
    where: {
      id,
    },
  });

  return true;
}