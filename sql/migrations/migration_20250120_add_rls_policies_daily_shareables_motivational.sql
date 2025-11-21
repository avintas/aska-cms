-- Migration: Add RLS policies for daily_shareables_motivational table (authenticated users only)
-- Date: 2025-01-20
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE daily shareables schedules.
--   This is more secure than using service role key as it validates user sessions.

-- Enable RLS on daily_shareables_motivational table (if not already enabled)
ALTER TABLE public.daily_shareables_motivational ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select daily shareables motivational" ON public.daily_shareables_motivational;
DROP POLICY IF EXISTS "Authenticated users can insert daily shareables motivational" ON public.daily_shareables_motivational;
DROP POLICY IF EXISTS "Authenticated users can update daily shareables motivational" ON public.daily_shareables_motivational;
DROP POLICY IF EXISTS "Authenticated users can delete daily shareables motivational" ON public.daily_shareables_motivational;

-- Policy: Allow authenticated users to SELECT all daily shareables
CREATE POLICY "Authenticated users can select daily shareables motivational"
ON public.daily_shareables_motivational
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT daily shareables
CREATE POLICY "Authenticated users can insert daily shareables motivational"
ON public.daily_shareables_motivational
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE daily shareables
CREATE POLICY "Authenticated users can update daily shareables motivational"
ON public.daily_shareables_motivational
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE daily shareables
CREATE POLICY "Authenticated users can delete daily shareables motivational"
ON public.daily_shareables_motivational
FOR DELETE
TO authenticated
USING (true);

