-- Team page URLs are stored per language instead of being hard-coded in
-- src/i18n/routing.ts, so a team added to the database gets translated
-- addresses without code changes.

-- AlterTable (nullable first so existing rows can be backfilled)
ALTER TABLE "TeamTranslation" ADD COLUMN     "slug" TEXT;

-- Default: the team's canonical slug
UPDATE "TeamTranslation" tt
SET "slug" = t."slug"
FROM "Team" t
WHERE t."id" = tt."teamId";

-- Keep the addresses that were previously configured in routing.ts
UPDATE "TeamTranslation" tt
SET "slug" = v."localized"
FROM "Team" t,
  (VALUES
    ('ruminants', 'pl', 'przezuwajace'),
    ('ruminants', 'uk', 'zhuyni'),
    ('ruminants', 'ru', 'zhvachnye'),
    ('poultry', 'pl', 'drob'),
    ('poultry', 'uk', 'ptytsia'),
    ('poultry', 'ru', 'ptitsa'),
    ('swine', 'pl', 'trzoda'),
    ('swine', 'uk', 'svyni'),
    ('swine', 'ru', 'svini'),
    ('fur-animals', 'pl', 'futerkowe'),
    ('fur-animals', 'uk', 'khutrovi'),
    ('fur-animals', 'ru', 'pushnye'),
    ('veterinary', 'pl', 'weterynaryjna'),
    ('veterinary', 'uk', 'veterynarna'),
    ('veterinary', 'ru', 'veterinarnaya'),
    ('zlotnicka-pig-herdbooks', 'pl', 'ksiegi-zlotnickie'),
    ('zlotnicka-pig-herdbooks', 'uk', 'knyhy-zlotnytski'),
    ('zlotnicka-pig-herdbooks', 'ru', 'knigi-zlotnitskie')
  ) AS v("team", "lang", "localized")
WHERE t."id" = tt."teamId"
  AND t."slug" = v."team"
  AND tt."languageCode"::text = v."lang";

ALTER TABLE "TeamTranslation" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TeamTranslation_languageCode_slug_key" ON "TeamTranslation"("languageCode", "slug");
