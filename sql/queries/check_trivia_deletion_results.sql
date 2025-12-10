-- Query to check deletion results for trivia_multiple_choice
-- Run this after the migration to see how many records were affected

-- ========================================================================
-- Check remaining records with "mentioned" or "article" keywords
-- ========================================================================
SELECT 
  COUNT(*) as remaining_records_with_keywords
FROM public.trivia_multiple_choice
WHERE 
  LOWER(question_text) LIKE '%mentioned%'
  OR LOWER(question_text) LIKE '%article%';

-- ========================================================================
-- Check total records in table (for context)
-- ========================================================================
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
  COUNT(*) FILTER (WHERE status IS NULL OR status NOT IN ('published', 'archived')) as unpublished_count
FROM public.trivia_multiple_choice;

-- ========================================================================
-- Sample records that match the criteria (if any remain)
-- ========================================================================
SELECT 
  id,
  question_text,
  status,
  created_at
FROM public.trivia_multiple_choice
WHERE 
  LOWER(question_text) LIKE '%mentioned%'
  OR LOWER(question_text) LIKE '%article%'
LIMIT 10;

