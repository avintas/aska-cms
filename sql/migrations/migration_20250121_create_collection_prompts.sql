-- Migration: Create collection_prompts table
-- Date: 2025-01-21
-- Description: 
--   Creates collection_prompts table for storing multiple prompt templates/definitions.
--   This table allows managing a collection of prompts for various content generation purposes.

BEGIN;

-- ========================================================================
-- STEP 1: Create collection_prompts table
-- ========================================================================

-- Drop table if it already exists (to allow re-running migration)
DROP TABLE IF EXISTS public.collection_prompts CASCADE;

-- Create collection_prompts table
CREATE TABLE public.collection_prompts (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Prompt identification
  prompt_name TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  
  -- Categorization
  content_type TEXT
);

-- ========================================================================
-- STEP 2: Create indexes for performance
-- ========================================================================

-- Index on content_type for filtering by content type
CREATE INDEX IF NOT EXISTS idx_collection_prompts_content_type 
  ON public.collection_prompts(content_type);

-- Index on prompt_name for searching by name
CREATE INDEX IF NOT EXISTS idx_collection_prompts_prompt_name 
  ON public.collection_prompts(prompt_name);

-- ========================================================================
-- STEP 3: Add comments for documentation
-- ========================================================================

COMMENT ON TABLE public.collection_prompts IS 
  'Storage table for multiple prompt templates/definitions used for content generation';

COMMENT ON COLUMN public.collection_prompts.prompt_name IS 
  'Name/identifier for the prompt (e.g., "Penalty Box Philosopher", "Wisdom Generator v1")';

COMMENT ON COLUMN public.collection_prompts.prompt_content IS 
  'The actual prompt text/template that will be sent to the AI model';

COMMENT ON COLUMN public.collection_prompts.content_type IS 
  'Type of content this prompt generates (e.g., "wisdom", "greeting", "fact")';

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
--   AND table_name = 'collection_prompts'
-- ORDER BY ordinal_position;

-- Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'collection_prompts'
-- ORDER BY indexname;
