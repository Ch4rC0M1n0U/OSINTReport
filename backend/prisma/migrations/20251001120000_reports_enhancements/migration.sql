-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "caseNumber" TEXT,
ADD COLUMN     "issuedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reportNumber" TEXT,
ADD COLUMN     "reportingOfficer" TEXT,
ADD COLUMN     "reportingRank" TEXT,
ADD COLUMN     "reportingUnit" TEXT,
ADD COLUMN     "summary" TEXT,
DROP COLUMN "relatedCases",
ADD COLUMN     "relatedCases" JSONB,
DROP COLUMN "objectives",
ADD COLUMN     "objectives" JSONB;

-- AlterTable
ALTER TABLE "ReportModule" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "ReportAttachment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "moduleId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'image',
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ReportAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportAttachment_reportId_idx" ON "ReportAttachment"("reportId");

-- CreateIndex
CREATE INDEX "ReportAttachment_moduleId_idx" ON "ReportAttachment"("moduleId");

-- AddForeignKey
ALTER TABLE "ReportAttachment" ADD CONSTRAINT "ReportAttachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAttachment" ADD CONSTRAINT "ReportAttachment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ReportModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

