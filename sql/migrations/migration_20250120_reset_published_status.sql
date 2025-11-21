-- Migration: Reset published status to unpublished
-- Date: 2025-01-20
-- Description: Resets all items with status 'published' to 'unpublished' 
--              in collection_motivational, collection_facts, collection_greetings, and collection_wisdom tables
--              This allows republishing items through the Publishing workflow

BEGIN;

-- Reset published status in collection_motivational
UPDATE public.collection_motivational
SET 
  status = 'unpublished',
  published_at = NULL,
  updated_at = NOW()
WHERE status = 'published';

-- Get count of updated motivational items
DO $$
DECLARE
  motivational_count INTEGER;
BEGIN
  GET DIAGNOSTICS motivational_count = ROW_COUNT;
  RAISE NOTICE 'Updated % motivational items from published to unpublished', motivational_count;
END $$;

-- Reset published status in collection_facts
UPDATE public.collection_facts
SET 
  status = 'unpublished',
  published_at = NULL,
  updated_at = NOW()
WHERE status = 'published';

-- Get count of updated facts items
DO $$
DECLARE
  facts_count INTEGER;
BEGIN
  GET DIAGNOSTICS facts_count = ROW_COUNT;
  RAISE NOTICE 'Updated % facts items from published to unpublished', facts_count;
END $$;

-- Reset published status in collection_greetings
UPDATE public.collection_greetings
SET 
  status = 'unpublished',
  published_at = NULL,
  updated_at = NOW()
WHERE status = 'published';

-- Get count of updated greetings items
DO $$
DECLARE
  greetings_count INTEGER;
BEGIN
  GET DIAGNOSTICS greetings_count = ROW_COUNT;
  RAISE NOTICE 'Updated % greetings items from published to unpublished', greetings_count;
END $$;

-- Reset published status in collection_wisdom
UPDATE public.collection_wisdom
SET 
  status = 'unpublished',
  published_at = NULL,
  updated_at = NOW()
WHERE status = 'published';

-- Get count of updated wisdom items
DO $$
DECLARE
  wisdom_count INTEGER;
BEGIN
  GET DIAGNOSTICS wisdom_count = ROW_COUNT;
  RAISE NOTICE 'Updated % wisdom items from published to unpublished', wisdom_count;
END $$;

COMMIT;

