-- Verification Queries for Trivia Statistics System
-- Run these queries to verify the statistics system is set up correctly

-- ========================================================================
-- 1. Check if materialized views exist
-- ========================================================================
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated
FROM pg_matviews 
WHERE matviewname LIKE 'trivia_%_statistics'
ORDER BY matviewname;

-- ========================================================================
-- 2. Check if refresh function exists
-- ========================================================================
SELECT 
  proname as function_name,
  pronargs as parameter_count,
  pg_get_function_arguments(oid) as parameters,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'refresh_trivia_statistics';

-- ========================================================================
-- 3. Check if unique indexes exist (required for concurrent refresh)
-- ========================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_trivia_%_stats_unique'
ORDER BY indexname;

-- ========================================================================
-- 4. Check row counts in materialized views
-- ========================================================================
SELECT 
  'trivia_category_statistics' as view_name,
  COUNT(*) as row_count
FROM trivia_category_statistics
UNION ALL
SELECT 
  'trivia_theme_statistics' as view_name,
  COUNT(*) as row_count
FROM trivia_theme_statistics
UNION ALL
SELECT 
  'trivia_difficulty_statistics' as view_name,
  COUNT(*) as row_count
FROM trivia_difficulty_statistics;

-- ========================================================================
-- 5. Test the refresh function (non-concurrent)
-- ========================================================================
-- Uncomment to test:
-- SELECT refresh_trivia_statistics(false);

-- ========================================================================
-- 6. Sample query to get categories
-- ========================================================================
SELECT 
  category,
  published_count,
  total_count
FROM trivia_category_statistics
WHERE trivia_type = 'multiple_choice' 
  AND theme = 'Players'
ORDER BY published_count DESC
LIMIT 10;

