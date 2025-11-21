-- Migration: Create pre-calculated statistics views for trivia metadata
-- Date: 2025-11-14
-- Description: 
--   Creates materialized views to store pre-calculated counts for:
--   - Categories by theme and trivia type
--   - Difficulty levels by theme and trivia type
--   - Theme availability counts
--   This eliminates the need to recalculate counts on every page load,
--   improving performance for forms and processes that display metadata counts.
--
--   The views are designed to be reusable across:
--   - Trivia set builders (MC, TF, Who Am I)
--   - Ideation module
--   - Content browsers
--   - Any other process requiring metadata counts

-- ========================================================================
-- MATERIALIZED VIEW: Category Statistics
-- ========================================================================
-- Stores category counts grouped by trivia type, theme, and category
-- Includes both total and published counts for flexibility

CREATE MATERIALIZED VIEW IF NOT EXISTS trivia_category_statistics AS
SELECT 
  'multiple_choice' as trivia_type,
  theme,
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Easy') as easy_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Medium') as medium_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Hard') as hard_count
FROM trivia_multiple_choice
WHERE theme IS NOT NULL
GROUP BY theme, COALESCE(category, 'Uncategorized')

UNION ALL

SELECT 
  'true_false' as trivia_type,
  theme,
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Easy') as easy_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Medium') as medium_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Hard') as hard_count
FROM trivia_true_false
WHERE theme IS NOT NULL
GROUP BY theme, COALESCE(category, 'Uncategorized')

UNION ALL

SELECT 
  'who_am_i' as trivia_type,
  theme,
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Easy') as easy_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Medium') as medium_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Hard') as hard_count
FROM trivia_who_am_i
WHERE theme IS NOT NULL
GROUP BY theme, COALESCE(category, 'Uncategorized');

-- ========================================================================
-- MATERIALIZED VIEW: Theme Statistics
-- ========================================================================
-- Stores theme-level counts for quick theme availability checks

CREATE MATERIALIZED VIEW IF NOT EXISTS trivia_theme_statistics AS
SELECT 
  'multiple_choice' as trivia_type,
  theme,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(DISTINCT COALESCE(category, 'Uncategorized')) as category_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Easy') as easy_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Medium') as medium_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Hard') as hard_count
FROM trivia_multiple_choice
WHERE theme IS NOT NULL
GROUP BY theme

UNION ALL

SELECT 
  'true_false' as trivia_type,
  theme,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(DISTINCT COALESCE(category, 'Uncategorized')) as category_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Easy') as easy_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Medium') as medium_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Hard') as hard_count
FROM trivia_true_false
WHERE theme IS NOT NULL
GROUP BY theme

UNION ALL

SELECT 
  'who_am_i' as trivia_type,
  theme,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(DISTINCT COALESCE(category, 'Uncategorized')) as category_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Easy') as easy_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Medium') as medium_count,
  COUNT(*) FILTER (WHERE status = 'published' AND difficulty = 'Hard') as hard_count
FROM trivia_who_am_i
WHERE theme IS NOT NULL
GROUP BY theme;

-- ========================================================================
-- MATERIALIZED VIEW: Difficulty Statistics
-- ========================================================================
-- Stores difficulty level counts by theme and trivia type

CREATE MATERIALIZED VIEW IF NOT EXISTS trivia_difficulty_statistics AS
SELECT 
  'multiple_choice' as trivia_type,
  theme,
  COALESCE(difficulty, 'Unknown') as difficulty,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count
FROM trivia_multiple_choice
WHERE theme IS NOT NULL
GROUP BY theme, COALESCE(difficulty, 'Unknown')

UNION ALL

SELECT 
  'true_false' as trivia_type,
  theme,
  COALESCE(difficulty, 'Unknown') as difficulty,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count
FROM trivia_true_false
WHERE theme IS NOT NULL
GROUP BY theme, COALESCE(difficulty, 'Unknown')

UNION ALL

SELECT 
  'who_am_i' as trivia_type,
  theme,
  COALESCE(difficulty, 'Unknown') as difficulty,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'published') as published_count
