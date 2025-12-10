-- Migration: Add global_usage_count to trivia_multiple_choice
-- Date: 2025-01-15
-- Description: 
--   Adds global_usage_count column to trivia_multiple_choice table to track
--   how many times each question has been used in trivia sets.
--   This enables the Automated Set Building System to prioritize least-used questions.

BEGIN;

-- ========================================================================
-- STEP 1: Add global_usage_count column
-- ========================================================================

ALTER TABLE public.trivia_multiple_choice
ADD COLUMN IF NOT EXISTS global_usage_count INTEGER NOT NULL DEFAULT 0;

-- ========================================================================
-- STEP 2: Create index for efficient querying by usage count
-- ========================================================================

CREATE INDEX IF NOT EXISTS idx_trivia_multiple_choice_global_usage_count 
ON public.trivia_multiple_choice(global_usage_count ASC);

-- ========================================================================
-- STEP 3: Add comment to column
-- ========================================================================

COMMENT ON COLUMN public.trivia_multiple_choice.global_usage_count IS 
'Count of how many times this question has been included in trivia sets. Used by Automated Set Building System to prioritize least-used questions.';

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Check column was added
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'trivia_multiple_choice'
--   AND column_name = 'global_usage_count';

-- Check current usage count distribution
-- SELECT 
--   global_usage_count,
--   COUNT(*) as question_count
-- FROM public.trivia_multiple_choice
-- GROUP BY global_usage_count
-- ORDER BY global_usage_count ASC;

COMMIT;

