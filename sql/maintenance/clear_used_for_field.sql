-- Clear the used_for field from source_content_ingested table
-- This should be run after truncating generated content tables
-- to ensure usage badges reflect the current state
--
-- Run this in Supabase SQL editor or any psql session connected to the DB.

BEGIN;

-- Clear the used_for field for all records
UPDATE public.source_content_ingested
SET used_for = NULL
WHERE used_for IS NOT NULL;

-- Verify the update
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.source_content_ingested
  WHERE used_for IS NOT NULL;
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Warning: % records still have used_for values', remaining_count;
  ELSE
    RAISE NOTICE 'Success: All used_for fields cleared';
  END IF;
END $$;

COMMIT;

