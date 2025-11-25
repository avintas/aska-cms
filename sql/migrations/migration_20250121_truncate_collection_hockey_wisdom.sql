-- Migration: Truncate collection_hockey_wisdom table
-- Date: 2025-01-21
-- Description: 
--   Removes all data from collection_hockey_wisdom table and resets the sequence.
--   This is useful for clearing generated content and starting fresh.

BEGIN;

-- ========================================================================
-- STEP 1: Truncate collection_hockey_wisdom table
-- ========================================================================

TRUNCATE TABLE public.collection_hockey_wisdom RESTART IDENTITY CASCADE;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify table is empty
-- SELECT COUNT(*) as remaining_rows
-- FROM public.collection_hockey_wisdom;

-- Verify sequence was reset
-- SELECT last_value 
-- FROM collection_hockey_wisdom_id_seq;

COMMIT;

