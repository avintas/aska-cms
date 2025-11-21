-- Migration: Create collection_facts table
-- Date: 2025-01-21
-- Description: 
--   Creates collection_facts table with same structure as collection_stats
--   but using fact_text, fact_value, fact_category column names instead of stat_*
--   This is a parallel implementation to collection_stats, allowing both to coexist

BEGIN;

-- ========================================================================
-- STEP 1: Create collection_facts table
-- ========================================================================

-- Drop table if it already exists (to allow re-running migration)
DROP TABLE IF EXISTS public.collection_facts CASCADE;

-- Create collection_facts table
CREATE TABLE public.collection_facts (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Fact-specific columns (using fact_* naming instead of stat_*)
  fact_text TEXT NOT NULL,
  fact_value TEXT,
  fact_category TEXT,
  year INTEGER,
  
  -- Standard content fields (shared across all collection tables)
  status TEXT,
  theme TEXT,
  category TEXT,
  attribution TEXT,
  source_content_id INTEGER,
  used_in TEXT[],
  display_order INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- ========================================================================
-- STEP 2: Create indexes for performance
-- ========================================================================

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_collection_facts_status ON public.collection_facts(status);

-- Index on published_at for sorting published content
CREATE INDEX IF NOT EXISTS idx_collection_facts_published_at ON public.collection_facts(published_at);

-- Index on source_content_id for tracking source usage
CREATE INDEX IF NOT EXISTS idx_collection_facts_source_content_id ON public.collection_facts(source_content_id);

-- Index on theme for filtering
CREATE INDEX IF NOT EXISTS idx_collection_facts_theme ON public.collection_facts(theme);

-- Index on fact_category for filtering
CREATE INDEX IF NOT EXISTS idx_collection_facts_category ON public.collection_facts(fact_category);

-- Index on year for filtering
CREATE INDEX IF NOT EXISTS idx_collection_facts_year ON public.collection_facts(year);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_collection_facts_created_at ON public.collection_facts(created_at DESC);

-- ========================================================================
-- STEP 3: Create updated_at trigger function (if not exists)
-- ========================================================================

-- This function updates the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_collection_facts_updated_at ON public.collection_facts;
CREATE TRIGGER update_collection_facts_updated_at
  BEFORE UPDATE ON public.collection_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- STEP 4: Add comments for documentation
-- ========================================================================

COMMENT ON TABLE public.collection_facts IS 'Hockey facts collection - parallel to collection_stats, using fact_* column naming';
COMMENT ON COLUMN public.collection_facts.fact_text IS 'The main fact text content';
COMMENT ON COLUMN public.collection_facts.fact_value IS 'Optional numeric value or highlight';
COMMENT ON COLUMN public.collection_facts.fact_category IS 'Category of fact: player, team, league, historical, etc.';
COMMENT ON COLUMN public.collection_facts.year IS 'Year associated with the fact';
COMMENT ON COLUMN public.collection_facts.status IS 'Content status: draft, published, archived';
COMMENT ON COLUMN public.collection_facts.source_content_id IS 'Reference to source_content_ingested.id if generated from source';
COMMENT ON COLUMN public.collection_facts.used_in IS 'Array of places where this fact has been used';

COMMIT;

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
--   AND table_name = 'collection_facts'
-- ORDER BY ordinal_position;

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'collection_facts'
-- ORDER BY indexname;

