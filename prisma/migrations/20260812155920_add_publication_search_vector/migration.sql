-- AlterTable
ALTER TABLE "PublicationTranslation" ADD COLUMN "searchVector" tsvector;

-- CreateIndex (using GIN)
CREATE INDEX "PublicationTranslation_searchVector_idx" ON "PublicationTranslation" USING GIN ("searchVector");

-- Trigger function for PublicationTranslation inserts/updates
CREATE OR REPLACE FUNCTION update_publication_translation_search_vector() RETURNS trigger AS $$
DECLARE
  v_authors text;
  v_journal text;
  v_config regconfig;
BEGIN
  -- Fetch parent fields
  SELECT authors, journal INTO v_authors, v_journal FROM "Publication" WHERE id = NEW."publicationId";
  
  -- Determine dictionary
  v_config := CASE
    WHEN NEW."languageCode" = 'en' THEN 'english'::regconfig
    WHEN NEW."languageCode" = 'ru' THEN 'russian'::regconfig
    ELSE 'simple'::regconfig
  END;

  NEW."searchVector" := to_tsvector(v_config, coalesce(v_authors, '') || ' ' || coalesce(v_journal, '') || ' ' || coalesce(NEW."title", ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_publication_translation_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, "languageCode", "publicationId"
ON "PublicationTranslation"
FOR EACH ROW EXECUTE FUNCTION update_publication_translation_search_vector();

-- Trigger function for Publication updates
CREATE OR REPLACE FUNCTION update_publication_search_vector() RETURNS trigger AS $$
BEGIN
  -- Update all translations when Publication changes
  UPDATE "PublicationTranslation" 
  SET "publicationId" = NEW.id
  WHERE "publicationId" = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_publication_search_vector_trigger
AFTER UPDATE OF authors, journal
ON "Publication"
FOR EACH ROW EXECUTE FUNCTION update_publication_search_vector();

-- Populate existing rows
UPDATE "PublicationTranslation" SET "publicationId" = "publicationId";
