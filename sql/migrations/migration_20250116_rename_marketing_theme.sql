-- Migration: Rename Marketing theme to avoid ampersand
-- Date: 2025-01-16
-- Description: Rename "Marketing, Sponsorship, & Merchandising" to "Marketing, Sponsorship, and Merchandising"
--              to avoid special characters that can cause encoding issues

BEGIN;

-- Step 1: First, drop the old constraint temporarily so we can update data
-- This allows us to update rows even if they violate the new constraint
ALTER TABLE public.source_content_ingested
  DROP CONSTRAINT IF EXISTS theme_check;

-- Step 2: Update existing records with the old theme name
UPDATE public.source_content_ingested
SET theme = 'Marketing, Sponsorship, and Merchandising'
WHERE theme = 'Marketing, Sponsorship, & Merchandising';

-- Step 3: Add the new constraint with the updated theme name
ALTER TABLE public.source_content_ingested
  ADD CONSTRAINT theme_check
  CHECK (theme IN (
    'Players',
    'Teams & Organizations',
    'Venues & Locations',
    'Awards & Honors',
    'Leadership & Staff',
    'Tactics & Advanced Analytics',
    'Training, Health, & Wellness',
    'Equipment & Technology',
    'Business & Finance',
    'Media, Broadcasting, & E-Sports',
    'Marketing, Sponsorship, and Merchandising',  -- Changed from "&" to "and"
    'Fandom & Fan Culture',
    'Social Impact & Diversity'
  ));

-- Step 4: Verify the update
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count
  FROM public.source_content_ingested
  WHERE theme = 'Marketing, Sponsorship, & Merchandising';
  
  SELECT COUNT(*) INTO new_count
  FROM public.source_content_ingested
  WHERE theme = 'Marketing, Sponsorship, and Merchandising';
  
  IF old_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % records still have old theme name', old_count;
  END IF;
  
  RAISE NOTICE 'Migration successful: % records now use new theme name', new_count;
END $$;

COMMIT;

