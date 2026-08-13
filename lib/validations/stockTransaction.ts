import { z } from "zod";

export const createStockTransactionSchema = z.object({
  inventoryId: z.string().min(1, "Inventory ID is required"),

  type: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "DAMAGE",
    "ADJUSTMENT",
  ]),

  quantity: z
  .number()
  .int()
  .refine((value) => value !== 0, {
    message: "Quantity cannot be 0",
  }),

  reason: z.string().optional(),
});