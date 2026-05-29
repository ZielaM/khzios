-- DropForeignKey
ALTER TABLE "Publication" DROP CONSTRAINT "Publication_teamId_fkey";

-- AlterTable
ALTER TABLE "Publication" ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
