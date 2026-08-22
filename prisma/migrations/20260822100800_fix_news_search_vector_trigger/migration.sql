-- Fix NewsTranslation searchVector column.
-- The column was created as a plain tsvector in the init migration's CREATE TABLE,
-- then the ALTER TABLE ADD COLUMN IF NOT EXISTS with GENERATED ALWAYS AS STORED
-- was silently skipped. Result: searchVector was always NULL.
--
-- Additionally, fix index types: both News and Publication searchVector indexes
-- need GIN (not B-tree) for the @@ operator to use the index.

-- 1. Fix NewsTranslation searchVector index: B-tree → GIN
DROP INDEX IF EXISTS "NewsTranslation_searchVector_idx";
CREATE INDEX "NewsTranslation_searchVector_idx" ON "NewsTranslation" USING GIN ("searchVector");

-- 2. Fix PublicationTranslation searchVector index: B-tree → GIN
DROP INDEX IF EXISTS "PublicationTranslation_searchVector_idx";
CREATE INDEX "PublicationTranslation_searchVector_idx" ON "PublicationTranslation" USING GIN ("searchVector");

-- 3. Create trigger to auto-populate NewsTranslation.searchVector
CREATE OR REPLACE FUNCTION update_news_translation_search_vector() RETURNS trigger AS $$
DECLARE
  v_config regconfig;
BEGIN
  v_config := CASE
    WHEN NEW."languageCode" = 'en' THEN 'english'::regconfig
    WHEN NEW."languageCode" = 'ru' THEN 'russian'::regconfig
    ELSE 'simple'::regconfig
  END;

  NEW."searchVector" := to_tsvector(v_config, coalesce(NEW."title", '') || ' ' || coalesce(NEW."content", ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_translation_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, content, "languageCode"
ON "NewsTranslation"
FOR EACH ROW EXECUTE FUNCTION update_news_translation_search_vector();

-- 4. Populate existing rows (trigger fires on UPDATE OF title, content, "languageCode")
UPDATE "NewsTranslation" SET title = title;
