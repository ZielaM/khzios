-- Restore GIN indexes on the full-text search vectors.
-- 20260822100800 created them as GIN, but the schema declared a plain
-- @@index, so 20260826115620 recreated them as B-tree. B-tree cannot serve
-- the @@ operator and rejects rows whose vector exceeds the index row limit,
-- which made inserting long articles fail. The schema now declares
-- `type: Gin`, so future migrations keep these indexes as they are.

-- DropIndex
DROP INDEX IF EXISTS "NewsTranslation_searchVector_idx";

-- DropIndex
DROP INDEX IF EXISTS "PublicationTranslation_searchVector_idx";

-- CreateIndex
CREATE INDEX "NewsTranslation_searchVector_idx" ON "NewsTranslation" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "PublicationTranslation_searchVector_idx" ON "PublicationTranslation" USING GIN ("searchVector");
