-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('FULL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MemberCategory" AS ENUM ('ACADEMIC', 'TECHNICAL');

-- DropIndex
DROP INDEX "NewsTranslation_searchVector_idx";

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TeamType" NOT NULL,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamTranslation" (
    "teamId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "name" TEXT NOT NULL,
    "researchDescription" TEXT,
    "teachingDescription" TEXT,

    CONSTRAINT "TeamTranslation_pkey" PRIMARY KEY ("teamId","languageCode")
);

-- CreateTable
CREATE TABLE "TeamLink" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "TeamLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLinkTranslation" (
    "linkId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TeamLinkTranslation_pkey" PRIMARY KEY ("linkId","languageCode")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" "MemberCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "profileSlug" TEXT,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMemberTranslation" (
    "memberId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "TeamMemberTranslation_pkey" PRIMARY KEY ("memberId","languageCode")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "year" SMALLINT NOT NULL,
    "doi" TEXT,
    "authors" TEXT NOT NULL,
    "journal" TEXT NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationTranslation" (
    "publicationId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "PublicationTranslation_pkey" PRIMARY KEY ("publicationId","languageCode")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "years" TEXT NOT NULL,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProjectTranslation" (
    "projectId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" TEXT NOT NULL,
    "funder" TEXT,

    CONSTRAINT "ResearchProjectTranslation_pkey" PRIMARY KEY ("projectId","languageCode")
);

-- CreateTable
CREATE TABLE "TeachingCourse" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TeachingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingCourseTranslation" (
    "courseId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "coordinator" TEXT NOT NULL,

    CONSTRAINT "TeachingCourseTranslation_pkey" PRIMARY KEY ("courseId","languageCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "TeamLink_teamId_idx" ON "TeamLink"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "Publication_teamId_year_idx" ON "Publication"("teamId", "year" DESC);

-- CreateIndex
CREATE INDEX "ResearchProject_teamId_idx" ON "ResearchProject"("teamId");

-- CreateIndex
CREATE INDEX "TeachingCourse_teamId_idx" ON "TeachingCourse"("teamId");

-- CreateIndex
CREATE INDEX "NewsTranslation_searchVector_idx" ON "NewsTranslation"("searchVector");

-- AddForeignKey
ALTER TABLE "TeamTranslation" ADD CONSTRAINT "TeamTranslation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLink" ADD CONSTRAINT "TeamLink_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLinkTranslation" ADD CONSTRAINT "TeamLinkTranslation_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "TeamLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberTranslation" ADD CONSTRAINT "TeamMemberTranslation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTranslation" ADD CONSTRAINT "PublicationTranslation_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProjectTranslation" ADD CONSTRAINT "ResearchProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingCourse" ADD CONSTRAINT "TeachingCourse_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingCourseTranslation" ADD CONSTRAINT "TeachingCourseTranslation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TeachingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
