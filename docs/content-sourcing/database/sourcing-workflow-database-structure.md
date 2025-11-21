# Sourcing Workflow - Database Structure

## Design Philosophy: Modular & Detachable

**Key Decision:** Create a **completely new table** instead of enhancing the existing `ingested` table.

**Rationale:**

- **Modularity:** New workflow has its own table, completely separate
- **Detachability:** Can drop entire table if removing workflow
- **Clean Separation:** No mixing with existing data/system
- **Fresh Start:** New content goes into new table
- **Zero Impact:** Existing `ingested` table remains untouched

## Database Structure

### New Table: `source_content_ingested`

**Purpose:** Store source content processed through the new workflow system

**Schema:**

```sql
-- Table: source_content_ingested
-- Purpose: Store source content with AI-extracted metadata (new workflow)
-- Note: Completely separate from existing 'ingested' table

CREATE TABLE IF NOT EXISTS public.source_content_ingested (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,

  -- Content fields
  content_text TEXT NOT NULL,
  word_count INTEGER,
  char_count INTEGER,

  -- AI-extracted metadata fields
  theme TEXT NOT NULL,                    -- Primary theme (required, must be one of 13 standardized themes)
  tags TEXT[],                            -- Rich tag fabric (array)
  category TEXT,                          -- Theme-specific category refinement (standardized list)
  summary TEXT,                           -- AI-generated summary
  title TEXT,                             -- AI-generated title
  key_phrases TEXT[],                     -- Key phrases extracted by AI
  metadata JSONB,                         -- Additional AI-generated metadata (flexible)

  -- Workflow tracking
  ingestion_process_id TEXT,               -- Link to process execution (for tracking)
  ingestion_status TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'validated', 'enriched', 'complete'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT ingestion_status_check CHECK (ingestion_status IN ('draft', 'validated', 'enriched', 'complete')),
  CONSTRAINT theme_check CHECK (
    theme IN (
      -- Core Themes (5)
      'Players', 'Teams & Organizations', 'Venues & Locations', 'Awards & Honors', 'Leadership & Staff',
      -- Business, Economics, & Management (3)
      'Business & Finance', 'Media, Broadcasting, & E-Sports', 'Marketing, Sponsorship, and Merchandising',
      -- Technology, Training, & Performance (2)
      'Equipment & Technology', 'Training, Health, & Wellness',
      -- Culture, Fandom, & Community (2)
      'Fandom & Fan Culture', 'Social Impact & Diversity',
      -- Advanced Analysis & Strategy (1)
      'Tactics & Advanced Analytics'
    )
  ),
  CONSTRAINT category_check CHECK (
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
      -- Marketing, Sponsorship, and Merchandising theme categories (NEW)
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
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_source_content_theme ON public.source_content_ingested (theme);
CREATE INDEX IF NOT EXISTS idx_source_content_category ON public.source_content_ingested (category);
CREATE INDEX IF NOT EXISTS idx_source_content_ingestion_status ON public.source_content_ingested (ingestion_status);
CREATE INDEX IF NOT EXISTS idx_source_content_tags ON public.source_content_ingested USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_source_content_key_phrases ON public.source_content_ingested USING GIN (key_phrases);
CREATE INDEX IF NOT EXISTS idx_source_content_metadata ON public.source_content_ingested USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_source_content_created_at ON public.source_content_ingested (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_content_title ON public.source_content_ingested (title);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_source_content_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER on_source_content_update
BEFORE UPDATE ON public.source_content_ingested
FOR EACH ROW
EXECUTE PROCEDURE public.handle_source_content_update();
```

**TypeScript Interface:**

```typescript
import type { Theme } from "@/components/theme-selector";

export interface SourceContentIngested {
  id: number;
  content_text: string;
  word_count?: number;
  char_count?: number;

  // AI-extracted metadata
  theme: Theme; // Required - must be one of 5 standardized themes
  tags?: string[]; // Rich tag fabric
  category?: string; // Theme-specific category refinement (standardized list)
  summary?: string; // AI-generated summary
  title?: string; // AI-generated title
  key_phrases?: string[]; // Key phrases
  metadata?: Record<string, unknown>; // Additional metadata (JSONB)

  // Workflow tracking
  ingestion_process_id?: string; // Process execution ID
  ingestion_status: "draft" | "validated" | "enriched" | "complete";

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateSourceContentIngested {
  content_text: string;
  word_count?: number;
  char_count?: number;
  theme: Theme; // Required - must be one of 5 standardized themes
  tags?: string[];
  category?: string;
  summary?: string;
  title?: string;
  key_phrases?: string[];
  metadata?: Record<string, unknown>;
  ingestion_process_id?: string;
  ingestion_status?: "draft" | "validated" | "enriched" | "complete";
}
```

### New Table: `ai_extraction_prompts`

