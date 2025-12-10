-- Migration: Delete trivia_true_false records with "mentioned" or "article" in question_text
-- Date: 2025-01-24
-- Description: 
--   Deletes records from trivia_true_false table where question_text
--   contains words like "mentioned" or "article". These questions may reference
--   external content or articles and should be removed.

BEGIN;

-- ========================================================================
-- STEP 1: Preview records that will be deleted (for verification)
-- STEP 2: Delete records containing "mentioned" or "article" in question_text
-- STEP 3: Verify deletion and report results
-- ========================================================================

DO $$
DECLARE
  records_found INTEGER;
  records_deleted INTEGER;
  records_remaining INTEGER;
  record_list RECORD;
BEGIN
  -- ========================================================================
  -- STEP 1: Count and list records that will be deleted (for verification)
  -- ========================================================================
  SELECT COUNT(*) INTO records_found
  FROM public.trivia_true_false
  WHERE 
    LOWER(question_text) LIKE '%mentioned%'
    OR LOWER(question_text) LIKE '%article%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PREVIEW: Records found matching criteria: %', records_found;
  RAISE NOTICE '========================================';
  
  -- Build and display list of records that will be deleted
  IF records_found > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Records to be deleted:';
    RAISE NOTICE '----------------------------------------';
    
    FOR record_list IN
      SELECT 
        id,
        LEFT(question_text, 100) as question_preview,
        is_true,
        status,
        created_at
      FROM public.trivia_true_false
      WHERE 
        LOWER(question_text) LIKE '%mentioned%'
        OR LOWER(question_text) LIKE '%article%'
      ORDER BY id
    LOOP
      RAISE NOTICE '  ID: %, Preview: "%, Is True: %, Status: %, Created: %', 
        record_list.id,
        record_list.question_preview,
        record_list.is_true,
        record_list.status,
        record_list.created_at;
    END LOOP;
    
    RAISE NOTICE '----------------------------------------';
  END IF;
  
  -- ========================================================================
  -- STEP 2: Delete records containing "mentioned" or "article" in question_text
  -- ========================================================================
  DELETE FROM public.trivia_true_false
  WHERE 
    LOWER(question_text) LIKE '%mentioned%'
    OR LOWER(question_text) LIKE '%article%';
  
  -- Capture the actual number of records deleted
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  
  -- ========================================================================
  -- STEP 3: Verify deletion (show count after deletion)
  -- ========================================================================
  SELECT COUNT(*) INTO records_remaining
  FROM public.trivia_true_false
  WHERE 
    LOWER(question_text) LIKE '%mentioned%'
    OR LOWER(question_text) LIKE '%article%';
  
  -- ========================================================================
  -- Report final results
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION RESULTS SUMMARY:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  Records FOUND (before deletion):    %', records_found;
  RAISE NOTICE '  Records DELETED:                     %', records_deleted;
  RAISE NOTICE '  Records REMAINING (after deletion):  %', records_remaining;
  RAISE NOTICE '========================================';
  
  IF records_remaining > 0 THEN
    RAISE WARNING 'Warning: % records still contain "mentioned" or "article"', records_remaining;
  ELSE
    RAISE NOTICE 'Success: All records with "mentioned" or "article" have been deleted';
  END IF;
  
  -- Verify that found count matches deleted count (should be the same)
  IF records_found != records_deleted THEN
    RAISE WARNING 'Mismatch detected: Found % records but deleted % records', records_found, records_deleted;
  END IF;
END $$;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually after migration)
-- ========================================================================

-- Verify deletion - should return 0
-- SELECT 
--   COUNT(*) as remaining_records_with_keywords
-- FROM public.trivia_true_false
-- WHERE 
--   LOWER(question_text) LIKE '%mentioned%'
--   OR LOWER(question_text) LIKE '%article%';

-- Check total records remaining in table
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(*) FILTER (WHERE status = 'published') as published_count,
--   COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
--   COUNT(*) FILTER (WHERE status IS NULL OR status NOT IN ('published', 'archived')) as unpublished_count
-- FROM public.trivia_true_false;

-- View sample of remaining records (if any) with keywords
-- SELECT 
--   id,
--   question_text,
--   is_true,
--   status,
--   created_at
-- FROM public.trivia_true_false
-- WHERE 
--   LOWER(question_text) LIKE '%mentioned%'
--   OR LOWER(question_text) LIKE '%article%'
-- LIMIT 10;

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
-- 1. Review the preview count and list before running
-- 2. Backup your database before executing
-- 3. Test on a development/staging environment first
--
-- The script will display:
-- - A count of records found
-- - A list of all records that will be deleted (ID, question preview, status)
-- - Final summary with found/deleted/remaining counts

COMMIT;

