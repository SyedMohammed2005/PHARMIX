-- CreateTable
CREATE TABLE "MedicineAlternative" (
    "id" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "alternativeProductId" TEXT NOT NULL,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineAlternative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineAlternative_sourceProductId_idx" ON "MedicineAlternative"("sourceProductId");

-- CreateIndex
CREATE INDEX "MedicineAlternative_alternativeProductId_idx" ON "MedicineAlternative"("alternativeProductId");

-- CreateIndex
CREATE INDEX "MedicineAlternative_isActive_idx" ON "MedicineAlternative"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineAlternative_sourceProductId_alternativeProductId_key" ON "MedicineAlternative"("sourceProductId", "alternativeProductId");

-- AddForeignKey
ALTER TABLE "MedicineAlternative" ADD CONSTRAINT "MedicineAlternative_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineAlternative" ADD CONSTRAINT "MedicineAlternative_alternativeProductId_fkey" FOREIGN KEY ("alternativeProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
