-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL DEFAULT 'OSINT',
    "serviceFullName" TEXT,
    "serviceAddress" TEXT,
    "serviceCity" TEXT,
    "servicePostalCode" TEXT,
    "serviceCountry" TEXT DEFAULT 'Belgique',
    "phoneNumber" TEXT,
    "faxNumber" TEXT,
    "emailContact" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#003f87',
    "secondaryColor" TEXT DEFAULT '#0066cc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
