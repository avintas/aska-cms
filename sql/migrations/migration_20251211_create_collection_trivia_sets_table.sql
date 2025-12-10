-- Migration: Create collection_trivia_sets table
-- Date: 2025-12-11
-- Description: 
--   Creates collection_trivia_sets table to store published trivia sets for daily deployment.
--   This table stores the full set content as JSONB snapshots, supporting mixed types (MC, TF, WAI).
--   One row per publish date, containing all sets published on that day.

BEGIN;

-- ========================================================================
-- STEP 1: Create collection_trivia_sets table
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.collection_trivia_sets (
  id BIGSERIAL PRIMARY KEY,
  
  -- The date these sets are scheduled to publish (ISO date string)
  publish_date DATE NOT NULL UNIQUE,
  
  -- Array of complete trivia sets stored as JSONB
  -- Each element: {"type": "mc"|"tf"|"wai", "set": {full set object}}
  -- Example: [{"type": "mc", "set": {id: 123, title: "...", question_data: [...], ...}}, ...]
  sets JSONB[] NOT NULL DEFAULT '{}',
  
  -- Number of sets in the collection (for quick reference)
  set_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata about the automated run
  run_status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'completed', 'partial', 'failed'
  run_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- STEP 2: Create indexes
-- ========================================================================

-- Index for querying by publish_date
CREATE INDEX IF NOT EXISTS idx_collection_trivia_sets_publish_date 
ON public.collection_trivia_sets(publish_date DESC);

-- Index for querying recent entries
CREATE INDEX IF NOT EXISTS idx_collection_trivia_sets_created_at 
ON public.collection_trivia_sets(created_at DESC);

-- GIN index on sets array for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_collection_trivia_sets_sets_gin 
ON public.collection_trivia_sets USING GIN (sets);

-- ========================================================================
-- STEP 3: Add comments
-- ========================================================================

COMMENT ON TABLE public.collection_trivia_sets IS 
'Stores published trivia sets for daily deployment by Automated Set Building System. Full set content is stored as JSONB snapshots, supporting mixed types (MC, TF, WAI). One row per publish date.';

COMMENT ON COLUMN public.collection_trivia_sets.publish_date IS 
'The date these sets are scheduled to publish (ISO date string, e.g., 2025-12-11)';

COMMENT ON COLUMN public.collection_trivia_sets.sets IS 
'Array of complete trivia sets stored as JSONB. Each element contains {"type": "mc"|"tf"|"wai", "set": {full set object}}. This is a snapshot of the set at publish time.';

COMMENT ON COLUMN public.collection_trivia_sets.set_count IS 
'Number of sets in the collection (length of sets array, stored for quick reference)';

COMMENT ON COLUMN public.collection_trivia_sets.run_status IS 
'Status of the automated run: completed (all sets created), partial (some sets created), failed (no sets created)';

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Check table was created
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public' 
--   AND table_name = 'collection_trivia_sets';

-- Check table structure
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'collection_trivia_sets'
-- ORDER BY ordinal_position;

-- Example query to find collections with MC sets
-- SELECT publish_date, set_count
-- FROM public.collection_trivia_sets
-- WHERE sets @> '[{"type": "mc"}]';

COMMIT;