FROM trivia_who_am_i
WHERE theme IS NOT NULL
GROUP BY theme, COALESCE(difficulty, 'Unknown');

-- ========================================================================
-- ADDITIONAL INDEXES for Fast Lookups
-- ========================================================================
-- Note: Unique indexes for CONCURRENT refresh are created AFTER initial population
-- See section below after initial refresh

-- Category statistics indexes
CREATE INDEX IF NOT EXISTS idx_trivia_category_stats_type_theme 
ON trivia_category_statistics (trivia_type, theme);

-- Theme statistics indexes
CREATE INDEX IF NOT EXISTS idx_trivia_theme_stats_type 
ON trivia_theme_statistics (trivia_type);

CREATE INDEX IF NOT EXISTS idx_trivia_theme_stats_type_theme 
ON trivia_theme_statistics (trivia_type, theme);

-- Difficulty statistics indexes
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_stats_type_theme 
ON trivia_difficulty_statistics (trivia_type, theme);

CREATE INDEX IF NOT EXISTS idx_trivia_difficulty_stats_type_theme_diff 
ON trivia_difficulty_statistics (trivia_type, theme, difficulty);

-- ========================================================================
-- REFRESH FUNCTION
-- ========================================================================
-- Function to refresh all statistics views concurrently
-- Can be called on schedule, via trigger, or manually
-- Note: First refresh must be non-concurrent, then unique indexes are created
-- Subsequent refreshes can use CONCURRENTLY

