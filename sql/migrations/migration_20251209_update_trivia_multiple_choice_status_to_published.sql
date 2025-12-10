-- Migration: Update trivia_multiple_choice status to published
-- Date: 2025-12-09
-- Description: 
--   Updates all trivia_multiple_choice records that are not already published or archived
--   to have status = 'published' and sets published_at timestamp for those records.
--   This affects records with status: null, 'unpublished', or 'draft'

BEGIN;

-- ========================================================================
-- STEP 1: Update status to 'published' for unpublished records
-- ========================================================================

-- Update records that are not already published or archived
-- This includes records with status: null, 'unpublished', or 'draft
UPDATE public.trivia_multiple_choice
SET 
  status = 'published',
  published_at = COALESCE(published_at, NOW()),
  updated_at = NOW()
WHERE 
  status IS NULL 
  OR status NOT IN ('published', 'archived');

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Check status distribution after migration
-- SELECT 
--   status,
--   COUNT(*) as count
-- FROM public.trivia_multiple_choice
-- GROUP BY status
-- ORDER BY status;

-- Check records that were updated
-- SELECT 
--   id,
--   question_text,
--   status,
--   published_at,
--   updated_at
-- FROM public.trivia_multiple_choice
-- WHERE status = 'published'
-- ORDER BY updated_at DESC
-- LIMIT 10;

COMMIT;

