-- Full-text search with Polish and Ukrainian stemming.
--
-- PostgreSQL has no stemmer for either language. The database image
-- (Dockerfile.db) adds Hunspell dictionaries for both, which PostgreSQL reads
-- through its ispell template. Databases without them (the Neon development
-- database, PGlite in tests, plain PostgreSQL in CI) keep `polish` and
-- `ukrainian` configurations that work like `simple`, so the same migrations
-- and queries run everywhere.

CREATE TEXT SEARCH CONFIGURATION polish (COPY = simple);
CREATE TEXT SEARCH CONFIGURATION ukrainian (COPY = simple);

-- The configuration for texts and queries in a language. Stored vectors and
-- search queries must use the same one, or inflected words stop matching.
-- The SQL-standard body binds the configurations when the function is
-- created, so it does not depend on search_path.
CREATE FUNCTION search_config(lang "LanguageCode") RETURNS regconfig
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  RETURN CASE lang
    WHEN 'pl' THEN 'polish'::regconfig
    WHEN 'en' THEN 'english'::regconfig
    WHEN 'uk' THEN 'ukrainian'::regconfig
    WHEN 'ru' THEN 'russian'::regconfig
    ELSE 'simple'::regconfig
  END;

CREATE OR REPLACE FUNCTION update_news_translation_search_vector() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector(search_config(NEW."languageCode"), coalesce(NEW."title", '') || ' ' || coalesce(NEW."content", ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_publication_translation_search_vector() RETURNS trigger AS $$
DECLARE
  v_authors text;
  v_journal text;
BEGIN
  SELECT authors, journal INTO v_authors, v_journal FROM "Publication" WHERE id = NEW."publicationId";

  NEW."searchVector" := to_tsvector(search_config(NEW."languageCode"), coalesce(v_authors, '') || ' ' || coalesce(v_journal, '') || ' ' || coalesce(NEW."title", ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Switches `polish` and `ukrainian` to their Hunspell dictionaries when the
-- server has the files, and rebuilds the stored vectors of those languages.
-- Returns the configurations it switched. Safe to run again, e.g. after
-- restoring a dump made on a database without the dictionaries:
--   SELECT enable_search_dictionaries();
CREATE FUNCTION enable_search_dictionaries() RETURNS text[] AS $$
DECLARE
  target record;
  enabled text[] := '{}';
BEGIN
  FOR target IN
    SELECT * FROM (VALUES ('pl'::"LanguageCode", 'polish'), ('uk', 'ukrainian')) AS t(lang, config)
  LOOP
    -- Already switched. Checked on the mapping, not the dictionary: restoring a
    -- dump with --clean replaces the configuration but keeps the dictionary
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM pg_ts_config_map m
      JOIN pg_ts_config c ON c.oid = m.mapcfg
      JOIN pg_ts_dict d ON d.oid = m.mapdict
      WHERE c.cfgname = target.config
        AND c.cfgnamespace = current_schema()::regnamespace
        AND d.dictname = target.config || '_hunspell'
    );

    IF NOT EXISTS (
      SELECT 1 FROM pg_ts_dict
      WHERE dictname = target.config || '_hunspell'
        AND dictnamespace = current_schema()::regnamespace
    ) THEN
      BEGIN
        -- Reads <config>.dict and <config>.affix from the server's tsearch_data directory
        EXECUTE format(
          'CREATE TEXT SEARCH DICTIONARY %I (TEMPLATE = ispell, DictFile = %s, AffFile = %s)',
          target.config || '_hunspell', target.config, target.config
        );
      EXCEPTION WHEN config_file_error THEN
        RAISE WARNING 'No Hunspell dictionary for %, searching in that language works without stemming: %',
          target.config, SQLERRM;
        CONTINUE;
      END;
    END IF;

    -- Words the dictionary does not know (names, English terms) are indexed as typed
    EXECUTE format(
      'ALTER TEXT SEARCH CONFIGURATION %I ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part WITH %I, simple',
      target.config, target.config || '_hunspell'
    );

    -- The triggers rebuild the vectors
    UPDATE "NewsTranslation" SET title = title WHERE "languageCode" = target.lang;
    UPDATE "PublicationTranslation" SET title = title WHERE "languageCode" = target.lang;

    enabled := enabled || target.config;
  END LOOP;

  RETURN enabled;
END;
$$ LANGUAGE plpgsql;

SELECT enable_search_dictionaries();
