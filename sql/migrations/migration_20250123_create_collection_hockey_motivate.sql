-- Migration: Create collection_hockey_motivate table
-- Date: 2025-01-23
-- Description: 
--   Creates collection_hockey_motivate table for storing hockey motivational quotes generated via M-Gen.
--   This table stores motivational content with quote, theme, category, attribution, and source tracking.

BEGIN;

-- ========================================================================
-- STEP 1: Create collection_hockey_motivate table
-- ========================================================================

-- Drop table if it already exists (to allow re-running migration)
DROP TABLE IF EXISTS public.collection_hockey_motivate CASCADE;

-- Create collection_hockey_motivate table
CREATE TABLE public.collection_hockey_motivate (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Motivational content
  quote TEXT NOT NULL,
  
  -- Categorization
  theme TEXT,
  category TEXT,
  attribution TEXT,
  
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
CREATE INDEX IF NOT EXISTS idx_collection_hockey_motivate_source_content_id 
  ON public.collection_hockey_motivate(source_content_id);

-- Index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_collection_hockey_motivate_status 
  ON public.collection_hockey_motivate(status);

-- Index on theme for filtering by theme
CREATE INDEX IF NOT EXISTS idx_collection_hockey_motivate_theme 
  ON public.collection_hockey_motivate(theme);

-- Index on category for filtering by category
CREATE INDEX IF NOT EXISTS idx_collection_hockey_motivate_category 
  ON public.collection_hockey_motivate(category);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_collection_hockey_motivate_created_at 
  ON public.collection_hockey_motivate(created_at DESC);

-- ========================================================================
-- STEP 3: Create trigger for updated_at
-- ========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_hockey_motivate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_collection_hockey_motivate_updated_at
  BEFORE UPDATE ON public.collection_hockey_motivate
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_hockey_motivate_updated_at();

-- ========================================================================
-- STEP 4: Add comments for documentation
-- ========================================================================

COMMENT ON TABLE public.collection_hockey_motivate IS 
  'Storage table for hockey motivational quotes generated via M-Gen system';

COMMENT ON COLUMN public.collection_hockey_motivate.id IS 
  'Primary key identifier';

COMMENT ON COLUMN public.collection_hockey_motivate.quote IS 
  'The motivational quote content';

COMMENT ON COLUMN public.collection_hockey_motivate.theme IS 
  'Theme classification for the motivational quote';

COMMENT ON COLUMN public.collection_hockey_motivate.category IS 
  'Category classification for the motivational quote';

COMMENT ON COLUMN public.collection_hockey_motivate.attribution IS 
  'Attribution/author information for the motivational quote';

COMMENT ON COLUMN public.collection_hockey_motivate.status IS 
  'Status of the motivational quote (draft, published, archived)';

COMMENT ON COLUMN public.collection_hockey_motivate.source_content_id IS 
  'Reference to the source content that was used to generate this motivational quote';

COMMENT ON COLUMN public.collection_hockey_motivate.created_at IS 
  'Timestamp when the motivational quote was created';

COMMENT ON COLUMN public.collection_hockey_motivate.updated_at IS 
  'Timestamp when the motivational quote was last updated';

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
--   AND table_name = 'collection_hockey_motivate'
-- ORDER BY ordinal_position;

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'collection_hockey_motivate'
-- ORDER BY indexname;

