-- Migration: Create materialized view for tag counts grouped by theme
-- Date: 2025-01-27
-- Description: 
--   Creates a materialized view that counts how many records in source_content_ingested
--   have each tag, grouped by theme. This enables building trivia sets based on tags,
--   themes, and context by showing tag distribution across themes.
--
--   The view shows:
--   - tag: The tag name
--   - theme: The theme name
--   - record_count: Number of records with this tag in this theme
--   - last_seen_at: Most recent updated_at timestamp for records with this tag/theme combo
--
--   Refresh strategy: Refresh periodically (e.g., every 15-30 minutes) or on-demand
--   using: REFRESH MATERIALIZED VIEW CONCURRENTLY tag_counts_by_theme;

BEGIN;

-- ========================================================================
-- Create materialized view for tag counts by theme
-- ========================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS tag_counts_by_theme AS
SELECT 
  theme,
  tag,
  COUNT(*) as record_count,
  MAX(updated_at) as last_seen_at,
  COUNT(DISTINCT category) as category_count
FROM (
  SELECT 
    theme,
    unnest(tags) as tag,
    category,
    updated_at
  FROM public.source_content_ingested
  WHERE 
    content_status = 'active'
    AND tags IS NOT NULL 
    AND array_length(tags, 1) > 0
    AND theme IS NOT NULL
) AS tag_expanded
GROUP BY theme, tag
ORDER BY theme, record_count DESC;

-- ========================================================================
-- Create indexes for fast lookups
-- ========================================================================

-- Index for looking up specific tag/theme combinations
CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_counts_by_theme_unique 
ON tag_counts_by_theme (theme, tag);

-- Index for finding tags within a theme (ordered by count)
CREATE INDEX IF NOT EXISTS idx_tag_counts_by_theme_theme_count 
ON tag_counts_by_theme (theme, record_count DESC);

-- Index for finding all occurrences of a tag across themes
CREATE INDEX IF NOT EXISTS idx_tag_counts_by_theme_tag_count 
ON tag_counts_by_theme (tag, record_count DESC);

-- Index for finding tags by theme alphabetically
CREATE INDEX IF NOT EXISTS idx_tag_counts_by_theme_theme_tag 
ON tag_counts_by_theme (theme, tag);

-- ========================================================================
-- Helper function to refresh the view (optional, for convenience)
-- ========================================================================

-- Note: To refresh the view, use:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY tag_counts_by_theme;
--
-- The CONCURRENTLY option allows reads during refresh but requires the unique index above.

-- ========================================================================
-- Example queries for using this view
-- ========================================================================

-- Get all tags for a specific theme with counts
-- SELECT tag, record_count, category_count, last_seen_at
-- FROM tag_counts_by_theme
-- WHERE theme = 'Players'
-- ORDER BY record_count DESC;

-- Get all themes that have a specific tag
-- SELECT theme, record_count, category_count, last_seen_at
-- FROM tag_counts_by_theme
-- WHERE tag = 'hockey'
-- ORDER BY record_count DESC;

-- Get top N tags across all themes
-- SELECT theme, tag, record_count
-- FROM tag_counts_by_theme
-- ORDER BY record_count DESC
-- LIMIT 20;

-- Get tag distribution summary by theme
-- SELECT 
--   theme,
--   COUNT(DISTINCT tag) as unique_tags,
--   SUM(record_count) as total_tag_occurrences,
--   AVG(record_count) as avg_tag_count
-- FROM tag_counts_by_theme
-- GROUP BY theme
-- ORDER BY unique_tags DESC;

-- Find tags that appear in multiple themes (useful for cross-theme trivia sets)
-- SELECT 
--   tag,
--   COUNT(DISTINCT theme) as theme_count,
--   SUM(record_count) as total_records,
--   array_agg(theme ORDER BY theme) as themes
-- FROM tag_counts_by_theme
-- GROUP BY tag
-- HAVING COUNT(DISTINCT theme) > 1
-- ORDER BY theme_count DESC, total_records DESC;

COMMIT;

-- ========================================================================
-- NOTES
-- ========================================================================
--
-- Refresh Strategy:
-- 1. Manual refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY tag_counts_by_theme;
-- 2. Scheduled refresh: Set up pg_cron or application-level cron to refresh every 15-30 minutes
-- 3. On-demand refresh: Refresh when building trivia sets to ensure latest data
--
-- Performance:
-- - The view uses unnest() to expand tags arrays, which is efficient with proper indexes
-- - GIN index on tags column in source_content_ingested will help if you query directly
-- - Materialized view provides fast reads without impacting write performance
--
-- Usage for Trivia Set Building:
-- - Use this view to find tags that are common in specific themes
-- - Identify tags that span multiple themes for mixed trivia sets
-- - Filter by record_count to find tags with sufficient content
-- - Use category_count to understand tag diversity within themes