**Purpose:** Store user-provided AI prompts for metadata extraction and content enrichment (not hardcoded)

**Schema:**

```sql
-- Table: ai_extraction_prompts
-- Purpose: Store user-provided AI prompts for extraction and enrichment

CREATE TABLE IF NOT EXISTS public.ai_extraction_prompts (
  id BIGSERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,                    -- User-friendly name (e.g., "Hockey Theme Extraction")
  prompt_type TEXT NOT NULL,                    -- 'metadata_extraction' or 'content_enrichment'
  prompt_content TEXT NOT NULL,                 -- The actual prompt text
  description TEXT,                             -- Optional description of what this prompt does
  is_active BOOLEAN NOT NULL DEFAULT true,      -- Only active prompts are used
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT prompt_type_check CHECK (prompt_type IN ('metadata_extraction', 'content_enrichment'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active
  ON public.ai_extraction_prompts(is_active, prompt_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_prompts_type
  ON public.ai_extraction_prompts(prompt_type);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_by
  ON public.ai_extraction_prompts(created_by);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_prompt_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER on_prompt_update
BEFORE UPDATE ON public.ai_extraction_prompts
FOR EACH ROW
EXECUTE PROCEDURE public.handle_prompt_update();
```

**TypeScript Interface:**

```typescript
export interface AIExtractionPrompt {
  id: number;
  promptName: string;
  promptType: "metadata_extraction" | "content_enrichment";
  promptContent: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface CreateAIExtractionPrompt {
  promptName: string;
  promptType: "metadata_extraction" | "content_enrichment";
  promptContent: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAIExtractionPrompt {
  promptName?: string;
  promptContent?: string;
  description?: string;
  isActive?: boolean;
}
```

## Complete Database Schema

### Table: `source_content_ingested` (New)

```sql
CREATE TABLE IF NOT EXISTS public.source_content_ingested (
  id BIGSERIAL PRIMARY KEY,
  content_text TEXT NOT NULL,
  word_count INTEGER,
  char_count INTEGER,
  theme TEXT NOT NULL CHECK (theme IN ('Players', 'Teams & Organizations', 'Venues & Locations', 'Awards & Honors', 'Leadership & Staff')),
  tags TEXT[],
  category TEXT CHECK (
    category IS NULL OR category IN (
      'Player Spotlight', 'Sharpshooters', 'Net Minders', 'Icons', 'Captains', 'Hockey is Family',
      'Stanley Cup Playoffs', 'NHL Draft', 'Free Agency', 'Game Day', 'Hockey Nations', 'All-Star Game', 'Heritage Classic',
      'Stadium Series', 'Global Series',
      'NHL Awards', 'Milestones',
      'Coaching', 'Management', 'Front Office'
    )
  ),
  summary TEXT,
  title TEXT,
  key_phrases TEXT[],
  metadata JSONB,
  ingestion_process_id TEXT,
  ingestion_status TEXT NOT NULL DEFAULT 'draft' CHECK (ingestion_status IN ('draft', 'validated', 'enriched', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_source_content_theme ON public.source_content_ingested (theme);
CREATE INDEX IF NOT EXISTS idx_source_content_category ON public.source_content_ingested (category);
CREATE INDEX IF NOT EXISTS idx_source_content_ingestion_status ON public.source_content_ingested (ingestion_status);
CREATE INDEX IF NOT EXISTS idx_source_content_tags ON public.source_content_ingested USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_source_content_key_phrases ON public.source_content_ingested USING GIN (key_phrases);
CREATE INDEX IF NOT EXISTS idx_source_content_metadata ON public.source_content_ingested USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_source_content_created_at ON public.source_content_ingested (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_content_title ON public.source_content_ingested (title);
```

### Table: `ai_extraction_prompts` (New)

```sql
CREATE TABLE IF NOT EXISTS public.ai_extraction_prompts (
  id BIGSERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('metadata_extraction', 'content_enrichment')),
  prompt_content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active
  ON public.ai_extraction_prompts(is_active, prompt_type)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON public.ai_extraction_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_by ON public.ai_extraction_prompts(created_by);
```

## Migration Scripts

### Migration 1: Create `source_content_ingested` Table

