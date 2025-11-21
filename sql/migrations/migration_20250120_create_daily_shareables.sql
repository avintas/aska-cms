-- Migration: Create daily_shareables_motivational table for calendarized motivational shareables
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

-- Create daily_shareables_motivational table
CREATE TABLE IF NOT EXISTS public.daily_shareables_motivational (
  -- Primary key: The date this collection is scheduled to publish
  publish_date DATE NOT NULL PRIMARY KEY,
  
  -- Pre-processed collection: Complete JSONB array of motivational items ready to display
  -- Contains full content (quote, author, context, theme, etc.) - no joins needed
  -- Number of items is flexible (typically 7-12, but can vary)
  items JSONB NOT NULL,
  
  -- Timestamps for tracking when schedule was created/updated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
-- Index for date lookups (most common query: "get today's shareables")
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_date 
  ON public.daily_shareables_motivational(publish_date);

-- Index for JSONB queries (if we need to search within items later)
CREATE INDEX IF NOT EXISTS idx_daily_shareables_motivational_items 
  ON public.daily_shareables_motivational USING GIN(items);

-- Add comments for documentation
COMMENT ON TABLE public.daily_shareables_motivational IS 
  'Pre-processed daily motivational shareable collections. Each row contains a complete set of motivational items for one day, stored as JSONB. No joins required - web app queries and displays directly.';

COMMENT ON COLUMN public.daily_shareables_motivational.publish_date IS 
  'The date this collection is scheduled to publish. Primary key ensures one collection per day.';

COMMENT ON COLUMN public.daily_shareables_motivational.items IS 
  'Complete pre-processed JSONB array of motivational items. Contains full content ready to display - quote, author, context, theme, etc. Number of items is flexible.';

COMMIT;

