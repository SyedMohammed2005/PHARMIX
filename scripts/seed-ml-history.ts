import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

/*
 * PHARMIX ML DEMO HISTORY
 *
 * This script creates clearly identifiable synthetic sales history
 * for ML testing.
 *
 * Invoice prefix:
 *   ML-DEMO-
 *
 * Products:
 *   Paracetamol 500mg
 *   Cetirizine 10mg
 *
 * IMPORTANT:
 *   - Does NOT modify prisma/seed.ts
 *   - Does NOT delete existing sales
 *   - Uses separate ML-DEMO invoice numbers
 *   - Creates historical Sale + SaleItem records
 *   - Creates matching StockTransaction records
 */

const PRODUCTS = [
  {
    productId: "cmsili8it0002w8cdpo8m2vxt",
    name: "Paracetamol 500mg",
  },
  {
    productId: "cmslifb7l0000xkcdn430ngd2",
    name: "Cetirizine 10mg",
  },
];

const HISTORY_DAYS = 180;

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateDailyDemand(
  productName: string,
  dayIndex: number
) {
  /*
   * Create realistic-looking variation instead of the exact
   * same demand every day.
   *
   * Paracetamol:
   *   higher demand
   *
   * Cetirizine:
   *   lower demand
   *
   * Later days have slightly higher demand so the ML model
   * has a changing pattern to learn from.
   */

  const growthFactor = 1 + dayIndex / HISTORY_DAYS * 0.25;

  if (productName === "Paracetamol 500mg") {
    const baseDemand = randomFloat(3, 8);
    return Math.max(
      1,
      Math.round(baseDemand * growthFactor)
    );
  }

  const baseDemand = randomFloat(1, 5);
  return Math.max(
    1,
    Math.round(baseDemand * growthFactor)
  );
}

async function main() {
  console.log("🌱 Starting PHARMIX ML demo history seed...");
  console.log(`📅 Generating ${HISTORY_DAYS} days of history...`);

  const today = startOfDay(new Date());
  const historyStart = addDays(today, -HISTORY_DAYS);

  for (const productConfig of PRODUCTS) {
    console.log(
      `\n📦 Processing ${productConfig.name}...`
    );

    const product = await prisma.product.findUnique({
      where: {
        id: productConfig.productId,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new Error(
        `Product not found: ${productConfig.productId}`
      );
    }

    if (!product.inventory) {
      throw new Error(
        `Inventory not found for: ${product.name}`
      );
    }

    /*
     * Find the first available batch.
     *
     * We do not modify the existing batch quantity here.
     * SaleItem only needs a valid batchId.
     */
    const batch = await prisma.batch.findFirst({
      where: {
        productId: product.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!batch) {
      throw new Error(
        `No batch found for product: ${product.name}`
      );
    }

    console.log(`   Product ID: ${product.id}`);
    console.log(`   Batch: ${batch.batchNumber}`);

    /*
     * Prevent duplicate ML demo history.
     *
     * If this script has already been executed, running it again
     * will not create another copy of the same demo history.
     */
    const existingDemoSale = await prisma.sale.findFirst({
      where: {
        invoiceNumber: {
          startsWith: "ML-DEMO-",
        },
        items: {
          some: {
            productId: product.id,
          },
        },
      },
    });

    if (existingDemoSale) {
      console.log(
        `   ⚠️ ML demo history already exists for ${product.name}.`
      );
      console.log(
        "   Skipping this product to prevent duplicates."
      );
      continue;
    }

    let totalUnits = 0;
    let salesCreated = 0;

    for (let dayIndex = 0; dayIndex < HISTORY_DAYS; dayIndex++) {
      const saleDate = addDays(historyStart, dayIndex);

      /*
       * Some days intentionally have no sale.
       * This gives the model more realistic variation.
       */
      const shouldSell = Math.random() > 0.15;

      if (!shouldSell) {
        continue;
      }

      const quantity = generateDailyDemand(
        product.name,
        dayIndex
      );

      totalUnits += quantity;

      const invoiceNumber =
        `ML-DEMO-${product.id.slice(-6)}-${String(
          dayIndex + 1
        ).padStart(3, "0")}`;

      const unitPrice = product.sellingPrice;
      const subtotal = quantity * unitPrice;

      /*
       * Create the sale and sale item together.
       */
      const sale = await prisma.sale.create({
        data: {
          invoiceNumber,
          subtotal,
          discount: 0,
          tax: 0,
          totalAmount: subtotal,

          createdAt: new Date(
            saleDate.getTime() +
              randomInt(9, 18) * 60 * 60 * 1000 +
              randomInt(0, 59) * 60 * 1000
          ),

          items: {
            create: {
              productId: product.id,
              batchId: batch.id,
              quantity,
              unitPrice,
              gst: product.gst,
              subtotal,
            },
          },
        },
      });

      /*
       * Create the corresponding stock transaction.
       *
       * Negative quantity represents stock leaving inventory.
       */
      await prisma.stockTransaction.create({
        data: {
          inventoryId: product.inventory.id,
          type: "SALE",
          quantity: -quantity,
          reason: `ML demo historical sale - ${sale.invoiceNumber}`,
          createdAt: sale.createdAt,
        },
      });

      salesCreated++;

      if (salesCreated % 25 === 0) {
        console.log(
          `   ✓ ${salesCreated} sales created...`
        );
      }
    }

    console.log(
      `   ✅ ${product.name}: ${salesCreated} sales`
    );

    console.log(
      `   📊 Total units sold: ${totalUnits}`
    );
  }

  console.log("\n🎉 ML demo history generation completed!");
  console.log(
    "🔎 All generated invoices use the ML-DEMO- prefix."
  );
}

main()
  .catch((error) => {
    console.error(
      "\n❌ ML history seed failed:"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
