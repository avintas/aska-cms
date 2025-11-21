-- Migration: Standardize all trivia sets tables for consistency
-- Date: 2025-01-15
-- Description: 
--   - Ensures sets_trivia_multiple_choice has correct difficulty constraint
--   - Ensures sets_trivia_true_false has correct difficulty constraint (if not already fixed)
--   - Ensures sets_trivia_who_am_i has correct difficulty constraint (if exists)
--   - Standardizes all difficulty constraints to use capitalized values (Easy, Medium, Hard)
--   - Updates default difficulty values to 'Medium' (capitalized)
--   - Ensures all tables have consistent structure

-- ========================================================================
-- SETS_TRIVIA_MULTIPLE_CHOICE
-- ========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sets_trivia_multiple_choice') THEN
    -- Step 1: Drop existing difficulty constraint if it exists
    ALTER TABLE public.sets_trivia_multiple_choice
    DROP CONSTRAINT IF EXISTS trivia_sets_mc_difficulty_check;
    
    ALTER TABLE public.sets_trivia_multiple_choice
    DROP CONSTRAINT IF EXISTS sets_trivia_multiple_choice_difficulty_check;
    
    ALTER TABLE public.sets_trivia_multiple_choice
    DROP CONSTRAINT IF EXISTS difficulty_check;

    -- Step 2: Update any existing lowercase difficulty values to capitalized
    UPDATE public.sets_trivia_multiple_choice
    SET difficulty = 'Easy'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'easy' AND difficulty != 'Easy';

    UPDATE public.sets_trivia_multiple_choice
    SET difficulty = 'Medium'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'medium' AND difficulty != 'Medium';

    UPDATE public.sets_trivia_multiple_choice
    SET difficulty = 'Hard'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'hard' AND difficulty != 'Hard';

    -- Step 3: Add new constraint with capitalized values (allows NULL)
    ALTER TABLE public.sets_trivia_multiple_choice
    ADD CONSTRAINT sets_trivia_multiple_choice_difficulty_check CHECK (
      (difficulty IS NULL) OR 
      ((difficulty)::text = ANY (ARRAY['Easy'::character varying, 'Medium'::character varying, 'Hard'::character varying]))
    );

    -- Step 4: Update default value to 'Medium' (capitalized) if column has a default
    ALTER TABLE public.sets_trivia_multiple_choice
    ALTER COLUMN difficulty SET DEFAULT 'Medium'::character varying;
  END IF;
END $$;

-- ========================================================================
-- SETS_TRIVIA_TRUE_FALSE (Ensure it's fixed even if previous migration ran)
-- ========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sets_trivia_true_false') THEN
    -- Step 1: Drop existing difficulty constraint if it exists (in case it wasn't updated)
    ALTER TABLE public.sets_trivia_true_false
    DROP CONSTRAINT IF EXISTS trivia_sets_true_false_difficulty_check;

    -- Step 2: Update any existing lowercase difficulty values to capitalized
    UPDATE public.sets_trivia_true_false
    SET difficulty = 'Easy'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'easy' AND difficulty != 'Easy';

    UPDATE public.sets_trivia_true_false
    SET difficulty = 'Medium'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'medium' AND difficulty != 'Medium';

    UPDATE public.sets_trivia_true_false
    SET difficulty = 'Hard'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'hard' AND difficulty != 'Hard';

    -- Step 3: Add new constraint with capitalized values (allows NULL)
    ALTER TABLE public.sets_trivia_true_false
    ADD CONSTRAINT trivia_sets_true_false_difficulty_check CHECK (
      (difficulty IS NULL) OR 
      ((difficulty)::text = ANY (ARRAY['Easy'::character varying, 'Medium'::character varying, 'Hard'::character varying]))
    );

    -- Step 4: Update default value to 'Medium' (capitalized)
    ALTER TABLE public.sets_trivia_true_false
    ALTER COLUMN difficulty SET DEFAULT 'Medium'::character varying;
  END IF;
END $$;

-- ========================================================================
-- SETS_TRIVIA_WHO_AM_I (if table exists)
-- ========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sets_trivia_who_am_i') THEN
    -- Step 1: Drop existing difficulty constraint if it exists (try all possible names)
    ALTER TABLE public.sets_trivia_who_am_i
    DROP CONSTRAINT IF EXISTS trivia_sets_wai_difficulty_check;
    
    ALTER TABLE public.sets_trivia_who_am_i
    DROP CONSTRAINT IF EXISTS trivia_sets_who_am_i_difficulty_check;
    
    ALTER TABLE public.sets_trivia_who_am_i
    DROP CONSTRAINT IF EXISTS sets_trivia_who_am_i_difficulty_check;
    
    ALTER TABLE public.sets_trivia_who_am_i
    DROP CONSTRAINT IF EXISTS difficulty_check;

    -- Step 2: Update any existing lowercase difficulty values to capitalized
    UPDATE public.sets_trivia_who_am_i
    SET difficulty = 'Easy'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'easy' AND difficulty != 'Easy';

    UPDATE public.sets_trivia_who_am_i
    SET difficulty = 'Medium'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'medium' AND difficulty != 'Medium';

    UPDATE public.sets_trivia_who_am_i
    SET difficulty = 'Hard'
    WHERE difficulty IS NOT NULL AND LOWER(difficulty) = 'hard' AND difficulty != 'Hard';

    -- Step 3: Add new constraint with capitalized values (allows NULL)
    ALTER TABLE public.sets_trivia_who_am_i
    ADD CONSTRAINT sets_trivia_who_am_i_difficulty_check CHECK (
      (difficulty IS NULL) OR 
      ((difficulty)::text = ANY (ARRAY['Easy'::character varying, 'Medium'::character varying, 'Hard'::character varying]))
    );

    -- Step 4: Update default value to 'Medium' (capitalized)
    ALTER TABLE public.sets_trivia_who_am_i
    ALTER COLUMN difficulty SET DEFAULT 'Medium'::character varying;
  END IF;
END $$;

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Verify all sets tables have correct difficulty values
-- Run these queries to verify the migration:

-- Check sets_trivia_multiple_choice difficulty distribution
-- SELECT 'sets_trivia_multiple_choice' as table_name, difficulty, COUNT(*) as count 
-- FROM public.sets_trivia_multiple_choice 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;

-- Check sets_trivia_true_false difficulty distribution
-- SELECT 'sets_trivia_true_false' as table_name, difficulty, COUNT(*) as count 
-- FROM public.sets_trivia_true_false 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;

-- Check sets_trivia_who_am_i difficulty distribution
-- SELECT 'sets_trivia_who_am_i' as table_name, difficulty, COUNT(*) as count 
-- FROM public.sets_trivia_who_am_i 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;

-- Verify all constraints use capitalized values
-- SELECT 
--   conname as constraint_name,
--   pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint
-- WHERE conname IN (
--   'sets_trivia_multiple_choice_difficulty_check',
--   'trivia_sets_true_false_difficulty_check',
--   'sets_trivia_who_am_i_difficulty_check',
--   'trivia_sets_who_am_i_difficulty_check'
-- )
-- ORDER BY conname;

-- Check for any invalid difficulty values across all sets tables
-- SELECT 'sets_trivia_multiple_choice' as table_name, difficulty, COUNT(*) as count
-- FROM public.sets_trivia_multiple_choice
-- WHERE difficulty IS NOT NULL 
--   AND difficulty NOT IN ('Easy', 'Medium', 'Hard')
-- GROUP BY difficulty
-- UNION ALL
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