```sql
-- File: sql/34-create-source-content-ingested-table.sql

CREATE TABLE IF NOT EXISTS public.source_content_ingested (
  id BIGSERIAL PRIMARY KEY,
  content_text TEXT NOT NULL,
  word_count INTEGER,
  char_count INTEGER,
  theme TEXT NOT NULL CHECK (theme IN ('Players', 'Teams & Organizations', 'Venues & Locations', 'Awards & Honors', 'Leadership & Staff')),
  tags TEXT[],
  category TEXT CHECK (
    category IS NULL OR category IN (
      'Player Spotlight', 'Sharpshooters', 'Net Minders', 'Icons', 'Captains', 'Hockey is Family',
      'Stanley Cup Playoffs', 'NHL Draft', 'Free Agency', 'Game Day', 'Hockey Nations', 'All-Star Game', 'Heritage Classic',
      'Stadium Series', 'Global Series',
      'NHL Awards', 'Milestones',
      'Coaching', 'Management', 'Front Office'
    )
  ),
  summary TEXT,
  title TEXT,
  key_phrases TEXT[],
  metadata JSONB,
  ingestion_process_id TEXT,
  ingestion_status TEXT NOT NULL DEFAULT 'draft' CHECK (ingestion_status IN ('draft', 'validated', 'enriched', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_source_content_theme ON public.source_content_ingested (theme);
CREATE INDEX IF NOT EXISTS idx_source_content_category ON public.source_content_ingested (category);
CREATE INDEX IF NOT EXISTS idx_source_content_ingestion_status ON public.source_content_ingested (ingestion_status);
CREATE INDEX IF NOT EXISTS idx_source_content_tags ON public.source_content_ingested USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_source_content_key_phrases ON public.source_content_ingested USING GIN (key_phrases);
CREATE INDEX IF NOT EXISTS idx_source_content_metadata ON public.source_content_ingested USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_source_content_created_at ON public.source_content_ingested (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_content_title ON public.source_content_ingested (title);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_source_content_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER on_source_content_update
BEFORE UPDATE ON public.source_content_ingested
FOR EACH ROW
EXECUTE PROCEDURE public.handle_source_content_update();
```

### Migration 2: Create `ai_extraction_prompts` Table

```sql
-- File: sql/35-create-ai-extraction-prompts-table.sql

CREATE TABLE IF NOT EXISTS public.ai_extraction_prompts (
  id BIGSERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('metadata_extraction', 'content_enrichment')),
  prompt_content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active
  ON public.ai_extraction_prompts(is_active, prompt_type)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON public.ai_extraction_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_by ON public.ai_extraction_prompts(created_by);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_prompt_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER on_prompt_update
BEFORE UPDATE ON public.ai_extraction_prompts
FOR EACH ROW
EXECUTE PROCEDURE public.handle_prompt_update();
```

## Database Usage Patterns

### Querying `source_content_ingested` Table

**Filter by Theme:**

```typescript
const { data } = await supabaseAdmin
  .from("source_content_ingested")
  .select("*")
  .eq("theme", "Winnipeg Jets")
  .order("created_at", { ascending: false });
```

**Filter by Tags (Array Contains):**

```typescript
const { data } = await supabaseAdmin
  .from("source_content_ingested")
  .select("*")
  .contains("tags", ["hockey", "NHL"])
  .order("created_at", { ascending: false });
```

**Filter by Category:**

```typescript
const { data } = await supabaseAdmin
  .from("source_content_ingested")
  .select("*")
  .eq("category", "sports")
  .order("created_at", { ascending: false });
```

**Search in Metadata (JSONB):**

```typescript
const { data } = await supabaseAdmin
  .from("source_content_ingested")
  .select("*")
  .filter("metadata->>quality_score", "gt", "80")
  .order("created_at", { ascending: false });
```

**Get Content by Ingestion Status:**

```typescript
const { data } = await supabaseAdmin
  .from("source_content_ingested")
  .select("*")
  .eq("ingestion_status", "complete")
  .order("created_at", { ascending: false });
```

### Querying `ai_extraction_prompts` Table

**Get Active Prompt by Type:**

```typescript
const { data } = await supabaseAdmin
  .from("ai_extraction_prompts")
  .select("*")
  .eq("prompt_type", "metadata_extraction")
  .eq("is_active", true)
  .single();
```

**Get All Active Prompts:**

```typescript
const { data } = await supabaseAdmin
  .from("ai_extraction_prompts")
  .select("*")
  .eq("is_active", true)
  .order("prompt_type", { ascending: true });
```

## Removal Strategy

**If removing the workflow system:**

1. **Drop Tables:**

```sql
DROP TABLE IF EXISTS public.source_content_ingested CASCADE;
DROP TABLE IF EXISTS public.ai_extraction_prompts CASCADE;
```

2. **Drop Functions:**

```sql
DROP FUNCTION IF EXISTS public.handle_source_content_update() CASCADE;
DROP FUNCTION IF EXISTS public.handle_prompt_update() CASCADE;
```

3. **Result:** Existing `ingested` table and all other tables remain completely untouched.

## Comparison: Old vs New

### Existing `ingested` Table (Untouched)

- Continues to work as before
- No changes required
- Existing code continues to function
- Can coexist with new table

### New `source_content_ingested` Table

- Completely separate
- New workflow content only
- Rich metadata from AI extraction
- Can be dropped without affecting existing system

## Summary

