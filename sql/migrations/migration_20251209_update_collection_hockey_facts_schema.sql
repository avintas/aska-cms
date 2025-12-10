-- Migration: Update collection_hockey_facts table schema to match code expectations
-- Date: 2025-12-09
-- Description: 
--   Updates collection_hockey_facts table to include all columns expected by the code:
--   - Renames 'text' to 'fact_text'
--   - Adds 'fact_value', 'fact_category', 'year', 'attribution' columns
--   - Ensures compatibility with FactCreateInput interface

BEGIN;

-- ========================================================================
-- STEP 1: Rename 'text' column to 'fact_text'
-- ========================================================================

-- Check if 'text' column exists and rename it to 'fact_text'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'collection_hockey_facts' 
      AND column_name = 'text'
  ) THEN
    ALTER TABLE public.collection_hockey_facts 
    RENAME COLUMN text TO fact_text;
    
    RAISE NOTICE 'Renamed column "text" to "fact_text"';
  ELSE
    RAISE NOTICE 'Column "text" does not exist, skipping rename';
  END IF;
END $$;

-- ========================================================================
-- STEP 2: Add missing columns
-- ========================================================================

-- Add fact_value column (nullable TEXT)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS fact_value TEXT;

-- Add fact_category column (nullable TEXT)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS fact_category TEXT;

-- Add year column (nullable INTEGER)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Note: attribution is NOT added - collection_hockey_facts does not use attribution field

-- Add StandardContentFields columns
-- Add used_in column (nullable TEXT array)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS used_in TEXT[];

-- Add display_order column (nullable INTEGER)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Add published_at column (nullable TIMESTAMP)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add archived_at column (nullable TIMESTAMP)
ALTER TABLE public.collection_hockey_facts
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- ========================================================================
-- STEP 3: Add indexes for new columns (if needed)
-- ========================================================================

-- Index on year for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_year 
  ON public.collection_hockey_facts(year);

-- Index on fact_category for filtering
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_fact_category 
  ON public.collection_hockey_facts(fact_category);

-- ========================================================================
-- STEP 4: Update column comments
-- ========================================================================

COMMENT ON COLUMN public.collection_hockey_facts.fact_text IS 
  'The fact content/text (primary fact statement)';

COMMENT ON COLUMN public.collection_hockey_facts.fact_value IS 
  'Optional numerical value or metric associated with the fact';

COMMENT ON COLUMN public.collection_hockey_facts.fact_category IS 
  'Category classification specific to facts (distinct from general category)';

COMMENT ON COLUMN public.collection_hockey_facts.year IS 
  'Year associated with the fact (e.g., season year, record year)';

COMMENT ON COLUMN public.collection_hockey_facts.used_in IS 
  'Array of places where this fact has been used';

COMMENT ON COLUMN public.collection_hockey_facts.display_order IS 
  'Order for displaying facts in lists';

COMMENT ON COLUMN public.collection_hockey_facts.published_at IS 
  'Timestamp when the fact was published';

COMMENT ON COLUMN public.collection_hockey_facts.archived_at IS 
  'Timestamp when the fact was archived';

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify table structure
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'collection_hockey_facts'
-- ORDER BY ordinal_position;

-- Expected columns after migration:
-- id (SERIAL PRIMARY KEY)
-- fact_text (TEXT NOT NULL) -- renamed from 'text'
-- category (TEXT)
-- theme (TEXT)
-- status (TEXT DEFAULT 'draft')
-- source_content_id (INTEGER)
-- created_at (TIMESTAMP WITH TIME ZONE)
-- updated_at (TIMESTAMP WITH TIME ZONE)
-- fact_value (TEXT) -- NEW
-- fact_category (TEXT) -- NEW
-- year (INTEGER) -- NEW
-- Note: attribution is NOT included - facts table does not use attribution
-- used_in (TEXT[]) -- NEW (StandardContentFields)
-- display_order (INTEGER) -- NEW (StandardContentFields)
-- published_at (TIMESTAMP WITH TIME ZONE) -- NEW (StandardContentFields)
-- archived_at (TIMESTAMP WITH TIME ZONE) -- NEW (StandardContentFields)

COMMIT;

