import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Create Category
  const painRelief = await prisma.category.upsert({
    where: {
      name: "Pain Relief",
    },
    update: {},
    create: {
      name: "Pain Relief",
      description: "Medicines used for pain and fever",
    },
  });

  // 2. Create Supplier
  const supplier = await prisma.supplier.upsert({
    where: {
      email: "demo@pharma.com",
    },
    update: {},
    create: {
      name: "Demo Pharma",
      email: "demo@pharma.com",
      phone: "9876543210",
      address: "Hyderabad",
    },
  });

  // 3. Create Product
  const product = await prisma.product.upsert({
    where: {
      sku: "PCM-500-001",
    },
    update: {},
    create: {
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      brand: "Demo Brand",
      sku: "PCM-500-001",
      barcode: "8901234567890",

      purchasePrice: 10,
      sellingPrice: 15,
      mrp: 20,

      gst: 5,
      requiresPrescription: false,

      categoryId: painRelief.id,
      supplierId: supplier.id,
    },
  });

  // 4. Create Inventory
  await prisma.inventory.upsert({
    where: {
      productId: product.id,
    },
    update: {},
    create: {
      productId: product.id,
      quantity: 100,
      minimumStock: 20,
      maximumStock: 500,
      reorderPoint: 30,
    },
  });

  // 5. Create Batch
  await prisma.batch.upsert({
    where: {
      batchNumber: "PCM2026A001",
    },
    update: {},
    create: {
      batchNumber: "PCM2026A001",
      productId: product.id,

      manufactureDate: new Date("2026-01-01"),
      expiryDate: new Date("2027-01-01"),

      quantity: 100,

      purchasePrice: 10,
      sellingPrice: 15,
    },
  });

  console.log("✅ Demo data created successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });