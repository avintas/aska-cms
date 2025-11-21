-- Migration: Expand themes from 5 to 13 themes
-- Date: 2025-01-15
-- Description: 
--   - Expands theme system from 5 to 13 themes
--   - Adds 8 new themes: Business & Finance, Media/Broadcasting/E-Sports, Marketing/Sponsorship/Merchandising,
--     Equipment & Technology, Training/Health/Wellness, Fandom & Fan Culture, Social Impact & Diversity,
--     Tactics & Advanced Analytics
--   - Updates category constraint to include new categories for all themes
--   - Maintains backward compatibility with existing content

-- ========================================================================
-- STEP 1: Update Theme Constraint
-- ========================================================================

DO $$
BEGIN
  -- Drop existing theme constraint
  ALTER TABLE public.source_content_ingested 
  DROP CONSTRAINT IF EXISTS theme_check;

  -- Add new constraint with 13 themes
  ALTER TABLE public.source_content_ingested
  ADD CONSTRAINT theme_check CHECK (
    theme IN (
      -- Core Themes (5)
      'Players',
      'Teams & Organizations',
      'Venues & Locations',
      'Awards & Honors',
      'Leadership & Staff',
      -- Business, Economics, & Management (3)
      'Business & Finance',
      'Media, Broadcasting, & E-Sports',
      'Marketing, Sponsorship, & Merchandising',
      -- Technology, Training, & Performance (2)
      'Equipment & Technology',
      'Training, Health, & Wellness',
      -- Culture, Fandom, & Community (2)
      'Fandom & Fan Culture',
      'Social Impact & Diversity',
      -- Advanced Analysis & Strategy (1)
      'Tactics & Advanced Analytics'
    )
  );
END $$;

-- ========================================================================
-- STEP 2: Update Category Constraint
-- ========================================================================

DO $$
BEGIN
  -- Drop existing category constraint
  ALTER TABLE public.source_content_ingested
  DROP CONSTRAINT IF EXISTS category_check;

  -- Add new constraint with expanded categories
  ALTER TABLE public.source_content_ingested
  ADD CONSTRAINT category_check CHECK (
    category IS NULL OR category IN (
      -- Players theme categories (expanded)
      'Player Spotlight', 'Sharpshooters', 'Net Minders', 'Icons', 'Captains', 'Hockey is Family',
      'Statistics & Records', 'Career Achievements',
      -- Teams & Organizations theme categories (expanded)
      'Stanley Cup Playoffs', 'NHL Draft', 'Free Agency', 'Game Day', 'Hockey Nations', 
      'All-Star Game', 'Heritage Classic', 'International Tournaments', 'Olympics',
      -- Venues & Locations theme categories
      'Stadium Series', 'Global Series',
      -- Awards & Honors theme categories (expanded)
      'NHL Awards', 'Milestones', 'Historical Events', 'Traditions', 'Legacy Content',
      -- Leadership & Staff theme categories
      'Coaching', 'Management', 'Front Office',
      -- Tactics & Advanced Analytics theme categories (NEW)
      'Coaching Systems', 'Tactical Analysis', 'Advanced Metrics', 'Strategy Breakdowns', 
      'Performance Analysis', 'Game Rules', 'Penalties & Infractions', 'Officiating',
      -- Business & Finance theme categories (NEW)
      'Contracts & Salaries', 'Collective Bargaining', 'Team Valuations', 'Revenue Sharing', 'Financial Operations',
      -- Media, Broadcasting, & E-Sports theme categories (NEW)
      'Broadcasting & TV', 'Streaming Services', 'Sports Journalism', 'E-Sports', 'Video Games',
      -- Marketing, Sponsorship, & Merchandising theme categories (NEW)
      'Sponsorships', 'Endorsements', 'Merchandise', 'Advertising', 'Brand Partnerships',
      -- Equipment & Technology theme categories (NEW)
      'Equipment Design', 'Technology Innovation', 'Safety Technology', 'Ice Maintenance', 'Video Review Systems',
      -- Training, Health, & Wellness theme categories (NEW)
      'Training Programs', 'Nutrition', 'Sports Psychology', 'Injury Prevention', 'Recovery & Rehabilitation',
      'Youth Leagues', 'Development Programs', 'Junior Hockey',
      -- Fandom & Fan Culture theme categories (NEW)
      'Fan Traditions', 'Community Events', 'Watch Parties', 'Rivalry Culture', 'Fan Experiences',
      -- Social Impact & Diversity theme categories (NEW)
      'Diversity & Inclusion', 'Charitable Initiatives', 'Community Outreach', 'Environmental Impact', 'Social Programs'
    )
  );
END $$;

-- ========================================================================
-- STEP 3: Verify Changes
-- ========================================================================

-- Verify theme constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'theme_check' 
    AND table_name = 'source_content_ingested'
  ) THEN
    RAISE EXCEPTION 'Theme constraint was not created successfully';
  END IF;
END $$;

-- Verify category constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'category_check' 
    AND table_name = 'source_content_ingested'
  ) THEN
    RAISE EXCEPTION 'Category constraint was not created successfully';
  END IF;
END $$;

-- ========================================================================
-- Migration Complete
-- ========================================================================
-- 
-- Next Steps:
-- 1. Update TypeScript validators (apps/cms/src/lib/sourcing/validators.ts)
-- 2. Update TypeScript types (apps/cms/src/lib/ideation/types.ts)
-- 3. Update API routes (apps/cms/src/app/api/content-browser/route.ts)
-- 4. Update documentation
-- 5. Update AI prompts for metadata extraction
-- ========================================================================

