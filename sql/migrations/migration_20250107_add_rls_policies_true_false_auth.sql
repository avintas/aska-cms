-- Migration: Add RLS policies for trivia_true_false table (authenticated users only)
-- Date: 2025-01-07
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE true/false trivia.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on trivia_true_false table (if not already enabled)
ALTER TABLE public.trivia_true_false ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select true false trivia" ON public.trivia_true_false;
DROP POLICY IF EXISTS "Authenticated users can insert true false trivia" ON public.trivia_true_false;
DROP POLICY IF EXISTS "Authenticated users can update true false trivia" ON public.trivia_true_false;
DROP POLICY IF EXISTS "Authenticated users can delete true false trivia" ON public.trivia_true_false;

-- Policy: Allow authenticated users to SELECT all true/false trivia
CREATE POLICY "Authenticated users can select true false trivia"
ON public.trivia_true_false
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT true/false trivia
CREATE POLICY "Authenticated users can insert true false trivia"
ON public.trivia_true_false
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE true/false trivia
CREATE POLICY "Authenticated users can update true false trivia"
ON public.trivia_true_false
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE true/false trivia
CREATE POLICY "Authenticated users can delete true false trivia"
ON public.trivia_true_false
FOR DELETE
TO authenticated
USING (true);

