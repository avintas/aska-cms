-- Migration: Add metadata_refreshed_at column to source_content_ingested table
-- Purpose: Track when source metadata has been manually refreshed via Source Content Updater
-- Date: 2025-01-16

-- Add metadata_refreshed_at column
ALTER TABLE public.source_content_ingested
ADD COLUMN IF NOT EXISTS metadata_refreshed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient queries (finding unprocessed sources)
CREATE INDEX IF NOT EXISTS idx_source_content_metadata_refreshed_at 
ON public.source_content_ingested(metadata_refreshed_at) 
WHERE metadata_refreshed_at IS NULL;

-- Add comment
COMMENT ON COLUMN public.source_content_ingested.metadata_refreshed_at IS 
'Timestamp when metadata (theme, tags, category, summary) was last refreshed via Source Content Updater. NULL indicates metadata needs refresh.';

