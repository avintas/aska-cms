-- Migration: Set all status values to 'unpublished' in collection_greetings table
-- Date: 2025-01-07
-- Description: 
--   Sets all status values in collection_greetings to 'unpublished'
--   This resets all greetings to unpublished state regardless of current status

-- Update all statuses to 'unpublished'
UPDATE collection_greetings
SET status = 'unpublished',
    published_at = NULL,
    archived_at = NULL,
    updated_at = NOW()
WHERE status != 'unpublished' OR status IS NULL;

-- Alternative approach: Update everything unconditionally (uncomment if needed)
-- UPDATE collection_greetings
-- SET status = 'unpublished',
--     published_at = NULL,
--     archived_at = NULL,
--     updated_at = NOW();

-- Verify the update (you can run these queries to check results)
-- Check that all statuses are now 'unpublished'
-- SELECT status, COUNT(*) as count FROM collection_greetings GROUP BY status;
-- Expected result: Only 'unpublished' status, count should equal total number of rows

-- Check that published_at and archived_at are NULL
-- SELECT COUNT(*) as published_count FROM collection_greetings WHERE published_at IS NOT NULL;
-- SELECT COUNT(*) as archived_count FROM collection_greetings WHERE archived_at IS NOT NULL;
-- Expected results: 0 for both queries

