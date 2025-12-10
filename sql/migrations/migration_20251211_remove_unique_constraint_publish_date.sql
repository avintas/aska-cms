-- Migration: Remove unique constraint on publish_date
-- Date: 2025-12-11
-- Description: 
--   Removes the unique constraint on publish_date to allow multiple records
--   with the same publish_date (one record per trivia set)

BEGIN;

-- Remove unique constraint on publish_date
ALTER TABLE public.collection_trivia_sets 
DROP CONSTRAINT IF EXISTS collection_trivia_sets_publish_date_key;

COMMIT;

