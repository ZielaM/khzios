-- A publication can belong to several teams (co-authored work appears on
-- each team's page). Existing assignments move to the link table before the
-- old column is dropped, so no publication loses its team.

-- CreateTable
CREATE TABLE "PublicationTeam" (
    "publicationId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "PublicationTeam_pkey" PRIMARY KEY ("publicationId","teamId")
);

-- CreateIndex
CREATE INDEX "PublicationTeam_teamId_idx" ON "PublicationTeam"("teamId");

-- AddForeignKey
ALTER TABLE "PublicationTeam" ADD CONSTRAINT "PublicationTeam_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTeam" ADD CONSTRAINT "PublicationTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Move the existing assignments
INSERT INTO "PublicationTeam" ("publicationId", "teamId")
SELECT "id", "teamId" FROM "Publication" WHERE "teamId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Publication" DROP CONSTRAINT "Publication_teamId_fkey";

-- DropIndex
DROP INDEX "Publication_teamId_year_idx";

-- AlterTable
ALTER TABLE "Publication" DROP COLUMN "teamId";

-- CreateIndex
CREATE INDEX "Publication_year_idx" ON "Publication"("year" DESC);
