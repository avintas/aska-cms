-- Migration: Find trivia_multiple_choice records with "mentioned" or "article" in question_text
-- Date: 2025-12-09
-- Description: 
--   Searches through trivia_multiple_choice table to find records where question_text
--   contains words like "mentioned" or "article". This is a query script to identify
--   questions that may reference external content or articles.

-- ========================================================================
-- QUERY 1: Count of records matching the criteria
-- ========================================================================

SELECT 
  COUNT(*) as total_matching_records
FROM public.trivia_multiple_choice
WHERE 
  LOWER(question_text) LIKE '%mentioned%'
  OR LOWER(question_text) LIKE '%article%';

-- ========================================================================
-- QUERY 2: List all matching records with full details
-- ========================================================================

SELECT 
  id,
  question_text,
  correct_answer,
  wrong_answers,
  explanation,
  status,
  theme,
  category,
  difficulty,
  tags,
  attribution,
  source_content_id,
  created_at,
  updated_at,
  published_at,
  archived_at,
  -- Flag which word was found
  CASE 
    WHEN LOWER(question_text) LIKE '%mentioned%' AND LOWER(question_text) LIKE '%article%' THEN 'both'
    WHEN LOWER(question_text) LIKE '%mentioned%' THEN 'mentioned'
    WHEN LOWER(question_text) LIKE '%article%' THEN 'article'
  END as matched_keyword
FROM public.trivia_multiple_choice
WHERE 
  LOWER(question_text) LIKE '%mentioned%'
  OR LOWER(question_text) LIKE '%article%'
ORDER BY 
  id ASC;

-- ========================================================================
-- QUERY 3: Summary by status
-- ========================================================================

SELECT 
  status,
  COUNT(*) as count,
  -- Count by keyword
  COUNT(*) FILTER (WHERE LOWER(question_text) LIKE '%mentioned%') as with_mentioned,
  COUNT(*) FILTER (WHERE LOWER(question_text) LIKE '%article%') as with_article,
  COUNT(*) FILTER (WHERE LOWER(question_text) LIKE '%mentioned%' AND LOWER(question_text) LIKE '%article%') as with_both
FROM public.trivia_multiple_choice
WHERE 
  LOWER(question_text) LIKE '%mentioned%'
  OR LOWER(question_text) LIKE '%article%'
GROUP BY status
ORDER BY status;

-- ========================================================================
-- QUERY 4: Sample of question_text excerpts showing the matched words
-- ========================================================================

SELECT 
  id,
  -- Show excerpt with context (first 100 chars before and after the keyword)
  CASE 
    WHEN LOWER(question_text) LIKE '%mentioned%' THEN 
      SUBSTRING(
        question_text, 
        GREATEST(1, POSITION(LOWER('mentioned') IN LOWER(question_text)) - 50),
        LEAST(LENGTH(question_text), 100)
      )
    WHEN LOWER(question_text) LIKE '%article%' THEN 
      SUBSTRING(
        question_text, 
        GREATEST(1, POSITION(LOWER('article') IN LOWER(question_text)) - 50),
        LEAST(LENGTH(question_text), 100)
      )
  END as excerpt_with_keyword,
  status
FROM public.trivia_multiple_choice
WHERE 
  LOWER(question_text) LIKE '%mentioned%'
  OR LOWER(question_text) LIKE '%article%'
ORDER BY id ASC
LIMIT 20;

-- ========================================================================
-- NOTES
-- ========================================================================
-- 
-- This script uses case-insensitive matching (LOWER()) to find:
-- - "mentioned" (and variations like "Mentioned", "MENTIONED", etc.)
-- - "article" (and variations like "Article", "ARTICLE", "articles", etc.)
--
-- The queries will match partial words, so "articles" will match "article".
-- If you need exact word matching only, you can use word boundaries with regex:
--
--   WHERE question_text ~* '\y(mentioned|article)\y'
--
-- To export results to a file, you can use:
--   \copy (SELECT ...) TO 'output.csv' CSV HEADER;

