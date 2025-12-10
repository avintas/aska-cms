-- Migration: Delete trivia_multiple_choice records with article-dependent language
-- Date: 2025-01-27
-- Description: 
--   Deletes records from trivia_multiple_choice table where question_text
--   contains article-dependent phrases like "was said to", "was described as",
--   "was identified as", "might pursue", "will have a chance for".
--   These questions assume the reader has context from an article and should be removed.

BEGIN;

-- ========================================================================
-- STEP 1: Preview records that will be deleted (for verification)
-- STEP 2: Delete records containing article-dependent phrases
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
  FROM public.trivia_multiple_choice
  WHERE 
    LOWER(question_text) LIKE '%was said to%'
    OR LOWER(question_text) LIKE '%might pursue%'
    OR LOWER(question_text) LIKE '%was described as%'
    OR LOWER(question_text) LIKE '%was identified as%'
    OR LOWER(question_text) LIKE '%will have a chance for%'
    OR LOWER(question_text) LIKE '%will have a chance to%'
    OR LOWER(question_text) LIKE '%according to%'
    OR LOWER(question_text) LIKE '%as mentioned%'
    OR LOWER(question_text) LIKE '%as reported%';
  
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
        LEFT(question_text, 120) as question_preview,
        theme,
        category,
        status,
        created_at
      FROM public.trivia_multiple_choice
      WHERE 
        LOWER(question_text) LIKE '%was said to%'
        OR LOWER(question_text) LIKE '%might pursue%'
        OR LOWER(question_text) LIKE '%was described as%'
        OR LOWER(question_text) LIKE '%was identified as%'
        OR LOWER(question_text) LIKE '%will have a chance for%'
        OR LOWER(question_text) LIKE '%will have a chance to%'
        OR LOWER(question_text) LIKE '%according to%'
        OR LOWER(question_text) LIKE '%as mentioned%'
        OR LOWER(question_text) LIKE '%as reported%'
      ORDER BY id
    LOOP
      RAISE NOTICE '  ID: %, Theme: %, Category: %, Status: %, Created: %', 
        record_list.id,
        COALESCE(record_list.theme, 'NULL'),
        COALESCE(record_list.category, 'NULL'),
        COALESCE(record_list.status, 'NULL'),
        record_list.created_at;
      RAISE NOTICE '    Preview: "%"', record_list.question_preview;
    END LOOP;
    
    RAISE NOTICE '----------------------------------------';
  END IF;
  
  -- ========================================================================
  -- STEP 2: Delete records containing article-dependent phrases
  -- ========================================================================
  DELETE FROM public.trivia_multiple_choice
  WHERE 
    LOWER(question_text) LIKE '%was said to%'
    OR LOWER(question_text) LIKE '%might pursue%'
    OR LOWER(question_text) LIKE '%was described as%'
    OR LOWER(question_text) LIKE '%was identified as%'
    OR LOWER(question_text) LIKE '%will have a chance for%'
    OR LOWER(question_text) LIKE '%will have a chance to%'
    OR LOWER(question_text) LIKE '%according to%'
    OR LOWER(question_text) LIKE '%as mentioned%'
    OR LOWER(question_text) LIKE '%as reported%';
  
  -- Capture the actual number of records deleted
  GET DIAGNOSTICS records_deleted = ROW_COUNT;
  
  -- ========================================================================
  -- STEP 3: Verify deletion (show count after deletion)
  -- ========================================================================
  SELECT COUNT(*) INTO records_remaining
  FROM public.trivia_multiple_choice
  WHERE 
    LOWER(question_text) LIKE '%was said to%'
    OR LOWER(question_text) LIKE '%might pursue%'
    OR LOWER(question_text) LIKE '%was described as%'
    OR LOWER(question_text) LIKE '%was identified as%'
    OR LOWER(question_text) LIKE '%will have a chance for%'
    OR LOWER(question_text) LIKE '%will have a chance to%'
    OR LOWER(question_text) LIKE '%according to%'
    OR LOWER(question_text) LIKE '%as mentioned%'
    OR LOWER(question_text) LIKE '%as reported%';
  
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
    RAISE WARNING 'Warning: % records still contain article-dependent phrases', records_remaining;
  ELSE
    RAISE NOTICE 'Success: All records with article-dependent phrases have been deleted';
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
--   COUNT(*) as remaining_records_with_article_phrases
-- FROM public.trivia_multiple_choice
-- WHERE 
--   LOWER(question_text) LIKE '%was said to%'
--   OR LOWER(question_text) LIKE '%might pursue%'
--   OR LOWER(question_text) LIKE '%was described as%'
--   OR LOWER(question_text) LIKE '%was identified as%'
--   OR LOWER(question_text) LIKE '%will have a chance for%'
--   OR LOWER(question_text) LIKE '%will have a chance to%'
--   OR LOWER(question_text) LIKE '%according to%'
--   OR LOWER(question_text) LIKE '%as mentioned%'
--   OR LOWER(question_text) LIKE '%as reported%';

-- Preview records before deletion (run this first to see what will be deleted)
-- SELECT 
--   id,
--   question_text,
--   theme,
--   category,
--   status,
--   created_at
-- FROM public.trivia_multiple_choice
-- WHERE 
--   LOWER(question_text) LIKE '%was said to%'
--   OR LOWER(question_text) LIKE '%might pursue%'
--   OR LOWER(question_text) LIKE '%was described as%'
--   OR LOWER(question_text) LIKE '%was identified as%'
--   OR LOWER(question_text) LIKE '%will have a chance for%'
--   OR LOWER(question_text) LIKE '%will have a chance to%'
--   OR LOWER(question_text) LIKE '%according to%'
--   OR LOWER(question_text) LIKE '%as mentioned%'
--   OR LOWER(question_text) LIKE '%as reported%'
-- ORDER BY id
-- LIMIT 50;

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
-- This script uses case-insensitive matching (LOWER()) to find and delete
-- questions containing article-dependent phrases:
-- - "was said to" (e.g., "Which team was said to potentially...")
-- - "might pursue" (e.g., "Which team might pursue a veteran...")
-- - "was described as" (e.g., "Which team was described as needing...")
-- - "was identified as" (e.g., "Which team was identified as needing...")
-- - "will have a chance for/to" (e.g., "In what year...will have a chance for...")
-- - "according to" (references external sources)
-- - "as mentioned" (references previous content)
-- - "as reported" (references news/articles)
--
-- The deletion will match partial words/phrases, so it will catch variations.
-- If you need exact phrase matching only, you can modify the WHERE clause to use regex:
--
--   WHERE question_text ~* '\y(was said to|might pursue|was described as)\y'
--
-- WARNING: This script permanently deletes records. Make sure to:
-- 1. Review the preview count and list before running
-- 2. Backup your database before executing
-- 3. Test on a development/staging environment first
--
-- The script will display:
-- - A count of records found
-- - A list of all records that will be deleted (ID, question preview, theme, category, status)
-- - Final summary with found/deleted/remaining counts

COMMIT;

