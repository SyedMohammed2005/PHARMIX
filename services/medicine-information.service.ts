import { prisma } from "@/lib/prisma";

interface CreateMedicineInformationInput {
  productId: string;
  dosageForm?: string;
  strength?: string;
  drugClass?: string;
  therapeuticCategory?: string;
  uses?: string;
  precautions?: string;
  sideEffects?: string;
  storageInformation?: string;
  prescriptionInformation?: string;
  verifiedAt?: Date;
}

interface UpdateMedicineInformationInput {
  dosageForm?: string;
  strength?: string;
  drugClass?: string;
  therapeuticCategory?: string;
  uses?: string;
  precautions?: string;
  sideEffects?: string;
  storageInformation?: string;
  prescriptionInformation?: string;
  verifiedAt?: Date;
}

export async function getMedicineInformation(
  productId: string,
) {
  return prisma.medicineInformation.findUnique({
    where: {
      productId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          genericName: true,
          brand: true,
          sku: true,
          requiresPrescription: true,
        },
      },
      references: true,
    },
  });
}

export async function createMedicineInformation(
  data: CreateMedicineInformationInput,
) {
  const product = await prisma.product.findUnique({
    where: {
      id: data.productId,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const existing =
    await prisma.medicineInformation.findUnique({
      where: {
        productId: data.productId,
      },
    });

  if (existing) {
    throw new Error(
      "Medicine information already exists for this product",
    );
  }

  return prisma.medicineInformation.create({
    data: {
      productId: data.productId,
      dosageForm: data.dosageForm,
      strength: data.strength,
      drugClass: data.drugClass,
      therapeuticCategory:
        data.therapeuticCategory,
      uses: data.uses,
      precautions: data.precautions,
      sideEffects: data.sideEffects,
      storageInformation:
        data.storageInformation,
      prescriptionInformation:
        data.prescriptionInformation,
      verifiedAt: data.verifiedAt,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          genericName: true,
          brand: true,
          sku: true,
          requiresPrescription: true,
        },
      },
      references: true,
    },
  });
}

export async function updateMedicineInformation(
  productId: string,
  data: UpdateMedicineInformationInput,
) {
  const existing =
    await prisma.medicineInformation.findUnique({
      where: {
        productId,
      },
    });

  if (!existing) {
    throw new Error(
      "Medicine information not found",
    );
  }

  return prisma.medicineInformation.update({
    where: {
      productId,
    },
    data,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          genericName: true,
          brand: true,
          sku: true,
          requiresPrescription: true,
        },
      },
      references: true,
    },
  });
}