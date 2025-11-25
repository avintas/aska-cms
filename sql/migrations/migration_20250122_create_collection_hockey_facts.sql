-- Migration: Create collection_hockey_facts table
-- Date: 2025-01-22
-- Description: 
--   Creates collection_hockey_facts table for storing hockey facts generated via F-Gen.
--   This table stores fact content with text, category, theme, and source tracking.

BEGIN;

-- ========================================================================
-- STEP 1: Create collection_hockey_facts table
-- ========================================================================

-- Drop table if it already exists (to allow re-running migration)
DROP TABLE IF EXISTS public.collection_hockey_facts CASCADE;

-- Create collection_hockey_facts table
CREATE TABLE public.collection_hockey_facts (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Fact content
  text TEXT NOT NULL,
  
  -- Categorization
  category TEXT,
  theme TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'draft',
  
  -- Source tracking
  source_content_id INTEGER REFERENCES public.source_content_ingested(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- STEP 2: Create indexes for performance
-- ========================================================================

-- Index on source_content_id for filtering by source
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_source_content_id 
  ON public.collection_hockey_facts(source_content_id);

-- Index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_status 
  ON public.collection_hockey_facts(status);

-- Index on theme for filtering by theme
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_theme 
  ON public.collection_hockey_facts(theme);

-- Index on category for filtering by category
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_category 
  ON public.collection_hockey_facts(category);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_collection_hockey_facts_created_at 
  ON public.collection_hockey_facts(created_at DESC);

-- ========================================================================
-- STEP 3: Create trigger for updated_at
-- ========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_hockey_facts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_collection_hockey_facts_updated_at
  BEFORE UPDATE ON public.collection_hockey_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_hockey_facts_updated_at();

-- ========================================================================
-- STEP 4: Add comments for documentation
-- ========================================================================

COMMENT ON TABLE public.collection_hockey_facts IS 
  'Storage table for hockey facts generated via F-Gen system';

COMMENT ON COLUMN public.collection_hockey_facts.id IS 
  'Primary key identifier';

COMMENT ON COLUMN public.collection_hockey_facts.text IS 
  'The fact content/text';

COMMENT ON COLUMN public.collection_hockey_facts.category IS 
  'Category classification for the fact';

COMMENT ON COLUMN public.collection_hockey_facts.theme IS 
  'Theme classification for the fact';

COMMENT ON COLUMN public.collection_hockey_facts.status IS 
  'Status of the fact (draft, published, archived)';

COMMENT ON COLUMN public.collection_hockey_facts.source_content_id IS 
  'Reference to the source content that was used to generate this fact';

COMMENT ON COLUMN public.collection_hockey_facts.created_at IS 
  'Timestamp when the fact was created';

COMMENT ON COLUMN public.collection_hockey_facts.updated_at IS 
  'Timestamp when the fact was last updated';

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
--   AND table_name = 'collection_hockey_facts'
-- ORDER BY ordinal_position;

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'collection_hockey_facts'
-- ORDER BY indexname;

