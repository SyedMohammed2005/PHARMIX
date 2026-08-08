import { z } from "zod";

export const createInventorySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),

  quantity: z
    .number()
    .int()
    .min(0, "Quantity cannot be negative"),

  minimumStock: z
    .number()
    .int()
    .min(0, "Minimum stock cannot be negative"),

  maximumStock: z
    .number()
    .int()
    .positive("Maximum stock must be positive")
    .optional(),

  reorderPoint: z
    .number()
    .int()
    .min(0, "Reorder point cannot be negative"),
});