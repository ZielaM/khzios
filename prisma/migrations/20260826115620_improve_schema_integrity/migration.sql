/*
  Warnings:

  - You are about to drop the `ConsultationTranslation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[orcid]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doi]` on the table `Publication` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,employeeId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Made the column `profileSlug` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ConsultationTranslation" DROP CONSTRAINT "ConsultationTranslation_consultationId_fkey";

-- DropIndex
DROP INDEX "NewsTranslation_searchVector_idx";

-- DropIndex
DROP INDEX "PublicationTranslation_searchVector_idx";

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "profileSlug" SET NOT NULL;

-- DropTable
DROP TABLE "ConsultationTranslation";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_orcid_key" ON "Employee"("orcid");

-- CreateIndex
CREATE INDEX "NewsTranslation_searchVector_idx" ON "NewsTranslation"("searchVector");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_doi_key" ON "Publication"("doi");

-- CreateIndex
CREATE INDEX "PublicationTranslation_searchVector_idx" ON "PublicationTranslation"("searchVector");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_employeeId_key" ON "TeamMember"("teamId", "employeeId");
