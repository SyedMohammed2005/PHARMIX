import { prisma } from "@/lib/prisma";

export async function getMedicineSubstitutionOptions(
  productId: string,
) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      name: true,
      genericName: true,
      brand: true,
      sku: true,
      requiresPrescription: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const alternatives =
    await prisma.medicineAlternative.findMany({
      where: {
        sourceProductId: productId,
        isActive: true,
      },
      include: {
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
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  return {
    product,
    alternatives,
  };
}
export async function confirmMedicineSubstitution(
  sourceProductId: string,
  alternativeProductId: string,
  pharmacistId: string,
  reason?: string,
) {
  const alternative =
    await prisma.medicineAlternative.findFirst({
      where: {
        sourceProductId,
        alternativeProductId,
        isActive: true,
      },
    });

  if (!alternative) {
    throw new Error(
      "Configured medicine alternative not found",
    );
  }

  const pharmacist =
    await prisma.user.findUnique({
      where: {
        id: pharmacistId,
      },
    });

  if (!pharmacist) {
    throw new Error("Pharmacist not found");
  }

  if (pharmacist.role !== "PHARMACIST") {
    throw new Error(
      "Only pharmacists can confirm substitutions",
    );
  }

  return prisma.medicineSubstitution.create({
    data: {
      sourceProductId,
      alternativeProductId,
      pharmacistId,
      reason:
        reason || alternative.reason,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
    include: {
      sourceProduct: {
        select: {
          id: true,
          name: true,
          genericName: true,
          brand: true,
          sku: true,
        },
      },
      alternativeProduct: {
        select: {
          id: true,
          name: true,
          genericName: true,
          brand: true,
          sku: true,
        },
      },
      pharmacist: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}