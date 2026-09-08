-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,
    "statutePath" TEXT NOT NULL,
    "syllabusPath" TEXT NOT NULL,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocumentTranslation" (
    "documentId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "subjectName" TEXT NOT NULL,

    CONSTRAINT "StudentDocumentTranslation_pkey" PRIMARY KEY ("documentId","languageCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentDocument_slug_key" ON "StudentDocument"("slug");

-- CreateIndex
CREATE INDEX "StudentDocument_displayOrder_idx" ON "StudentDocument"("displayOrder");

-- AddForeignKey
ALTER TABLE "StudentDocumentTranslation" ADD CONSTRAINT "StudentDocumentTranslation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudentDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
