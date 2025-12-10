-- Migration: Drop GIN index on sets column
-- Date: 2025-12-11
-- Description: 
--   Drops the GIN index on the sets JSONB array column because it exceeds
--   PostgreSQL's index size limit when storing large trivia sets.
--   The index is not needed since we query by publish_date, not within the JSONB.

BEGIN;

-- Drop the GIN index on sets array
DROP INDEX IF EXISTS idx_collection_trivia_sets_sets_gin;

COMMIT;

