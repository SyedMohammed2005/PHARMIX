import { prisma } from "@/lib/prisma";

interface CreateMedicineAlternativeInput {
  sourceProductId: string;
  alternativeProductId: string;
  reason?: string;
}

interface UpdateMedicineAlternativeInput {
  reason?: string;
  isActive?: boolean;
}

const alternativeInclude = {
  sourceProduct: {
    select: {
      id: true,
      name: true,
      genericName: true,
      brand: true,
      sku: true,
      requiresPrescription: true,
    },
  },
  alternativeProduct: {
    select: {
      id: true,
      name: true,
      genericName: true,
      brand: true,
      sku: true,
      requiresPrescription: true,
    },
  },
} as const;

export async function getMedicineAlternatives(
  productId: string,
) {
  return prisma.medicineAlternative.findMany({
    where: {
      sourceProductId: productId,
      isActive: true,
    },
    include: alternativeInclude,
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createMedicineAlternative(
  data: CreateMedicineAlternativeInput,
) {
  if (
    data.sourceProductId ===
    data.alternativeProductId
  ) {
    throw new Error(
      "A medicine cannot be an alternative to itself",
    );
  }

  const sourceProduct =
    await prisma.product.findUnique({
      where: {
        id: data.sourceProductId,
      },
    });

  if (!sourceProduct) {
    throw new Error(
      "Source product not found",
    );
  }

  const alternativeProduct =
    await prisma.product.findUnique({
      where: {
        id: data.alternativeProductId,
      },
    });

  if (!alternativeProduct) {
    throw new Error(
      "Alternative product not found",
    );
  }

  const existing =
    await prisma.medicineAlternative.findUnique({
      where: {
        sourceProductId_alternativeProductId: {
          sourceProductId:
            data.sourceProductId,
          alternativeProductId:
            data.alternativeProductId,
        },
      },
    });

  if (existing) {
    throw new Error(
      "This medicine alternative already exists",
    );
  }

  return prisma.medicineAlternative.create({
    data: {
      sourceProductId:
        data.sourceProductId,
      alternativeProductId:
        data.alternativeProductId,
      reason: data.reason,
    },
    include: alternativeInclude,
  });
}

export async function updateMedicineAlternative(
  id: string,
  data: UpdateMedicineAlternativeInput,
) {
  const existing =
    await prisma.medicineAlternative.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new Error(
      "Medicine alternative not found",
    );
  }

  return prisma.medicineAlternative.update({
    where: {
      id,
    },
    data,
    include: alternativeInclude,
  });
}

export async function deactivateMedicineAlternative(
  id: string,
) {
  const existing =
    await prisma.medicineAlternative.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new Error(
      "Medicine alternative not found",
    );
  }

  return prisma.medicineAlternative.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
    include: alternativeInclude,
  });
}