-- Migration: Update NULL status values to 'draft' in collection_greetings table
-- Date: 2025-01-07
-- Description: Sets all NULL status values to 'draft' to ensure consistency with UI display logic

-- Update all records where status IS NULL to 'draft'
UPDATE collection_greetings
SET status = 'draft'
WHERE status IS NULL;

-- Verify the update (you can run this query to check results)
-- SELECT COUNT(*) as null_count FROM collection_greetings WHERE status IS NULL;
-- Expected result: 0

-- Check status distribution after update
-- SELECT status, COUNT(*) as count FROM collection_greetings GROUP BY status;

