-- CreateTable
CREATE TABLE "StudentAnnouncement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnnouncementTranslation" (
    "announcementId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" VARCHAR(256) NOT NULL,

    CONSTRAINT "StudentAnnouncementTranslation_pkey" PRIMARY KEY ("announcementId","languageCode")
);

-- CreateIndex
CREATE INDEX "StudentAnnouncement_date_idx" ON "StudentAnnouncement"("date" DESC);

-- AddForeignKey
ALTER TABLE "StudentAnnouncementTranslation" ADD CONSTRAINT "StudentAnnouncementTranslation_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "StudentAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
