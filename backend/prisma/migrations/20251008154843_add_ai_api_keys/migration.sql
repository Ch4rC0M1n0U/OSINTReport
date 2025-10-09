-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiModel" TEXT DEFAULT 'gemini-pro',
ADD COLUMN     "aiProvider" TEXT DEFAULT 'gemini',
ADD COLUMN     "geminiApiKey" TEXT,
ADD COLUMN     "openaiApiKey" TEXT;
