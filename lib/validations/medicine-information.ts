import { z } from "zod";

export const createMedicineInformationSchema =
  z.object({
    productId: z.string().min(1),

    dosageForm: z.string().trim().optional(),
    strength: z.string().trim().optional(),
    drugClass: z.string().trim().optional(),
    therapeuticCategory: z.string().trim().optional(),

    uses: z.string().trim().optional(),
    precautions: z.string().trim().optional(),
    sideEffects: z.string().trim().optional(),
    storageInformation: z.string().trim().optional(),
    prescriptionInformation: z
      .string()
      .trim()
      .optional(),

    verifiedAt: z.coerce.date().optional(),
  });

export const updateMedicineInformationSchema =
  createMedicineInformationSchema
    .omit({
      productId: true,
    })
    .partial();