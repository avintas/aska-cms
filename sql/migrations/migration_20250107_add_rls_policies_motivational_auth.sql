-- Migration: Add RLS policies for collection_motivational table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE motivational.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on collection_motivational table (if not already enabled)
ALTER TABLE public.collection_motivational ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select motivational" ON public.collection_motivational;
DROP POLICY IF EXISTS "Authenticated users can insert motivational" ON public.collection_motivational;
DROP POLICY IF EXISTS "Authenticated users can update motivational" ON public.collection_motivational;
DROP POLICY IF EXISTS "Authenticated users can delete motivational" ON public.collection_motivational;

-- Policy: Allow authenticated users to SELECT all motivational
CREATE POLICY "Authenticated users can select motivational"
ON public.collection_motivational
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT motivational
CREATE POLICY "Authenticated users can insert motivational"
ON public.collection_motivational
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE motivational
CREATE POLICY "Authenticated users can update motivational"
ON public.collection_motivational
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE motivational
CREATE POLICY "Authenticated users can delete motivational"
ON public.collection_motivational
FOR DELETE
TO authenticated
USING (true);

