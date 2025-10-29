-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedById" TEXT,
ADD COLUMN     "validatorNotes" TEXT,
ADD COLUMN     "validatorSignatureUrl" TEXT;

-- CreateIndex
CREATE INDEX "Report_validatedById_idx" ON "Report"("validatedById");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
