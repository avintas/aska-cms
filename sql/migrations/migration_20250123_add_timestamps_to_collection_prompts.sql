-- Migration: Add created_at and updated_at to collection_prompts table
-- Date: 2025-01-23
-- Description: 
--   Adds timestamp tracking fields (created_at, updated_at) to collection_prompts table
--   for consistency with other collection tables and better audit tracking.

BEGIN;

-- ========================================================================
-- STEP 1: Add timestamp columns
-- ========================================================================

-- Add created_at column
ALTER TABLE public.collection_prompts
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column
ALTER TABLE public.collection_prompts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set default values for existing rows (if any)
UPDATE public.collection_prompts
SET 
  created_at = NOW(),
  updated_at = NOW()
WHERE created_at IS NULL OR updated_at IS NULL;

-- ========================================================================
-- STEP 2: Create trigger function for updated_at
-- ========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- STEP 3: Create trigger for updated_at
-- ========================================================================

-- Drop trigger if it exists (to allow re-running migration)
DROP TRIGGER IF EXISTS trigger_update_collection_prompts_updated_at ON public.collection_prompts;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_collection_prompts_updated_at
  BEFORE UPDATE ON public.collection_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_prompts_updated_at();

-- ========================================================================
-- STEP 4: Add comments for documentation
-- ========================================================================

COMMENT ON COLUMN public.collection_prompts.created_at IS 
  'Timestamp when the prompt was created';

COMMENT ON COLUMN public.collection_prompts.updated_at IS 
  'Timestamp when the prompt was last updated (auto-updated on changes)';

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify columns were added
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'collection_prompts'
--   AND column_name IN ('created_at', 'updated_at')
-- ORDER BY ordinal_position;

-- Verify trigger was created
-- SELECT 
--   trigger_name, 
--   event_manipulation, 
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
--   AND trigger_name = 'trigger_update_collection_prompts_updated_at';

COMMIT;




