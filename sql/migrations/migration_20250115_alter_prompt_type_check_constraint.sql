-- Migration: Alter prompt_type_check constraint to include content_suitability_analysis
-- Date: 2025-01-15
-- Description: 
--   Updates the check constraint on ai_extraction_prompts.prompt_type to allow
--   the new 'content_suitability_analysis' prompt type.

BEGIN;

-- ========================================================================
-- STEP 1: Drop the existing constraint
-- ========================================================================

ALTER TABLE public.ai_extraction_prompts
DROP CONSTRAINT IF EXISTS prompt_type_check;

-- ========================================================================
-- STEP 2: Add the updated constraint with the new prompt type
-- ========================================================================

ALTER TABLE public.ai_extraction_prompts
ADD CONSTRAINT prompt_type_check 
CHECK (
  prompt_type IN (
    'metadata_extraction',
    'content_enrichment',
    'content_suitability_analysis'
  )
);

COMMIT;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify constraint exists and allows the new type
-- SELECT 
--   conname as constraint_name,
--   pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'public.ai_extraction_prompts'::regclass
--   AND conname = 'prompt_type_check';

