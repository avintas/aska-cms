-- Migration: Standardize difficulty values to capitalized format (Easy, Medium, Hard)
-- Date: 2025-11-14
-- Description: 
--   - Updates lowercase "easy" to "Easy" in all trivia tables
--   - Updates lowercase "medium" to "Medium" in all trivia tables
--   - Updates lowercase "hard" to "Hard" in all trivia tables
--   - Handles case-insensitive matching to catch all variations
--   This ensures consistency with the DifficultyLevel type definition

-- ========================================================================
-- TRIVIA MULTIPLE CHOICE
-- ========================================================================

-- Update "easy" to "Easy" (case-insensitive)
UPDATE trivia_multiple_choice
SET difficulty = 'Easy'
WHERE LOWER(difficulty) = 'easy'
  AND difficulty != 'Easy';

-- Update "medium" to "Medium" (case-insensitive)
UPDATE trivia_multiple_choice
SET difficulty = 'Medium'
WHERE LOWER(difficulty) = 'medium'
  AND difficulty != 'Medium';

-- Update "hard" to "Hard" (case-insensitive)
UPDATE trivia_multiple_choice
SET difficulty = 'Hard'
WHERE LOWER(difficulty) = 'hard'
  AND difficulty != 'Hard';

-- ========================================================================
-- TRIVIA TRUE/FALSE
-- ========================================================================

-- Update "easy" to "Easy" (case-insensitive)
UPDATE trivia_true_false
SET difficulty = 'Easy'
WHERE LOWER(difficulty) = 'easy'
  AND difficulty != 'Easy';

-- Update "medium" to "Medium" (case-insensitive)
UPDATE trivia_true_false
SET difficulty = 'Medium'
WHERE LOWER(difficulty) = 'medium'
  AND difficulty != 'Medium';

-- Update "hard" to "Hard" (case-insensitive)
UPDATE trivia_true_false
SET difficulty = 'Hard'
WHERE LOWER(difficulty) = 'hard'
  AND difficulty != 'Hard';

-- ========================================================================
-- TRIVIA WHO AM I
-- ========================================================================

-- Update "easy" to "Easy" (case-insensitive)
UPDATE trivia_who_am_i
SET difficulty = 'Easy'
WHERE LOWER(difficulty) = 'easy'
  AND difficulty != 'Easy';

-- Update "medium" to "Medium" (case-insensitive)
UPDATE trivia_who_am_i
SET difficulty = 'Medium'
WHERE LOWER(difficulty) = 'medium'
  AND difficulty != 'Medium';

-- Update "hard" to "Hard" (case-insensitive)
UPDATE trivia_who_am_i
SET difficulty = 'Hard'
WHERE LOWER(difficulty) = 'hard'
  AND difficulty != 'Hard';

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Verify that all difficulty values are now capitalized
-- Run these queries to check results:

-- Check for any lowercase "easy" values
-- SELECT COUNT(*) as lowercase_easy_count 
-- FROM (
--   SELECT difficulty FROM trivia_multiple_choice WHERE LOWER(difficulty) = 'easy' AND difficulty != 'Easy'
--   UNION ALL
--   SELECT difficulty FROM trivia_true_false WHERE LOWER(difficulty) = 'easy' AND difficulty != 'Easy'
--   UNION ALL
--   SELECT difficulty FROM trivia_who_am_i WHERE LOWER(difficulty) = 'easy' AND difficulty != 'Easy'
-- ) AS all_lowercase_easy;
-- Expected result: 0

-- Check difficulty distribution in trivia_multiple_choice
-- SELECT difficulty, COUNT(*) as count 
-- FROM trivia_multiple_choice 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;
-- Expected result: Only 'Easy', 'Medium', 'Hard' (all capitalized)

-- Check difficulty distribution in trivia_true_false
-- SELECT difficulty, COUNT(*) as count 
-- FROM trivia_true_false 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;
-- Expected result: Only 'Easy', 'Medium', 'Hard' (all capitalized)

-- Check difficulty distribution in trivia_who_am_i
-- SELECT difficulty, COUNT(*) as count 
-- FROM trivia_who_am_i 
-- WHERE difficulty IS NOT NULL
-- GROUP BY difficulty 
-- ORDER BY difficulty;
-- Expected result: Only 'Easy', 'Medium', 'Hard' (all capitalized)

-- Check for any invalid difficulty values (not Easy, Medium, Hard, or NULL)
-- SELECT 'trivia_multiple_choice' as table_name, difficulty, COUNT(*) as count
-- FROM trivia_multiple_choice
-- WHERE difficulty IS NOT NULL 
--   AND difficulty NOT IN ('Easy', 'Medium', 'Hard')
-- GROUP BY difficulty
-- UNION ALL
-- SELECT 'trivia_true_false' as table_name, difficulty, COUNT(*) as count
-- FROM trivia_true_false
-- WHERE difficulty IS NOT NULL 
--   AND difficulty NOT IN ('Easy', 'Medium', 'Hard')
-- GROUP BY difficulty
-- UNION ALL
-- SELECT 'trivia_who_am_i' as table_name, difficulty, COUNT(*) as count
-- FROM trivia_who_am_i
-- WHERE difficulty IS NOT NULL 
--   AND difficulty NOT IN ('Easy', 'Medium', 'Hard')
-- GROUP BY difficulty;
-- Expected result: No rows (empty result set)

