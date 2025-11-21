-- Migration: Add RLS policies for collection_stats table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE stats.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on collection_stats table (if not already enabled)
ALTER TABLE public.collection_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select stats" ON public.collection_stats;
DROP POLICY IF EXISTS "Authenticated users can insert stats" ON public.collection_stats;
DROP POLICY IF EXISTS "Authenticated users can update stats" ON public.collection_stats;
DROP POLICY IF EXISTS "Authenticated users can delete stats" ON public.collection_stats;

-- Policy: Allow authenticated users to SELECT all stats
CREATE POLICY "Authenticated users can select stats"
ON public.collection_stats
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT stats
CREATE POLICY "Authenticated users can insert stats"
ON public.collection_stats
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE stats
CREATE POLICY "Authenticated users can update stats"
ON public.collection_stats
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE stats
CREATE POLICY "Authenticated users can delete stats"
ON public.collection_stats
FOR DELETE
TO authenticated
USING (true);

