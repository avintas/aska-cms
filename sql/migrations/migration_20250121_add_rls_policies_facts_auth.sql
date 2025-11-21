-- Migration: Add RLS policies for collection_facts table (authenticated users only)
-- Date: 2025-01-21
-- Description: 
--   Enables Row Level Security and adds policies to allow authenticated users
--   to SELECT, INSERT, UPDATE, and DELETE facts.
--   This mirrors the RLS policies for collection_stats for consistency.
--   This is more secure than using service role key as it validates user sessions.

BEGIN;

-- ========================================================================
-- STEP 1: Enable RLS on collection_facts table
-- ========================================================================

-- Enable RLS on collection_facts table (if not already enabled)
ALTER TABLE public.collection_facts ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- STEP 2: Drop existing policies if they exist (to avoid conflicts)
-- ========================================================================

DROP POLICY IF EXISTS "Authenticated users can select facts" ON public.collection_facts;
DROP POLICY IF EXISTS "Authenticated users can insert facts" ON public.collection_facts;
DROP POLICY IF EXISTS "Authenticated users can update facts" ON public.collection_facts;
DROP POLICY IF EXISTS "Authenticated users can delete facts" ON public.collection_facts;

-- ========================================================================
-- STEP 3: Create RLS policies
-- ========================================================================

-- Policy: Allow authenticated users to SELECT all facts
CREATE POLICY "Authenticated users can select facts"
ON public.collection_facts
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT facts
CREATE POLICY "Authenticated users can insert facts"
ON public.collection_facts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE facts
CREATE POLICY "Authenticated users can update facts"
ON public.collection_facts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE facts
CREATE POLICY "Authenticated users can delete facts"
ON public.collection_facts
FOR DELETE
TO authenticated
USING (true);

COMMIT;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify RLS is enabled
-- SELECT 
--   relname as table_name,
--   relrowsecurity as rls_enabled
-- FROM pg_class
-- WHERE relname = 'collection_facts';

-- Verify policies were created
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'collection_facts'
-- ORDER BY policyname;

