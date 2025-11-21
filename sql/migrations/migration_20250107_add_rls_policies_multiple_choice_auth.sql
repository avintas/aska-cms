-- Migration: Add RLS policies for trivia_multiple_choice table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE multiple choice trivia.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on trivia_multiple_choice table (if not already enabled)
ALTER TABLE public.trivia_multiple_choice ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select multiple choice trivia" ON public.trivia_multiple_choice;
DROP POLICY IF EXISTS "Authenticated users can insert multiple choice trivia" ON public.trivia_multiple_choice;
DROP POLICY IF EXISTS "Authenticated users can update multiple choice trivia" ON public.trivia_multiple_choice;
DROP POLICY IF EXISTS "Authenticated users can delete multiple choice trivia" ON public.trivia_multiple_choice;

-- Policy: Allow authenticated users to SELECT all multiple choice trivia
CREATE POLICY "Authenticated users can select multiple choice trivia"
ON public.trivia_multiple_choice
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT multiple choice trivia
CREATE POLICY "Authenticated users can insert multiple choice trivia"
ON public.trivia_multiple_choice
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE multiple choice trivia
CREATE POLICY "Authenticated users can update multiple choice trivia"
ON public.trivia_multiple_choice
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE multiple choice trivia
CREATE POLICY "Authenticated users can delete multiple choice trivia"
ON public.trivia_multiple_choice
FOR DELETE
TO authenticated
USING (true);

