-- Migration: Update trivia_true_false status to published
-- Date: 2025-01-24
-- Description: 
--   Updates all trivia_true_false records that are not already published or archived
--   to have status = 'published' and sets published_at timestamp for those records.
--   This affects records with status: null, 'unpublished', or 'draft'

BEGIN;

-- ========================================================================
-- STEP 1: Preview records that will be updated (for verification)
-- STEP 2: Update status to 'published' for unpublished records
-- STEP 3: Verify update and report results
-- ========================================================================

DO $$
DECLARE
  records_found INTEGER;
  records_updated INTEGER;
  records_published_before INTEGER;
  records_published_after INTEGER;
  record_list RECORD;
BEGIN
  -- ========================================================================
  -- STEP 1: Count and list records that will be updated (for verification)
  -- ========================================================================
  SELECT COUNT(*) INTO records_found
  FROM public.trivia_true_false
  WHERE 
    status IS NULL 
    OR status NOT IN ('published', 'archived');
  
  -- Count published records before update
  SELECT COUNT(*) INTO records_published_before
  FROM public.trivia_true_false
  WHERE status = 'published';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PREVIEW: Records to be updated: %', records_found;
  RAISE NOTICE 'Current published count: %', records_published_before;
  RAISE NOTICE '========================================';
  
  -- Build and display list of records that will be updated (sample)
  IF records_found > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Sample records to be updated (first 10):';
    RAISE NOTICE '----------------------------------------';
    
    FOR record_list IN
      SELECT 
        id,
        LEFT(question_text, 80) as question_preview,
        is_true,
        status,
        published_at,
        created_at
      FROM public.trivia_true_false
      WHERE 
        status IS NULL 
        OR status NOT IN ('published', 'archived')
      ORDER BY id
      LIMIT 10
    LOOP
      RAISE NOTICE '  ID: %, Preview: "%, Is True: %, Status: %, Published At: %', 
        record_list.id,
        record_list.question_preview,
        record_list.is_true,
        COALESCE(record_list.status, 'NULL'),
        COALESCE(record_list.published_at::text, 'NULL');
    END LOOP;
    
    IF records_found > 10 THEN
      RAISE NOTICE '  ... and % more records', records_found - 10;
    END IF;
    
    RAISE NOTICE '----------------------------------------';
  END IF;
  
  -- ========================================================================
  -- STEP 2: Update status to 'published' for unpublished records
  -- ========================================================================
  UPDATE public.trivia_true_false
  SET 
    status = 'published',
    published_at = COALESCE(published_at, NOW()),
    updated_at = NOW()
  WHERE 
    status IS NULL 
    OR status NOT IN ('published', 'archived');
  
  -- Capture the actual number of records updated
  GET DIAGNOSTICS records_updated = ROW_COUNT;
  
  -- ========================================================================
  -- STEP 3: Verify update (show count after update)
  -- ========================================================================
  SELECT COUNT(*) INTO records_published_after
  FROM public.trivia_true_false
  WHERE status = 'published';
  
  -- ========================================================================
  -- Report final results
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION RESULTS SUMMARY:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  Records FOUND (to be updated):       %', records_found;
  RAISE NOTICE '  Records UPDATED:                      %', records_updated;
  RAISE NOTICE '  Published count BEFORE:              %', records_published_before;
  RAISE NOTICE '  Published count AFTER:                %', records_published_after;
  RAISE NOTICE '========================================';
  
  IF records_found != records_updated THEN
    RAISE WARNING 'Mismatch detected: Found % records but updated % records', records_found, records_updated;
  ELSE
    RAISE NOTICE 'Success: All unpublished records have been updated to published';
  END IF;
END $$;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually after migration)
-- ========================================================================

-- Check status distribution after migration
-- SELECT 
--   status,
--   COUNT(*) as count
-- FROM public.trivia_true_false
-- GROUP BY status
-- ORDER BY status;

-- Check records that were updated
-- SELECT 
--   id,
--   question_text,
--   is_true,
--   status,
--   published_at,
--   updated_at
-- FROM public.trivia_true_false
-- WHERE status = 'published'
-- ORDER BY updated_at DESC
-- LIMIT 10;

-- Check total records and status breakdown
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(*) FILTER (WHERE status = 'published') as published_count,
--   COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
--   COUNT(*) FILTER (WHERE status = 'unpublished') as unpublished_count,
--   COUNT(*) FILTER (WHERE status IS NULL) as null_status_count
-- FROM public.trivia_true_false;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 
-- This script updates all trivia_true_false records that are not already
-- published or archived to have status = 'published'.
--
-- Records affected:
-- - Records with status = NULL
-- - Records with status = 'unpublished'
-- - Records with status = 'draft'
-- - Any other status values except 'published' and 'archived'
--
-- Records NOT affected:
-- - Records already with status = 'published' (preserved)
-- - Records with status = 'archived' (preserved)
--
-- The script will:
-- 1. Set status = 'published'
-- 2. Set published_at = NOW() if it's currently NULL
-- 3. Update updated_at = NOW()
--
-- WARNING: This script will update records. Make sure to:
-- 1. Review the preview count and list before running
-- 2. Backup your database before executing
-- 3. Test on a development/staging environment first
--
-- The script will display:
-- - A count of records found
-- - A sample list of records that will be updated
-- - Final summary with found/updated/published counts

COMMIT;

