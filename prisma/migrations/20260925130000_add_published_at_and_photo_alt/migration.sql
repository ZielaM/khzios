-- Publication date separate from the creation date, and per-language
-- alternative text for article photos.

-- DropIndex
DROP INDEX "News_published_createdAt_idx";

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing articles keep the date they have been shown with so far
UPDATE "News" SET "publishedAt" = "createdAt";

-- CreateTable
CREATE TABLE "PhotoTranslation" (
    "photoId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "alt" TEXT NOT NULL,

    CONSTRAINT "PhotoTranslation_pkey" PRIMARY KEY ("photoId","languageCode")
);

-- CreateIndex
CREATE INDEX "News_published_publishedAt_idx" ON "News"("published", "publishedAt" DESC);

-- AddForeignKey
ALTER TABLE "PhotoTranslation" ADD CONSTRAINT "PhotoTranslation_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
