-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'DRAFT';

-- AlterTable Institution profile fields
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "logoStorageKey" TEXT;

-- CreateTable Department
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "AcademicStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable Program
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "durationMonths" INTEGER,
    "status" "AcademicStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- Student / Lecturer / Course academic links
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "programId" TEXT;
ALTER TABLE "LecturerProfile" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "programId" TEXT;

-- ClassSession scheduling fields
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "scheduledStart" TIMESTAMP(3);
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "scheduledEnd" TIMESTAMP(3);

-- Indexes & uniques
CREATE UNIQUE INDEX "Department_institutionId_code_key" ON "Department"("institutionId", "code");
CREATE INDEX "Department_institutionId_idx" ON "Department"("institutionId");
CREATE INDEX "Department_institutionId_status_idx" ON "Department"("institutionId", "status");

CREATE UNIQUE INDEX "Program_institutionId_code_key" ON "Program"("institutionId", "code");
CREATE INDEX "Program_institutionId_idx" ON "Program"("institutionId");
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");
CREATE INDEX "Program_institutionId_status_idx" ON "Program"("institutionId", "status");

CREATE INDEX "StudentProfile_departmentId_idx" ON "StudentProfile"("departmentId");
CREATE INDEX "StudentProfile_programId_idx" ON "StudentProfile"("programId");
CREATE INDEX "LecturerProfile_departmentId_idx" ON "LecturerProfile"("departmentId");
CREATE INDEX "Course_departmentId_idx" ON "Course"("departmentId");
CREATE INDEX "Course_programId_idx" ON "Course"("programId");
CREATE INDEX "ClassSession_scheduledStart_idx" ON "ClassSession"("scheduledStart");

-- Foreign keys
ALTER TABLE "Department" ADD CONSTRAINT "Department_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LecturerProfile" ADD CONSTRAINT "LecturerProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
