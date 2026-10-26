-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "employmentType" TEXT NOT NULL DEFAULT 'Permanent';
