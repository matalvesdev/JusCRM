-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('PETITION', 'CONTRACT', 'LETTER', 'PROCURATION', 'MOTION', 'APPEAL', 'AGREEMENT', 'EMAIL', 'NOTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('LABOR_LAW', 'CIVIL_LAW', 'CORPORATE_LAW', 'FAMILY_LAW', 'CRIMINAL_LAW', 'ADMINISTRATIVE', 'GENERAL');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TemplateType" NOT NULL,
    "category" "TemplateCategory" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
