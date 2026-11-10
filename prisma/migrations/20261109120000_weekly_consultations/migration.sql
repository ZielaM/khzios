-- Consultations repeat every week: a weekday and start/end times replace
-- the dated slots, with an optional note in each language. The department
-- head's consultations become ordinary Consultation rows, so the separate
-- head hours tables go.
--
-- Dated slots cannot be turned into weekly ones reliably (the panel stored
-- one row per week), so they are removed and entered again; the data
-- import (dane/import) adds the known ones. Trash snapshots of
-- consultations and employees still have the dated shape and could not be
-- restored, so they go too.

DELETE FROM "Consultation";
DELETE FROM "TrashItem" WHERE "entity" IN ('consultation', 'employee');

-- DropForeignKey
ALTER TABLE "DepartmentHeadHour" DROP CONSTRAINT "DepartmentHeadHour_headId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentHeadHourTranslation" DROP CONSTRAINT "DepartmentHeadHourTranslation_hourId_fkey";

-- AlterTable
ALTER TABLE "Consultation" DROP COLUMN "date",
DROP COLUMN "time",
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL,
ADD COLUMN     "weekday" SMALLINT NOT NULL;

ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
ADD CONSTRAINT "Consultation_times_check" CHECK (
  "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  AND "startTime" < "endTime"
);

-- DropTable
DROP TABLE "DepartmentHeadHour";

-- DropTable
DROP TABLE "DepartmentHeadHourTranslation";

-- CreateTable
CREATE TABLE "ConsultationTranslation" (
    "consultationId" TEXT NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "ConsultationTranslation_pkey" PRIMARY KEY ("consultationId","languageCode")
);

-- AddForeignKey
ALTER TABLE "ConsultationTranslation" ADD CONSTRAINT "ConsultationTranslation_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
