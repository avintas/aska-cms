-- Migration: Add RLS policies for source_content_ingested table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT from source_content_ingested (for ContentBrowser).
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on source_content_ingested table (if not already enabled)
ALTER TABLE public.source_content_ingested ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select source content ingested" ON public.source_content_ingested;
DROP POLICY IF EXISTS "Authenticated users can insert source content ingested" ON public.source_content_ingested;
DROP POLICY IF EXISTS "Authenticated users can update source content ingested" ON public.source_content_ingested;
DROP POLICY IF EXISTS "Authenticated users can delete source content ingested" ON public.source_content_ingested;

-- Policy: Allow authenticated users to SELECT all ingested sources
CREATE POLICY "Authenticated users can select source content ingested"
ON public.source_content_ingested
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT ingested sources
CREATE POLICY "Authenticated users can insert source content ingested"
ON public.source_content_ingested
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE ingested sources
CREATE POLICY "Authenticated users can update source content ingested"
ON public.source_content_ingested
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE ingested sources
CREATE POLICY "Authenticated users can delete source content ingested"
ON public.source_content_ingested
FOR DELETE
TO authenticated
USING (true);

