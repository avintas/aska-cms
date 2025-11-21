-- Migration: Convert draft status to unpublished
-- Date: 2025-01-20
-- Description: Converts all items with status 'draft' to 'unpublished' 
--              in collection_motivational and collection_facts tables
--              This aligns with the ContentStatus type which only allows 'unpublished' | 'published'

BEGIN;

-- Convert draft to unpublished in collection_motivational
UPDATE public.collection_motivational
SET 
  status = 'unpublished',
  updated_at = NOW()
WHERE status = 'draft';

-- Get count of updated motivational items
DO $$
DECLARE
  motivational_count INTEGER;
BEGIN
  GET DIAGNOSTICS motivational_count = ROW_COUNT;
  RAISE NOTICE 'Updated % motivational items from draft to unpublished', motivational_count;
END $$;

-- Convert draft to unpublished in collection_facts
UPDATE public.collection_facts
SET 
  status = 'unpublished',
  updated_at = NOW()
WHERE status = 'draft';

-- Get count of updated facts items
DO $$
DECLARE
  facts_count INTEGER;
BEGIN
  GET DIAGNOSTICS facts_count = ROW_COUNT;
  RAISE NOTICE 'Updated % facts items from draft to unpublished', facts_count;
END $$;

COMMIT;

