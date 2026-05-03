/*
  Warnings:

  - The primary key for the `News` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `content` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `News` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('pl', 'en', 'uk', 'ru');

-- AlterTable
ALTER TABLE "News" DROP CONSTRAINT "News_pkey",
DROP COLUMN "content",
DROP COLUMN "title",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "News_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "News_id_seq";

-- CreateTable
CREATE TABLE "NewsTranslation" (
    "newsId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "searchVector" tsvector,

    CONSTRAINT "NewsTranslation_pkey" PRIMARY KEY ("newsId","languageCode")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagTranslation" (
    "tagId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TagTranslation_pkey" PRIMARY KEY ("tagId","languageCode")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NewsToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NewsToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Photo_newsId_idx" ON "Photo"("newsId");

-- CreateIndex
CREATE INDEX "_NewsToTag_B_index" ON "_NewsToTag"("B");

-- CreateIndex
CREATE INDEX "News_published_createdAt_idx" ON "News"("published", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "NewsTranslation" ADD CONSTRAINT "NewsTranslation_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagTranslation" ADD CONSTRAINT "TagTranslation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsToTag" ADD CONSTRAINT "_NewsToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NewsToTag" ADD CONSTRAINT "_NewsToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dodanie logiki wyszukiwania do NewsTranslation
ALTER TABLE "NewsTranslation" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  to_tsvector(
    CASE
      WHEN "languageCode" = 'en' THEN 'english'
      WHEN "languageCode" = 'ru' THEN 'russian'
      WHEN "languageCode" = 'pl' THEN 'simple' -- Na Neonie używamy simple
      WHEN "languageCode" = 'uk' THEN 'simple' -- Na Neonie używamy simple
      ELSE 'simple'
    END::regconfig,
    coalesce("title", '') || ' ' || coalesce("content", '')
  )
) STORED;

-- Utworzenie indeksu GIN dla wektora
CREATE INDEX "NewsTranslation_searchVector_idx" ON "NewsTranslation" USING GIN ("searchVector");