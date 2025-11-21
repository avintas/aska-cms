-- Migration: Add public read policy for pub_shareables_facts
-- Date: 2025-01-20
-- Description: Allows anonymous/public users to read published facts shareable sets
--              This enables the web app (onlyhockey.com) to fetch published content

BEGIN;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read published facts shareables" ON public.pub_shareables_facts;

-- Policy: Allow anonymous and authenticated users to SELECT published shareables
CREATE POLICY "Public can read published facts shareables"
ON public.pub_shareables_facts
FOR SELECT
TO anon, authenticated
USING (status = 'published');

COMMENT ON POLICY "Public can read published facts shareables" ON public.pub_shareables_facts IS 
  'Allows public (anon) and authenticated users to read published facts shareable sets. Used by the web app (onlyhockey.com) to display content.';

COMMIT;

