-- Migration: Add content_status column to source_content_ingested
-- Date: 2025-01-16
-- Description: Add content_status column to track if content is active or archived
--              Archived content should be filtered out from live content feeds
--              Only content that has been used in ALL 7 categories should be archivable

BEGIN;

-- Add content_status column with default 'active'
ALTER TABLE public.source_content_ingested
  ADD COLUMN IF NOT EXISTS content_status TEXT DEFAULT 'active' NOT NULL;

-- Add CHECK constraint to ensure only valid statuses
ALTER TABLE public.source_content_ingested
  ADD CONSTRAINT source_content_ingested_content_status_check
  CHECK (content_status IN ('active', 'archived'));

-- Create index for filtering archived content (partial index for active content)
CREATE INDEX IF NOT EXISTS idx_source_content_ingested_content_status
  ON public.source_content_ingested(content_status)
  WHERE content_status = 'active';

-- Add comment
COMMENT ON COLUMN public.source_content_ingested.content_status IS 
  'Status of the content: active (visible in feeds) or archived (hidden from live feeds). Content should only be archived after being used in all 7 content types (wisdom, greeting, motivational, stat, multiple-choice, true-false, who-am-i).';

COMMIT;

