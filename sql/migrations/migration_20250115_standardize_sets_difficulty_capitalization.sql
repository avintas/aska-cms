-- Migration: Standardize difficulty values in trivia sets tables to capitalized format (Easy, Medium, Hard)
-- Date: 2025-01-15
-- Description: 
--   - Updates difficulty constraint in sets_trivia_true_false to use capitalized values
--   - Updates difficulty constraint in sets_trivia_who_am_i to use capitalized values (if exists)
--   - Updates any existing lowercase difficulty values in both tables
--   - Updates default difficulty values from lowercase to capitalized
--   This ensures consistency with source tables and TypeScript types

-- ========================================================================
-- SETS_TRIVIA_TRUE_FALSE
-- ========================================================================

-- Step 1: Drop the old constraint FIRST to avoid violations during updates
ALTER TABLE public.sets_trivia_true_false
DROP CONSTRAINT IF EXISTS trivia_sets_true_false_difficulty_check;

-- Step 2: Update any existing lowercase difficulty values to capitalized
-- Also handle any NULL values that might need a default
UPDATE public.sets_trivia_true_false
SET difficulty = 'Easy'
WHERE LOWER(difficulty) = 'easy' AND difficulty != 'Easy';

UPDATE public.sets_trivia_true_false
SET difficulty = 'Medium'
WHERE LOWER(difficulty) = 'medium' AND difficulty != 'Medium';

UPDATE public.sets_trivia_true_false
SET difficulty = 'Hard'
WHERE LOWER(difficulty) = 'hard' AND difficulty != 'Hard';

-- Step 3: Add new constraint with capitalized values
ALTER TABLE public.sets_trivia_true_false
ADD CONSTRAINT trivia_sets_true_false_difficulty_check CHECK (
  (difficulty IS NULL) OR 
  ((difficulty)::text = ANY (ARRAY['Easy'::character varying, 'Medium'::character varying, 'Hard'::character varying]))
);

-- Step 4: Update default value from 'medium' to 'Medium'
ALTER TABLE public.sets_trivia_true_false
ALTER COLUMN difficulty SET DEFAULT 'Medium'::character varying;

-- ========================================================================
-- SETS_TRIVIA_WHO_AM_I (if table exists)
-- ========================================================================

-- Step 1: Drop the old constraint FIRST to avoid violations during updates
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sets_trivia_who_am_i') THEN
    -- Drop constraint first
    EXECUTE '
      ALTER TABLE public.sets_trivia_who_am_i
      DROP CONSTRAINT IF EXISTS trivia_sets_wai_difficulty_check;
    ';

    -- Step 2: Update any existing lowercase difficulty values to capitalized
    EXECUTE '
      UPDATE public.sets_trivia_who_am_i
      SET difficulty = ''Easy''
      WHERE LOWER(difficulty) = ''easy'' AND difficulty != ''Easy'';

      UPDATE public.sets_trivia_who_am_i
      SET difficulty = ''Medium''
      WHERE LOWER(difficulty) = ''medium'' AND difficulty != ''Medium'';

      UPDATE public.sets_trivia_who_am_i
      SET difficulty = ''Hard''
      WHERE LOWER(difficulty) = ''hard'' AND difficulty != ''Hard'';
    ';

    -- Step 3: Add new constraint with capitalized values
    EXECUTE '
      ALTER TABLE public.sets_trivia_who_am_i
      ADD CONSTRAINT trivia_sets_wai_difficulty_check CHECK (
        (difficulty IS NULL) OR 
        ((difficulty)::text = ANY (ARRAY[''Easy''::character varying, ''Medium''::character varying, ''Hard''::character varying]))
      );
    ';

    -- Step 4: Update default value from 'medium' to 'Medium' (if column has default)
    EXECUTE '
      ALTER TABLE public.sets_trivia_who_am_i
      ALTER COLUMN difficulty SET DEFAULT ''Medium''::character varying;
    ';
  END IF;
END $$;

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Verify sets_trivia_true_false difficulty values are capitalized
-- SELECT difficulty, COUNT(*) as count 
-- FROM public.sets_trivia_true_false 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;
-- Expected result: Only 'Easy', 'Medium', 'Hard' (all capitalized)

-- Verify sets_trivia_who_am_i difficulty values are capitalized (if table exists)
-- SELECT difficulty, COUNT(*) as count 
-- FROM public.sets_trivia_who_am_i 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;
-- Expected result: Only 'Easy', 'Medium', 'Hard' (all capitalized)

-- Check for any invalid difficulty values (not Easy, Medium, Hard, or NULL)
-- SELECT 'sets_trivia_true_false' as table_name, difficulty, COUNT(*) as count
-- FROM public.sets_trivia_true_false
-- WHERE difficulty IS NOT NULL 
--   AND difficulty NOT IN ('Easy', 'Medium', 'Hard')
-- GROUP BY difficulty
-- UNION ALL
-- SELECT 'sets_trivia_who_am_i' as table_name, difficulty, COUNT(*) as count
-- FROM public.sets_trivia_who_am_i
-- WHERE difficulty IS NOT NULL 
--   AND difficulty NOT IN ('Easy', 'Medium', 'Hard')
-- GROUP BY difficulty;
-- Expected result: No rows (empty result set)

-- Verify constraint exists and uses correct values
-- SELECT 
--   conname as constraint_name,
--   pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint
-- WHERE conname IN ('trivia_sets_true_false_difficulty_check', 'trivia_sets_wai_difficulty_check');
-- Expected result: Constraints should show 'Easy', 'Medium', 'Hard' (capitalized)

