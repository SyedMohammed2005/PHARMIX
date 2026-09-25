-- CreateTable
CREATE TABLE "MedicineReference" (
    "id" TEXT NOT NULL,
    "medicineInformationId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineReference_medicineInformationId_idx" ON "MedicineReference"("medicineInformationId");

-- CreateIndex
CREATE INDEX "MedicineReference_sourceType_idx" ON "MedicineReference"("sourceType");

-- AddForeignKey
ALTER TABLE "MedicineReference" ADD CONSTRAINT "MedicineReference_medicineInformationId_fkey" FOREIGN KEY ("medicineInformationId") REFERENCES "MedicineInformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
