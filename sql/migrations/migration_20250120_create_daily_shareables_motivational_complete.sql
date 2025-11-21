-- Migration: Create daily_shareables_motivational table with id primary key and RLS policies
-- Date: 2025-01-20
-- Description: Creates table to store pre-processed daily motivational shareable collections
--              Each row represents one day's complete set of motivational items (flexible count)
--              Items are stored as JSONB (complete pre-processed content)
--              Phase 1: Motivational content only
--              
--              Pattern: This same structure can be reused for:
--              - hourly_shareables_motivational (hourly schedules)
--              - weekly_shareables_motivational (weekly schedules)
--              - monthly_shareables_motivational (monthly schedules)
--              - daily_shareables_wisdom, daily_shareables_stats, daily_shareables_greetings (other content types)
--              
--              Naming convention: {frequency}_shareables_{content_type}

BEGIN;

-- ========================================================================
-- TABLE CREATION
-- ========================================================================

-- Create daily_shareables_motivational table
CREATE TABLE IF NOT EXISTS public.daily_shareables_motivational (
  -- Primary key: Auto-incrementing unique identifier (8 bytes)
  id BIGSERIAL NOT NULL PRIMARY KEY,
  
  -- The date this collection is scheduled to publish (optional)
  -- Standard format: YYYY-MM-DD (e.g., 2025-11-19)
  publish_date DATE NULL,
  
  -- Pre-processed collection: Complete JSONB array of motivational items ready to display
  -- Contains full content (quote, author, context, theme, etc.) - no joins needed
  -- Number of items is flexible (typically 7-12, but can vary)
  items JSONB NOT NULL,
  
  -- Day of week as text: "Sunday", "Monday", "Tuesday", etc. (optional)
  day_of_week VARCHAR(20) NULL,
  
  -- Week of year as number: 1-53 (optional)
  week_of_year INTEGER NULL,
  
  -- Special occasion: Halloween, Christmas, New Year's Day, etc. (optional)
  special_occasion VARCHAR(100) NULL,
  
  -- Special season: Playoffs, Regular Season, Off-Season, etc. (optional)
  special_season VARCHAR(100) NULL,
  
  -- Timestamps for tracking when schedule was created/updated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================================================
-- INDEXES
-- ========================================================================

-- Index for date lookups (most common query: "get today's shareables")
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_date 
  ON public.daily_shareables_motivational(publish_date);

-- Index for JSONB queries (if we need to search within items later)
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_items 
  ON public.daily_shareables_motivational USING GIN(items);

-- Index for day_of_week queries
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_day_of_week 
  ON public.daily_shareables_motivational(day_of_week) WHERE day_of_week IS NOT NULL;

-- Index for week_of_year queries
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_week_of_year 
  ON public.daily_shareables_motivational(week_of_year) WHERE week_of_year IS NOT NULL;

-- Index for special_occasion queries
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_special_occasion 
  ON public.daily_shareables_motivational(special_occasion) WHERE special_occasion IS NOT NULL;

-- Index for special_season queries
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_special_season 
  ON public.daily_shareables_motivational(special_season) WHERE special_season IS NOT NULL;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================================

-- Enable RLS on daily_shareables_motivational table
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

-- ========================================================================
-- COMMENTS
-- ========================================================================

COMMENT ON TABLE public.daily_shareables_motivational IS 
  'Pre-processed daily motivational shareable collections. Each row contains a complete set of motivational items for one day, stored as JSONB. No joins required - web app queries and displays directly.';

COMMENT ON COLUMN public.daily_shareables_motivational.id IS 
  'Primary key - auto-incrementing unique identifier for each schedule entry (BIGSERIAL, 8 bytes).';

COMMENT ON COLUMN public.daily_shareables_motivational.publish_date IS 
  'The date this collection is scheduled to publish. Standard format: YYYY-MM-DD (e.g., 2025-11-19). Optional field.';

COMMENT ON COLUMN public.daily_shareables_motivational.items IS 
  'Complete pre-processed JSONB array of motivational items. Contains full content ready to display - quote, author, context, theme, etc. Number of items is flexible.';

COMMENT ON COLUMN public.daily_shareables_motivational.day_of_week IS 
  'Day of week as text: "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday". Optional field.';

COMMENT ON COLUMN public.daily_shareables_motivational.week_of_year IS 
  'Week of year as number: 1-53. Optional field.';

COMMENT ON COLUMN public.daily_shareables_motivational.special_occasion IS 
  'Special occasion: Halloween, Christmas, New Year''s Day, etc. Optional field.';

COMMENT ON COLUMN public.daily_shareables_motivational.special_season IS 
  'Special season: Playoffs, Regular Season, Off-Season, etc. Optional field.';

COMMENT ON COLUMN public.daily_shareables_motivational.created_at IS 
  'When this schedule entry was first created.';

COMMENT ON COLUMN public.daily_shareables_motivational.updated_at IS 
  'When this schedule entry was last updated (regenerated).';

COMMIT;

