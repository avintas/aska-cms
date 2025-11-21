-- Migration: Add public read policy for pub_shareables_motivational
-- Date: 2025-01-20
-- Description: Allows anonymous/public users to read published motivational shareable sets
--              This enables the web app (onlyhockey.com) to fetch published content

BEGIN;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read published motivational shareables" ON public.pub_shareables_motivational;

-- Policy: Allow anonymous and authenticated users to SELECT published shareables
CREATE POLICY "Public can read published motivational shareables"
ON public.pub_shareables_motivational
FOR SELECT
TO anon, authenticated
USING (status = 'published');

COMMENT ON POLICY "Public can read published motivational shareables" ON public.pub_shareables_motivational IS 
  'Allows public (anon) and authenticated users to read published motivational shareable sets. Used by the web app (onlyhockey.com) to display content.';

COMMIT;

