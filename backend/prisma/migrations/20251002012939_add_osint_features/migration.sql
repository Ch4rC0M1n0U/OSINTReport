/*
  Warnings:

  - You are about to drop the column `actorId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `AuditLog` table. All the data in the column will be lost.
  - Added the required column `resource` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropIndex
DROP INDEX "public"."AuditLog_actorId_idx";

-- DropIndex
DROP INDEX "public"."AuditLog_resourceId_idx";

-- DropIndex
DROP INDEX "public"."AuditLog_resourceType_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "actorId",
DROP COLUMN "createdAt",
DROP COLUMN "metadata",
DROP COLUMN "resourceType",
ADD COLUMN     "details" JSONB,
ADD COLUMN     "resource" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "resourceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "classification" TEXT,
ADD COLUMN     "investigationContext" TEXT,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "legalBasis" TEXT,
ADD COLUMN     "urgencyLevel" TEXT;

-- CreateTable
CREATE TABLE "ReportCorrelation" (
    "id" TEXT NOT NULL,
    "sourceReportId" TEXT NOT NULL,
    "relatedReportId" TEXT NOT NULL,
    "correlationType" TEXT NOT NULL,
    "correlationData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ReportCorrelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchableContent" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "entities" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchableContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportCorrelation_sourceReportId_idx" ON "ReportCorrelation"("sourceReportId");

-- CreateIndex
CREATE INDEX "ReportCorrelation_relatedReportId_idx" ON "ReportCorrelation"("relatedReportId");

-- CreateIndex
CREATE INDEX "ReportCorrelation_correlationType_idx" ON "ReportCorrelation"("correlationType");

-- CreateIndex
CREATE INDEX "ReportCorrelation_confidence_idx" ON "ReportCorrelation"("confidence");

-- CreateIndex
CREATE INDEX "ReportCorrelation_detectedAt_idx" ON "ReportCorrelation"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCorrelation_sourceReportId_relatedReportId_correlatio_key" ON "ReportCorrelation"("sourceReportId", "relatedReportId", "correlationType");

-- CreateIndex
CREATE UNIQUE INDEX "SearchableContent_reportId_key" ON "SearchableContent"("reportId");

-- CreateIndex
CREATE INDEX "SearchableContent_reportId_idx" ON "SearchableContent"("reportId");

-- CreateIndex
CREATE INDEX "SearchableContent_contentHash_idx" ON "SearchableContent"("contentHash");

-- CreateIndex
CREATE INDEX "SearchableContent_updatedAt_idx" ON "SearchableContent"("updatedAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Report_caseNumber_idx" ON "Report"("caseNumber");

-- CreateIndex
CREATE INDEX "Report_reportNumber_idx" ON "Report"("reportNumber");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_ownerId_idx" ON "Report"("ownerId");

-- CreateIndex
CREATE INDEX "Report_issuedAt_idx" ON "Report"("issuedAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCorrelation" ADD CONSTRAINT "ReportCorrelation_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCorrelation" ADD CONSTRAINT "ReportCorrelation_relatedReportId_fkey" FOREIGN KEY ("relatedReportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchableContent" ADD CONSTRAINT "SearchableContent_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
