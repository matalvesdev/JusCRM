-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('CASES_BY_PERIOD', 'CASES_BY_STATUS', 'CASES_BY_CLIENT', 'CLIENT_ACTIVITY', 'PRODUCTIVITY', 'FINANCIAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "parameters" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "recordsCount" INTEGER,
    "generatedAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "generatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
