-- Migration: Add RLS policies for collection_wisdom table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE wisdom.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on collection_wisdom table (if not already enabled)
ALTER TABLE public.collection_wisdom ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select wisdom" ON public.collection_wisdom;
DROP POLICY IF EXISTS "Authenticated users can insert wisdom" ON public.collection_wisdom;
DROP POLICY IF EXISTS "Authenticated users can update wisdom" ON public.collection_wisdom;
DROP POLICY IF EXISTS "Authenticated users can delete wisdom" ON public.collection_wisdom;

-- Policy: Allow authenticated users to SELECT all wisdom
CREATE POLICY "Authenticated users can select wisdom"
ON public.collection_wisdom
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT wisdom
CREATE POLICY "Authenticated users can insert wisdom"
ON public.collection_wisdom
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE wisdom
CREATE POLICY "Authenticated users can update wisdom"
ON public.collection_wisdom
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE wisdom
CREATE POLICY "Authenticated users can delete wisdom"
ON public.collection_wisdom
FOR DELETE
TO authenticated
USING (true);