### Tables Needed

1. **`source_content_ingested` (New)** ✅
   - Completely new table for workflow content
   - Rich AI-extracted metadata
   - Theme required, other fields optional
   - Can be dropped if removing workflow

2. **`ai_extraction_prompts` (New)** ✅
   - New table for storing user-provided prompts
   - Supports metadata extraction and content enrichment
   - Includes active/inactive flag
   - Can be dropped if removing workflow

### Migration Path

1. Run `sql/34-create-source-content-ingested-table.sql` - Create new content table
2. Run `sql/35-create-ai-extraction-prompts-table.sql` - Create prompts table
3. Start using new table for workflow content
4. Existing `ingested` table remains untouched

### Benefits

- **Complete Separation:** New table, no mixing with existing data
- **Modular:** Can be removed without affecting existing system
- **Clean Start:** Fresh content goes into new table
- **Zero Impact:** Existing `ingested` table untouched
- **Detachable:** Drop both tables if removing workflow

### Migration 2: Create `ai_extraction_prompts` Table

```sql
-- File: sql/35-create-ai-extraction-prompts-table.sql

CREATE TABLE IF NOT EXISTS public.ai_extraction_prompts (
  id BIGSERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('metadata_extraction', 'content_enrichment')),
  prompt_content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active
  ON public.ai_extraction_prompts(is_active, prompt_type)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON public.ai_extraction_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_by ON public.ai_extraction_prompts(created_by);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_prompt_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER on_prompt_update
BEFORE UPDATE ON public.ai_extraction_prompts
FOR EACH ROW
EXECUTE PROCEDURE public.handle_prompt_update();
```

## Database Usage Patterns

### Querying Enhanced `ingested` Table

**Filter by Theme:**

```typescript
const { data } = await supabaseAdmin
  .from("ingested")
  .select("*")
  .eq("theme", "Winnipeg Jets")
  .order("created_at", { ascending: false });
```

**Filter by Tags (Array Contains):**

```typescript
const { data } = await supabaseAdmin
  .from("ingested")
  .select("*")
  .contains("tags", ["hockey", "NHL"])
  .order("created_at", { ascending: false });
```

**Filter by Category:**

```typescript
const { data } = await supabaseAdmin
  .from("ingested")
  .select("*")
  .eq("category", "sports")
  .order("created_at", { ascending: false });
```

**Search in Metadata (JSONB):**

```typescript
const { data } = await supabaseAdmin
  .from("ingested")
  .select("*")
  .filter("metadata->>quality_score", "gt", "80")
  .order("created_at", { ascending: false });
```

### Querying `ai_extraction_prompts` Table

**Get Active Prompt by Type:**

```typescript
const { data } = await supabaseAdmin
  .from("ai_extraction_prompts")
  .select("*")
  .eq("prompt_type", "metadata_extraction")
  .eq("is_active", true)
  .single();
```

**Get All Active Prompts:**

```typescript
const { data } = await supabaseAdmin
  .from("ai_extraction_prompts")
  .select("*")
  .eq("is_active", true)
  .order("prompt_type", { ascending: true });
```

## Backward Compatibility

### Strategy

1. **Keep Existing Columns:** `themes`, `title`, `status` remain unchanged
2. **Nullable New Columns:** All new columns are nullable (no breaking changes)
3. **Migration Path:** Copy `themes` → `theme` for existing records
4. **Gradual Adoption:** Existing code continues to work, new code uses new fields

### Code Compatibility

**Old Code (Still Works):**

```typescript
// Uses themes (legacy field)
const content: IngestedContent = {
  content_text: "...",
  themes: "Hockey",
};
```

**New Code (Uses New Fields):**

```typescript
// Uses theme, tags, category (new fields)
const content: IngestedContent = {
  content_text: "...",
  theme: "Hockey",
  tags: ["hockey", "NHL", "sports"],
  category: "sports",
};
```

## Summary

### Tables Needed

1. **`ingested` (Enhanced)** ✅
   - Add 8 new nullable columns
   - Keep existing columns for backward compatibility
   - Add indexes for performance

2. **`ai_extraction_prompts` (New)** ✅
   - New table for storing user-provided prompts
   - Supports metadata extraction and content enrichment
   - Includes active/inactive flag

### Migration Path

1. Run `sql/34-add-ai-metadata-to-ingested.sql` - Add new columns
2. Run `sql/35-create-ai-extraction-prompts-table.sql` - Create prompts table
3. Migrate existing `themes` → `theme` data
4. Set `ingestion_status` for existing records

### Benefits

- **Backward Compatible:** Existing code continues to work
- **Extensible:** New metadata fields support rich tagging
- **Performant:** Proper indexes for filtering and searching
- **Flexible:** JSONB metadata field for future extensions
- **Modular:** Prompts table can be dropped if removing workflow
