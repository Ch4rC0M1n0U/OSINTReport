-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "criticalAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lockUserCreation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceMessage" TEXT,
ADD COLUMN     "maintenanceScheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateFormat" TEXT DEFAULT '24h',
ADD COLUMN     "firstDayOfWeek" TEXT DEFAULT 'monday',
ADD COLUMN     "timezone" TEXT DEFAULT 'Europe/Brussels';
