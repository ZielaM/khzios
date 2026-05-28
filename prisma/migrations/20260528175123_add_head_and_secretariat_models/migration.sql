-- CreateTable
CREATE TABLE "DepartmentHead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "officeLocation" TEXT,

    CONSTRAINT "DepartmentHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentHeadTranslation" (
    "headId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "DepartmentHeadTranslation_pkey" PRIMARY KEY ("headId","languageCode")
);

-- CreateTable
CREATE TABLE "DepartmentHeadHour" (
    "id" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "DepartmentHeadHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentHeadHourTranslation" (
    "hourId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "day" TEXT NOT NULL,
    "hours" TEXT NOT NULL,

    CONSTRAINT "DepartmentHeadHourTranslation_pkey" PRIMARY KEY ("hourId","languageCode")
);

-- CreateTable
CREATE TABLE "Secretariat" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "officeLocation" TEXT,

    CONSTRAINT "Secretariat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretariatTranslation" (
    "secretariatId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "SecretariatTranslation_pkey" PRIMARY KEY ("secretariatId","languageCode")
);

-- CreateTable
CREATE TABLE "SecretariatHour" (
    "id" TEXT NOT NULL,
    "secretariatId" TEXT NOT NULL,
    "displayOrder" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "SecretariatHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretariatHourTranslation" (
    "hourId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "day" TEXT NOT NULL,
    "hours" TEXT NOT NULL,

    CONSTRAINT "SecretariatHourTranslation_pkey" PRIMARY KEY ("hourId","languageCode")
);

-- CreateIndex
CREATE INDEX "DepartmentHeadHour_headId_idx" ON "DepartmentHeadHour"("headId");

-- CreateIndex
CREATE INDEX "SecretariatHour_secretariatId_idx" ON "SecretariatHour"("secretariatId");

-- AddForeignKey
ALTER TABLE "DepartmentHeadTranslation" ADD CONSTRAINT "DepartmentHeadTranslation_headId_fkey" FOREIGN KEY ("headId") REFERENCES "DepartmentHead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentHeadHour" ADD CONSTRAINT "DepartmentHeadHour_headId_fkey" FOREIGN KEY ("headId") REFERENCES "DepartmentHead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentHeadHourTranslation" ADD CONSTRAINT "DepartmentHeadHourTranslation_hourId_fkey" FOREIGN KEY ("hourId") REFERENCES "DepartmentHeadHour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretariatTranslation" ADD CONSTRAINT "SecretariatTranslation_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretariatHour" ADD CONSTRAINT "SecretariatHour_secretariatId_fkey" FOREIGN KEY ("secretariatId") REFERENCES "Secretariat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretariatHourTranslation" ADD CONSTRAINT "SecretariatHourTranslation_hourId_fkey" FOREIGN KEY ("hourId") REFERENCES "SecretariatHour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
