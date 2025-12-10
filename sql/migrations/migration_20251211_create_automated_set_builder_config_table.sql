-- Migration: Create automated_set_builder_config table
-- Date: 2025-12-11
-- Description: 
--   Creates automated_set_builder_config table to store configuration for the
--   Automated Set Building System. This allows admins to configure the system
--   through the UI without code changes.

BEGIN;

-- ========================================================================
-- STEP 1: Create automated_set_builder_config table
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.automated_set_builder_config (
  id SERIAL PRIMARY KEY,
  
  -- Enable/disable the automated system
  enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Number of sets to create per day
  sets_per_day INTEGER NOT NULL DEFAULT 4,
  
  -- Number of questions per set
  questions_per_set INTEGER NOT NULL DEFAULT 10,
  
  -- Array of theme names to include in the mix (null = all themes)
  -- Example: ['Players', 'Teams & Organizations', 'Venues & Locations']
  themes TEXT[],
  
  -- Whether to enforce balanced theme distribution
  -- true = try to get equal questions from each theme
  -- false = pure usage-based selection (may favor themes with more questions)
  balance_themes BOOLEAN NOT NULL DEFAULT true,
  
  -- Cron schedule expression (e.g., '0 2 * * *' for daily at 2 AM)
  -- Default: daily at 2 AM UTC
  cron_schedule VARCHAR(100) NOT NULL DEFAULT '0 2 * * *',
  
  -- Last run timestamp
  last_run_at TIMESTAMPTZ,
  
  -- Last run status
  last_run_status VARCHAR(50), -- 'success', 'partial', 'failed'
  
  -- Last run message/error
  last_run_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one config row exists
  CONSTRAINT single_config CHECK (id = 1)
);

-- ========================================================================
-- STEP 2: Insert default configuration
-- ========================================================================

INSERT INTO public.automated_set_builder_config (
  id,
  enabled,
  sets_per_day,
  questions_per_set,
  themes,
  balance_themes,
  cron_schedule
) VALUES (
  1,
  false, -- Disabled by default
  4,     -- 4 sets per day
  10,    -- 10 questions per set
  NULL,  -- All themes (null = include all)
  true,  -- Balance themes
  '0 2 * * *' -- Daily at 2 AM UTC
)
ON CONFLICT (id) DO NOTHING;

-- ========================================================================
-- STEP 3: Add comments
-- ========================================================================

COMMENT ON TABLE public.automated_set_builder_config IS 
'Configuration for Automated Set Building System. Only one row should exist (id=1).';

COMMENT ON COLUMN public.automated_set_builder_config.enabled IS 
'Whether the automated set building system is enabled';

COMMENT ON COLUMN public.automated_set_builder_config.sets_per_day IS 
'Number of trivia sets to create per day';

COMMENT ON COLUMN public.automated_set_builder_config.questions_per_set IS 
'Number of questions per trivia set';

COMMENT ON COLUMN public.automated_set_builder_config.themes IS 
'Array of theme names to include in the mix. NULL means include all available themes.';

COMMENT ON COLUMN public.automated_set_builder_config.balance_themes IS 
'Whether to enforce balanced theme distribution (true) or pure usage-based selection (false)';

COMMENT ON COLUMN public.automated_set_builder_config.cron_schedule IS 
'Cron schedule expression for when to run the automated builder (e.g., "0 2 * * *" for daily at 2 AM UTC)';

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Check table was created
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public' 
--   AND table_name = 'automated_set_builder_config';

-- Check default configuration
-- SELECT * FROM public.automated_set_builder_config;

COMMIT;

