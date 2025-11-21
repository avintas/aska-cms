-- Migration: Add RLS policies for collection_greetings table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE greetings.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on collection_greetings table (if not already enabled)
ALTER TABLE public.collection_greetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select greetings" ON public.collection_greetings;
DROP POLICY IF EXISTS "Authenticated users can insert greetings" ON public.collection_greetings;
DROP POLICY IF EXISTS "Authenticated users can update greetings" ON public.collection_greetings;
DROP POLICY IF EXISTS "Authenticated users can delete greetings" ON public.collection_greetings;

-- Policy: Allow authenticated users to SELECT all greetings
CREATE POLICY "Authenticated users can select greetings"
ON public.collection_greetings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT greetings
CREATE POLICY "Authenticated users can insert greetings"
ON public.collection_greetings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE greetings
CREATE POLICY "Authenticated users can update greetings"
ON public.collection_greetings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE greetings
CREATE POLICY "Authenticated users can delete greetings"
ON public.collection_greetings
FOR DELETE
TO authenticated
USING (true);

