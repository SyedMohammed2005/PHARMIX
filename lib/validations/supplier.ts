import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Supplier name must be at least 2 characters"),

  email: z
    .string()
    .email("Invalid email")
    .optional(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),

  address: z
    .string()
    .optional(),
});