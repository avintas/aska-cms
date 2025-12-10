-- Migration: Create RPC function to increment question usage count
-- Date: 2025-12-11
-- Description: 
--   Creates a PostgreSQL function to efficiently increment global_usage_count
--   for multiple questions in a single operation. This is more efficient than
--   updating each question individually.

BEGIN;

-- ========================================================================
-- STEP 1: Create RPC function
-- ========================================================================

CREATE OR REPLACE FUNCTION public.increment_question_usage_count(question_ids BIGINT[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.trivia_multiple_choice
  SET global_usage_count = global_usage_count + 1
  WHERE id = ANY(question_ids);
END;
$$;

-- ========================================================================
-- STEP 2: Add comment
-- ========================================================================

COMMENT ON FUNCTION public.increment_question_usage_count IS 
'Efficiently increments global_usage_count for multiple questions in a single operation. Takes an array of question IDs.';

-- ========================================================================
-- VERIFICATION (uncomment to run manually)
-- ========================================================================

-- Test the function
-- SELECT public.increment_question_usage_count(ARRAY[1, 2, 3]);

-- Check function exists
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' 
--   AND routine_name = 'increment_question_usage_count';

COMMIT;