CREATE OR REPLACE FUNCTION refresh_trivia_statistics(use_concurrent BOOLEAN DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF use_concurrent THEN
    -- Refresh all materialized views concurrently (allows reads during refresh)
    -- Requires unique indexes to be present
    REFRESH MATERIALIZED VIEW CONCURRENTLY trivia_category_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY trivia_theme_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY trivia_difficulty_statistics;
  ELSE
    -- Non-concurrent refresh (blocks reads but doesn't require unique indexes)
    -- Use this for initial population
    REFRESH MATERIALIZED VIEW trivia_category_statistics;
    REFRESH MATERIALIZED VIEW trivia_theme_statistics;
    REFRESH MATERIALIZED VIEW trivia_difficulty_statistics;
  END IF;
  
  -- Log refresh (optional - can be removed if not needed)
  RAISE NOTICE 'Trivia statistics refreshed at %', NOW();
END;
$$;

-- ========================================================================
-- INITIAL DATA POPULATION
-- ========================================================================
-- Populate the views with current data
-- First refresh must be non-concurrent (no unique indexes required yet)

SELECT refresh_trivia_statistics(use_concurrent := false);

-- ========================================================================
-- UNIQUE INDEXES (Required for CONCURRENT refresh)
-- ========================================================================
-- These unique indexes are required for REFRESH MATERIALIZED VIEW CONCURRENTLY
-- They must be created AFTER the first refresh (when data exists)

-- Unique index for category statistics (required for concurrent refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trivia_category_stats_unique 
ON trivia_category_statistics (trivia_type, theme, category);

-- Unique index for theme statistics (required for concurrent refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trivia_theme_stats_unique 
ON trivia_theme_statistics (trivia_type, theme);

-- Unique index for difficulty statistics (required for concurrent refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trivia_difficulty_stats_unique 
ON trivia_difficulty_statistics (trivia_type, theme, difficulty);

-- ========================================================================
-- HELPER FUNCTIONS for Common Queries
-- ========================================================================

-- Get categories for a specific trivia type and theme
CREATE OR REPLACE FUNCTION get_trivia_categories(
  p_trivia_type VARCHAR(50),
  p_theme VARCHAR(255)
)
RETURNS TABLE (
  category VARCHAR(255),
  published_count INTEGER,
  total_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tcs.category,
    tcs.published_count::INTEGER,
    tcs.total_count::INTEGER
  FROM trivia_category_statistics tcs
  WHERE tcs.trivia_type = p_trivia_type
    AND tcs.theme = p_theme
  ORDER BY tcs.published_count DESC, tcs.category ASC;
END;
$$;

-- Get theme availability for a specific trivia type
CREATE OR REPLACE FUNCTION get_trivia_themes(
  p_trivia_type VARCHAR(50)
)
RETURNS TABLE (
  theme VARCHAR(255),
  published_count INTEGER,
  category_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tts.theme,
    tts.published_count::INTEGER,
    tts.category_count::INTEGER
  FROM trivia_theme_statistics tts
  WHERE tts.trivia_type = p_trivia_type
  ORDER BY tts.published_count DESC, tts.theme ASC;
END;
$$;

-- Get difficulty breakdown for a specific trivia type and theme
CREATE OR REPLACE FUNCTION get_trivia_difficulties(
  p_trivia_type VARCHAR(50),
  p_theme VARCHAR(255)
)
RETURNS TABLE (
  difficulty VARCHAR(50),
  published_count INTEGER,
  total_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tds.difficulty,
    tds.published_count::INTEGER,
    tds.total_count::INTEGER
  FROM trivia_difficulty_statistics tds
  WHERE tds.trivia_type = p_trivia_type
    AND tds.theme = p_theme
  ORDER BY 
    CASE tds.difficulty
      WHEN 'Easy' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Hard' THEN 3
      ELSE 4
    END;
END;
$$;

-- ========================================================================
-- COMMENTS for Documentation
-- ========================================================================

COMMENT ON MATERIALIZED VIEW trivia_category_statistics IS 
'Pre-calculated category counts by trivia type, theme, and category. Use for displaying category selectors without recalculating on every page load.';

COMMENT ON MATERIALIZED VIEW trivia_theme_statistics IS 
'Pre-calculated theme-level counts by trivia type. Use for theme availability displays and quick theme selection.';

COMMENT ON MATERIALIZED VIEW trivia_difficulty_statistics IS 
'Pre-calculated difficulty level counts by trivia type and theme. Use for difficulty filtering and displays.';

COMMENT ON FUNCTION refresh_trivia_statistics(BOOLEAN) IS 
'Refreshes all trivia statistics materialized views. Call this periodically (e.g., hourly) or after bulk updates. Usage: refresh_trivia_statistics() or refresh_trivia_statistics(true) for concurrent, refresh_trivia_statistics(false) for non-concurrent.';

COMMENT ON FUNCTION get_trivia_categories(VARCHAR, VARCHAR) IS 
'Helper function to get categories for a specific trivia type and theme. Returns published and total counts.';

COMMENT ON FUNCTION get_trivia_themes(VARCHAR) IS 
'Helper function to get available themes for a specific trivia type. Returns published count and category count.';

COMMENT ON FUNCTION get_trivia_difficulties(VARCHAR, VARCHAR) IS 
'Helper function to get difficulty breakdown for a specific trivia type and theme.';

-- ========================================================================
-- USAGE EXAMPLES
-- ========================================================================
-- 
-- Get categories for Multiple Choice, "Players" theme:
-- SELECT * FROM get_trivia_categories('multiple_choice', 'Players');
--
-- Get all themes for True/False:
-- SELECT * FROM get_trivia_themes('true_false');
--
-- Get difficulty breakdown for Who Am I, "Teams & Organizations" theme:
-- SELECT * FROM get_trivia_difficulties('who_am_i', 'Teams & Organizations');
--
-- Refresh statistics manually (uses default concurrent=true):
-- SELECT refresh_trivia_statistics();
-- Or explicitly:
-- SELECT refresh_trivia_statistics(true);  -- concurrent
-- SELECT refresh_trivia_statistics(false); -- non-concurrent
--
-- Verify function exists:
-- SELECT proname, pronargs FROM pg_proc WHERE proname = 'refresh_trivia_statistics';
--
-- Direct query example:
-- SELECT category, published_count 
-- FROM trivia_category_statistics 
-- WHERE trivia_type = 'multiple_choice' AND theme = 'Players'
-- ORDER BY published_count DESC;

