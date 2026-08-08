import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  
  

  genericName: z.string().optional(),

  brand: z.string().optional(),

  sku: z.string().min(2, "SKU is required"),

  barcode: z.string().optional(),

  purchasePrice: z.number().positive("Purchase price must be positive"),

  sellingPrice: z.number().positive("Selling price must be positive"),

  mrp: z.number().positive("MRP must be positive"),

  gst: z.number().min(0).max(100),

  requiresPrescription: z.boolean(),

  categoryId: z.string().min(1, "Category is required"),

  supplierId: z.string().min(1, "Supplier is required"),
});

export const updateProductSchema =
  createProductSchema.partial();

export type CreateProductInput =
  z.infer<typeof createProductSchema>;

export type UpdateProductInput =
  z.infer<typeof updateProductSchema>;