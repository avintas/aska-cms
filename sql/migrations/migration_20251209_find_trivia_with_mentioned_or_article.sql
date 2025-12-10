-- Migration: Delete trivia_multiple_choice records with "mentioned" or "article" in question_text
-- Date: 2025-12-09
-- Description: 
--   Deletes records from trivia_multiple_choice table where question_text
--   contains words like "mentioned" or "article". These questions may reference
--   external content or articles and should be removed.

BEGIN;

-- ========================================================================
-- STEP 1: Delete records containing "mentioned" or "article" in question_text
-- ========================================================================

DO $$
DECLARE
  records_deleted INTEGER;
  records_before INTEGER;
  records_after INTEGER;
BEGIN
  -- Count records before deletion
  SELECT COUNT(*) INTO records_before
  FROM public.trivia_multiple_choice
  WHERE 
    LOWER(question_text) LIKE '%mentioned%'
    OR LOWER(question_text) LIKE '%article%';
  
  RAISE NOTICE 'Records found matching criteria: %', records_before;
  
  -- Delete records
  DELETE FROM public.trivia_multiple_choice
  WHERE 
    LOWER(question_text) LIKE '%mentioned%'
    OR LOWER(question_text) LIKE '%article%';
  
  -- Get number of records deleted
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  
  -- Verify deletion
  SELECT COUNT(*) INTO records_after
  FROM public.trivia_multiple_choice
  WHERE 
    LOWER(question_text) LIKE '%mentioned%'
    OR LOWER(question_text) LIKE '%article%';
  
  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Results:';
  RAISE NOTICE '  Records found: %', records_before;
  RAISE NOTICE '  Records deleted: %', records_deleted;
  RAISE NOTICE '  Records remaining: %', records_after;
  RAISE NOTICE '========================================';
  
  IF records_after > 0 THEN
    RAISE WARNING 'Warning: % records still contain "mentioned" or "article"', records_after;
  ELSE
    RAISE NOTICE 'Success: All records with "mentioned" or "article" have been deleted';
  END IF;
END $$;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually after migration)
-- ========================================================================

-- Verify deletion - should return 0
-- SELECT 
--   COUNT(*) as remaining_records_with_keywords
-- FROM public.trivia_multiple_choice
-- WHERE 
--   LOWER(question_text) LIKE '%mentioned%'
--   OR LOWER(question_text) LIKE '%article%';

-- Check total records remaining in table
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(*) FILTER (WHERE status = 'published') as published_count,
--   COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
--   COUNT(*) FILTER (WHERE status IS NULL OR status NOT IN ('published', 'archived')) as unpublished_count
-- FROM public.trivia_multiple_choice;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 
-- This script uses case-insensitive matching (LOWER()) to find and delete:
-- - "mentioned" (and variations like "Mentioned", "MENTIONED", etc.)
-- - "article" (and variations like "Article", "ARTICLE", "articles", etc.)
--
-- The deletion will match partial words, so "articles" will match "article".
-- If you need exact word matching only, you can modify the WHERE clause to use regex:
--
--   WHERE question_text ~* '\y(mentioned|article)\y'
--
-- WARNING: This script permanently deletes records. Make sure to:
-- 1. Review the preview count before running
-- 2. Backup your database before executing
-- 3. Test on a development/staging environment first
--
-- To preview records before deletion, uncomment and run the verification queries first.

COMMIT;
