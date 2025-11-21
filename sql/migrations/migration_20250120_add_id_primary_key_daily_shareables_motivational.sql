-- Migration: Add id column as primary key to daily_shareables_motivational
-- Date: 2025-01-20
-- Description: 
--   Changes primary key from publish_date to id (BIGSERIAL - 8 bytes)
--   Adds unique constraint on publish_date to maintain one row per day
--   This allows for better flexibility and follows standard database patterns

BEGIN;

-- Step 1: Drop existing primary key constraint
ALTER TABLE public.daily_shareables_motivational
  DROP CONSTRAINT IF EXISTS daily_shareables_motivational_pkey;

-- Step 2: Add id column as BIGSERIAL (auto-incrementing, 8 bytes)
ALTER TABLE public.daily_shareables_motivational
  ADD COLUMN IF NOT EXISTS id BIGSERIAL;

-- Step 3: Set id as primary key
ALTER TABLE public.daily_shareables_motivational
  ADD CONSTRAINT daily_shareables_motivational_pkey PRIMARY KEY (id);

-- Step 4: Add unique constraint on publish_date (ensures one row per day)
ALTER TABLE public.daily_shareables_motivational
  ADD CONSTRAINT daily_shareables_motivational_publish_date_unique UNIQUE (publish_date);

-- Step 5: Update existing rows to have sequential ids (if any exist)
-- This ensures existing data gets proper id values
-- Note: BIGSERIAL will auto-increment for new rows

-- Step 6: Update index to reference the new primary key structure
-- The existing index on publish_date is still valid and useful
-- No changes needed to indexes

COMMENT ON COLUMN public.daily_shareables_motivational.id IS 
  'Primary key - auto-incrementing unique identifier for each schedule entry.';

COMMENT ON COLUMN public.daily_shareables_motivational.publish_date IS 
  'The date this collection is scheduled to publish. Unique constraint ensures one collection per day.';

COMMIT;

