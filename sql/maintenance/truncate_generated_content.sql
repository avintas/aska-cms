-- Truncate all generated content tables so we can regenerate with fresh links.
-- Run this in Supabase SQL editor or any psql session connected to the DB.
--
-- NOTE: After truncating trivia tables, the materialized statistics views
-- (trivia_category_statistics, trivia_theme_statistics, trivia_difficulty_statistics)
-- will become stale. They are automatically refreshed at the end of this script.

begin;

-- Collections (non-trivia)
truncate table public.collection_wisdom restart identity;
truncate table public.collection_greetings restart identity;
truncate table public.collection_motivational restart identity;
truncate table public.collection_stats restart identity;
truncate table public.collection_facts restart identity;

-- Trivia output tables
truncate table public.trivia_multiple_choice restart identity;
truncate table public.trivia_true_false restart identity;
truncate table public.trivia_who_am_i restart identity;

-- Clear the used_for field from source_content_ingested
-- This ensures usage badges reflect the current state after truncation
UPDATE public.source_content_ingested
SET used_for = NULL
WHERE used_for IS NOT NULL;

-- Refresh materialized statistics views after truncating trivia tables
-- These views are calculated from the trivia tables above, so they need to be
-- refreshed to reflect the empty state (or they'll show stale data)
-- Note: Using non-concurrent refresh since we're in a transaction
SELECT refresh_trivia_statistics(use_concurrent := false);

commit;

