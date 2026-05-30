/*
  Warnings:

  - You are about to drop the column `email` on the `DepartmentHead` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `DepartmentHead` table. All the data in the column will be lost.
  - You are about to drop the column `officeLocation` on the `DepartmentHead` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `DepartmentHead` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `DepartmentHead` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `orcid` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `profileSlug` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the `DepartmentHeadTranslation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMemberTranslation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `DepartmentHead` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `DepartmentHead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `TeamMember` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DepartmentHeadTranslation" DROP CONSTRAINT "DepartmentHeadTranslation_headId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMemberTranslation" DROP CONSTRAINT "TeamMemberTranslation_memberId_fkey";

-- DropIndex
DROP INDEX "TeamMember_profileSlug_idx";

-- DropIndex
DROP INDEX "TeamMember_profileSlug_key";

-- AlterTable
ALTER TABLE "DepartmentHead" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "officeLocation",
DROP COLUMN "phone",
DROP COLUMN "photoUrl",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "displayOrder",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "orcid",
DROP COLUMN "phone",
DROP COLUMN "photoUrl",
DROP COLUMN "profileSlug",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- DropTable
DROP TABLE "DepartmentHeadTranslation";

-- DropTable
DROP TABLE "TeamMemberTranslation";

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "profileSlug" TEXT,
    "orcid" TEXT,
    "officeLocation" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTranslation" (
    "employeeId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "academicTitle" TEXT,

    CONSTRAINT "EmployeeTranslation_pkey" PRIMARY KEY ("employeeId","languageCode")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "room" TEXT,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTranslation" (
    "consultationId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "day" TEXT NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "ConsultationTranslation_pkey" PRIMARY KEY ("consultationId","languageCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_profileSlug_key" ON "Employee"("profileSlug");

-- CreateIndex
CREATE INDEX "Consultation_employeeId_idx" ON "Consultation"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentHead_employeeId_key" ON "DepartmentHead"("employeeId");

-- CreateIndex
CREATE INDEX "TeamMember_employeeId_idx" ON "TeamMember"("employeeId");

-- AddForeignKey
ALTER TABLE "EmployeeTranslation" ADD CONSTRAINT "EmployeeTranslation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationTranslation" ADD CONSTRAINT "ConsultationTranslation_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentHead" ADD CONSTRAINT "DepartmentHead_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
