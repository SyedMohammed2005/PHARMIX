-- CreateTable
CREATE TABLE "MedicineInformation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dosageForm" TEXT,
    "strength" TEXT,
    "drugClass" TEXT,
    "therapeuticCategory" TEXT,
    "uses" TEXT,
    "precautions" TEXT,
    "sideEffects" TEXT,
    "storageInformation" TEXT,
    "prescriptionInformation" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicineInformation_productId_key" ON "MedicineInformation"("productId");

-- CreateIndex
CREATE INDEX "MedicineInformation_drugClass_idx" ON "MedicineInformation"("drugClass");

-- CreateIndex
CREATE INDEX "MedicineInformation_therapeuticCategory_idx" ON "MedicineInformation"("therapeuticCategory");

-- AddForeignKey
ALTER TABLE "MedicineInformation" ADD CONSTRAINT "MedicineInformation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
