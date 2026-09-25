-- CreateTable
CREATE TABLE "MedicineSubstitution" (
    "id" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "alternativeProductId" TEXT NOT NULL,
    "pharmacistId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineSubstitution_sourceProductId_idx" ON "MedicineSubstitution"("sourceProductId");

-- CreateIndex
CREATE INDEX "MedicineSubstitution_alternativeProductId_idx" ON "MedicineSubstitution"("alternativeProductId");

-- CreateIndex
CREATE INDEX "MedicineSubstitution_pharmacistId_idx" ON "MedicineSubstitution"("pharmacistId");

-- CreateIndex
CREATE INDEX "MedicineSubstitution_status_idx" ON "MedicineSubstitution"("status");

-- AddForeignKey
ALTER TABLE "MedicineSubstitution" ADD CONSTRAINT "MedicineSubstitution_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSubstitution" ADD CONSTRAINT "MedicineSubstitution_alternativeProductId_fkey" FOREIGN KEY ("alternativeProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSubstitution" ADD CONSTRAINT "MedicineSubstitution_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
