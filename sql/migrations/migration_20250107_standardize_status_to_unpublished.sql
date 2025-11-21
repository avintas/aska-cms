-- Migration: Standardize status values to 'unpublished' or 'published' in collection_greetings table
-- Date: 2025-01-07
-- Description: 
--   - Updates all 'draft' status values to 'unpublished'
--   - Updates all 'archived' status values to 'unpublished'
--   - Updates all NULL status values to 'unpublished'
--   This standardizes to a 2-state system: unpublished or published

-- Update all 'draft' status to 'unpublished'
UPDATE collection_greetings
SET status = 'unpublished'
WHERE status = 'draft';

-- Update all 'archived' status to 'unpublished'
UPDATE collection_greetings
SET status = 'unpublished'
WHERE status = 'archived';

-- Update all NULL status to 'unpublished'
UPDATE collection_greetings
SET status = 'unpublished'
WHERE status IS NULL;

-- Verify the update (you can run these queries to check results)
-- Check that there are no more 'draft' or 'archived' statuses
-- SELECT COUNT(*) as draft_count FROM collection_greetings WHERE status = 'draft';
-- SELECT COUNT(*) as archived_count FROM collection_greetings WHERE status = 'archived';
-- SELECT COUNT(*) as null_count FROM collection_greetings WHERE status IS NULL;
-- Expected results: 0 for all three queries

-- Check status distribution after update
-- SELECT status, COUNT(*) as count FROM collection_greetings GROUP BY status;
-- Expected result: Only 'unpublished' and 'published' statuses

