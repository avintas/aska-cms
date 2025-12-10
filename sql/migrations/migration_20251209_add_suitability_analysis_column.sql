-- Migration: Add suitability_analysis JSONB column to source_content_ingested table
-- Date: 2025-12-09
-- Description: 
--   Adds a dedicated JSONB column `suitability_analysis` to the `source_content_ingested` table.
--   This column will store Gemini suitability analysis results separately from the general metadata,
--   enabling efficient querying and filtering of sources based on content type suitability.
--   
--   The suitability_analysis JSONB structure:
--   {
--     "multiple_choice_trivia": { "suitable": boolean, "confidence": number, "reasoning": string },
--     "true_false_trivia": { "suitable": boolean, "confidence": number, "reasoning": string },
--     "who_am_i_trivia": { "suitable": boolean, "confidence": number, "reasoning": string },
--     "motivational": { "suitable": boolean, "confidence": number, "reasoning": string },
--     "facts": { "suitable": boolean, "confidence": number, "reasoning": string },
--     "wisdom": { "suitable": boolean, "confidence": number, "reasoning": string }
--   }

BEGIN;

-- ========================================================================
-- STEP 1: Add suitability_analysis JSONB column
-- ========================================================================

-- Add the new column (nullable, as existing records won't have analysis)
ALTER TABLE public.source_content_ingested
ADD COLUMN IF NOT EXISTS suitability_analysis JSONB DEFAULT NULL;

-- ========================================================================
-- STEP 2: Migrate existing data from metadata.suitability_analysis
-- ========================================================================

-- Migrate any existing suitability_analysis data from metadata JSONB to the new column
-- This handles cases where analysis was previously stored in metadata.suitability_analysis
UPDATE public.source_content_ingested
SET suitability_analysis = (metadata->>'suitability_analysis')::jsonb
WHERE metadata IS NOT NULL 
  AND metadata ? 'suitability_analysis'
  AND (metadata->>'suitability_analysis') IS NOT NULL
  AND suitability_analysis IS NULL;

-- ========================================================================
-- STEP 3: Create GIN index for efficient JSONB queries
-- ========================================================================

-- Create GIN index to enable efficient querying of suitability_analysis JSONB
-- This allows queries like: WHERE suitability_analysis->'multiple_choice_trivia'->>'suitable' = 'true'
CREATE INDEX IF NOT EXISTS idx_source_content_ingested_suitability_analysis 
  ON public.source_content_ingested USING GIN (suitability_analysis);

-- ========================================================================
-- STEP 4: Add column comment for documentation
-- ========================================================================

COMMENT ON COLUMN public.source_content_ingested.suitability_analysis IS 
  'Gemini AI analysis of content suitability for different content types (multiple_choice_trivia, true_false_trivia, who_am_i_trivia, motivational, facts, wisdom). Each content type includes suitable (boolean), confidence (0.0-1.0), and reasoning (string) fields.';

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify column was added
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'source_content_ingested'
--   AND column_name = 'suitability_analysis';

-- Verify index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'source_content_ingested'
--   AND indexname = 'idx_source_content_ingested_suitability_analysis';

-- Check migration results (count records with suitability_analysis)
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(suitability_analysis) as records_with_analysis,
--   COUNT(*) FILTER (WHERE suitability_analysis IS NOT NULL) as non_null_count
-- FROM public.source_content_ingested;

-- Example query: Find sources suitable for multiple choice trivia
-- SELECT id, title, theme, suitability_analysis->'multiple_choice_trivia'->>'suitable' as mc_suitable
-- FROM public.source_content_ingested
-- WHERE suitability_analysis->'multiple_choice_trivia'->>'suitable' = 'true'
-- LIMIT 10;

COMMIT;

