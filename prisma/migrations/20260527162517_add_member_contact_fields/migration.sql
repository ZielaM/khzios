/*
  Warnings:

  - A unique constraint covering the columns `[profileSlug]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "email" TEXT,
ADD COLUMN     "orcid" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_profileSlug_key" ON "TeamMember"("profileSlug");

-- CreateIndex
CREATE INDEX "TeamMember_profileSlug_idx" ON "TeamMember"("profileSlug");
