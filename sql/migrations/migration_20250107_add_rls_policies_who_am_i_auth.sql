-- Migration: Add RLS policies for trivia_who_am_i table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE who am i trivia.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on trivia_who_am_i table (if not already enabled)
ALTER TABLE public.trivia_who_am_i ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select who am i trivia" ON public.trivia_who_am_i;
DROP POLICY IF EXISTS "Authenticated users can insert who am i trivia" ON public.trivia_who_am_i;
DROP POLICY IF EXISTS "Authenticated users can update who am i trivia" ON public.trivia_who_am_i;
DROP POLICY IF EXISTS "Authenticated users can delete who am i trivia" ON public.trivia_who_am_i;

-- Policy: Allow authenticated users to SELECT all who am i trivia
CREATE POLICY "Authenticated users can select who am i trivia"
ON public.trivia_who_am_i
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT who am i trivia
CREATE POLICY "Authenticated users can insert who am i trivia"
ON public.trivia_who_am_i
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE who am i trivia
CREATE POLICY "Authenticated users can update who am i trivia"
ON public.trivia_who_am_i
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE who am i trivia
CREATE POLICY "Authenticated users can delete who am i trivia"
ON public.trivia_who_am_i
FOR DELETE
TO authenticated
USING (true);

