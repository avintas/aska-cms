-- Migration: Copy data from collection_stats to collection_facts
-- Date: 2025-01-21
-- Description: 
--   Copies all existing data from collection_stats to collection_facts
--   Maps column names: stat_text → fact_text, stat_value → fact_value, stat_category → fact_category
--   Preserves all other fields including IDs, timestamps, and relationships

BEGIN;

-- ========================================================================
-- STEP 1: Verify source table exists and has data
-- ========================================================================

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Check if collection_stats exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'collection_stats'
  ) THEN
    RAISE EXCEPTION 'Source table collection_stats does not exist';
  END IF;
  
  -- Get row count
  SELECT COUNT(*) INTO row_count FROM public.collection_stats;
  
  IF row_count = 0 THEN
    RAISE NOTICE 'Source table collection_stats is empty - nothing to copy';
  ELSE
    RAISE NOTICE 'Found % rows in collection_stats to copy', row_count;
  END IF;
END $$;

-- ========================================================================
-- STEP 2: Copy data with column mapping
-- ========================================================================

-- Insert all data from collection_stats into collection_facts
-- Mapping: stat_text → fact_text, stat_value → fact_value, stat_category → fact_category
INSERT INTO public.collection_facts (
  id,
  fact_text,
  fact_value,
  fact_category,
  year,
  status,
  theme,
  category,
  attribution,
  source_content_id,
  used_in,
  display_order,
  created_at,
  updated_at,
  published_at,
  archived_at
)
SELECT 
  id,
  stat_text AS fact_text,
  stat_value AS fact_value,
  stat_category AS fact_category,
  year,
  status,
  theme,
  category,
  attribution,
  source_content_id,
  used_in,
  display_order,
  created_at,
  updated_at,
  published_at,
  archived_at
FROM public.collection_stats
ON CONFLICT (id) DO NOTHING;  -- Skip if ID already exists (allows re-running)

-- ========================================================================
-- STEP 3: Update sequence to prevent ID conflicts
-- ========================================================================

-- Set the sequence to the maximum ID value to prevent conflicts
DO $$
DECLARE
  max_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.collection_facts;
  
  -- Update the sequence to start after the max ID
  IF max_id > 0 THEN
    PERFORM setval('collection_facts_id_seq', max_id, true);
    RAISE NOTICE 'Updated collection_facts_id_seq to %', max_id;
  END IF;
END $$;

-- ========================================================================
-- STEP 4: Verification
-- ========================================================================

DO $$
DECLARE
  source_count BIGINT;
  target_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO source_count FROM public.collection_stats;
  SELECT COUNT(*) INTO target_count FROM public.collection_facts;
  
  IF source_count != target_count THEN
    RAISE WARNING 'Row count mismatch: collection_stats has % rows, collection_facts has % rows', source_count, target_count;
  ELSE
    RAISE NOTICE 'Migration successful: Copied % rows from collection_stats to collection_facts', source_count;
  END IF;
END $$;

COMMIT;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Compare row counts
-- SELECT 
--   'collection_stats' as table_name, 
--   COUNT(*) as row_count 
-- FROM public.collection_stats
-- UNION ALL
-- SELECT 
--   'collection_facts' as table_name, 
--   COUNT(*) as row_count 
-- FROM public.collection_facts;

-- Sample data comparison
-- SELECT 
--   s.id,
--   s.stat_text as stats_text,
--   f.fact_text as facts_text,
--   s.stat_value as stats_value,
--   f.fact_value as facts_value
-- FROM public.collection_stats s
-- LEFT JOIN public.collection_facts f ON s.id = f.id
-- LIMIT 10;

-- Check for any missing data
-- SELECT s.id, s.stat_text
-- FROM public.collection_stats s
-- LEFT JOIN public.collection_facts f ON s.id = f.id
-- WHERE f.id IS NULL;

