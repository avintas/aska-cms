# Content Library Table Pattern Guide

**Last Updated:** October 29, 2025  
**Status:** Active Pattern for All Content Libraries

---

## System Architecture

**Tango CMS** creates and manages content → **Public APIs** serve content → **omnipaki.com** consumes and displays content

### API Layer

- Public APIs at `/api/public/` (wisdom, greetings, etc.) and `/api/hero-collections/`
- **No authentication required** for public APIs
- **CORS enabled** for cross-origin access
- omnipaki.com fetches content via HTTP (no direct database access)

### Benefits

✅ **Decoupled Architecture** - omnipaki.com doesn't need database credentials  
✅ **Simple Integration** - Just HTTP fetch calls  
✅ **Independent Development** - Teams can work separately  
✅ **Secure** - Database not exposed to public

---

## Overview

This guide documents the standardized pattern for creating dedicated content library tables in Tango CMS. Use this as a template when creating tables for:

- ✅ **Wisdom Library** (completed - see `sql/15-create-wisdom-table.sql`)
- 🔲 **Greetings Library** (pending)
- 🔲 **Motivational Library** (pending)
- 🔲 **Stats Library** (pending)

---

## Why Dedicated Tables?

Previously, all content types were mixed in a single `content` table. We're moving to dedicated tables for:

1. **Cleaner Schema**: Each content type has unique fields
2. **Better Performance**: Smaller tables, targeted indexes
3. **Type Safety**: Proper constraints per content type
4. **Easier Querying**: No type filtering needed
5. **Purpose-Built**: Fields match content structure exactly

---

## Standard Table Pattern

### Core Structure Template

```sql
CREATE TABLE IF NOT EXISTS public.{content_type}_library (
  -- Primary Key
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Core Content Fields (CONTENT-SPECIFIC - customize per type)
  [content-specific fields here],

  -- Metadata & Classification (STANDARD - use in all tables)
  theme TEXT,
  category TEXT,
  attribution TEXT,

  -- Status & Workflow (STANDARD - use in all tables)
  status TEXT,

  -- Source Tracking (STANDARD - use in all tables)
  source_content_id BIGINT,

  -- Usage Tracking (STANDARD - use in all tables)
  used_in TEXT[],

  -- Display/Ordering (STANDARD - use in all tables)
  display_order INTEGER,

  -- Timestamps (STANDARD - use in all tables)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
```

---

## Field Categories

### 1. Content-Specific Fields (Customize)

These vary by content type. Examples:

#### **Wisdom** (completed):

```sql
title TEXT NOT NULL,
musing TEXT NOT NULL,
from_the_box TEXT NOT NULL,
```

#### **Greetings** (example):

```sql
greeting_text TEXT NOT NULL,
tone TEXT,  -- e.g., 'friendly', 'inspirational', 'casual'
time_of_day TEXT,  -- e.g., 'morning', 'evening', 'any'
```

#### **Motivational** (example):

```sql
quote TEXT NOT NULL,
author TEXT,
context TEXT,  -- Optional context/explanation
```

#### **Stats** (example):

```sql
stat_text TEXT NOT NULL,
stat_value TEXT,  -- The actual number/stat
stat_category TEXT,  -- e.g., 'player', 'team', 'league', 'historical'
year INTEGER,  -- Year of stat if applicable
```

---

### 2. Standard Metadata Fields (Use in ALL tables)

```sql
-- Metadata & Classification
theme TEXT,              -- Thematic classification
category TEXT,           -- Secondary classification
attribution TEXT,        -- Source attribution

-- Status & Workflow
status TEXT,             -- 'draft', 'published', 'archived'

-- Source Tracking
source_content_id BIGINT,  -- FK to original content if migrated

-- Usage Tracking
used_in TEXT[],          -- Array of where content has been used

-- Display/Ordering
display_order INTEGER,   -- Manual ordering
```

**Note:** All nullable except where business logic requires NOT NULL.

---

### 3. Standard Timestamps (Use in ALL tables)

```sql
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
published_at TIMESTAMPTZ,
archived_at TIMESTAMPTZ
```

---

## Standard Indexes

Create these indexes for **every** content library table:

```sql
-- Status filtering (for workflow)
CREATE INDEX IF NOT EXISTS idx_{table_name}_status
  ON public.{table_name}(status);

-- Theme filtering (for categorization)
CREATE INDEX IF NOT EXISTS idx_{table_name}_theme
  ON public.{table_name}(theme);

-- Recent items (for CMS display)
CREATE INDEX IF NOT EXISTS idx_{table_name}_created_at
  ON public.{table_name}(created_at DESC);

-- Published items (for public queries)
CREATE INDEX IF NOT EXISTS idx_{table_name}_published_at
  ON public.{table_name}(published_at DESC);
```

---

## Naming Conventions

### Table Names

- Use singular: `wisdom`, `greeting`, `motivational`, `stat`
- No underscores unless necessary for clarity
- Lowercase

### Column Names

- Use snake_case: `greeting_text`, `stat_value`
- Be descriptive but concise
- Standard fields keep same names across all tables

### Index Names

- Pattern: `idx_{table_name}_{column_name}`
- Example: `idx_greeting_status`

---

## Complete Example: Greetings Library

Here's a complete implementation example:

```sql
-- Create greetings table
CREATE TABLE IF NOT EXISTS public.greeting (
  -- Primary Key
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Core Content Fields (GREETING-SPECIFIC)
  greeting_text TEXT NOT NULL,
  tone TEXT,
  time_of_day TEXT,

  -- Metadata & Classification (STANDARD)
  theme TEXT,
  category TEXT,
  attribution TEXT,

  -- Status & Workflow (STANDARD)
  status TEXT,

  -- Source Tracking (STANDARD)
  source_content_id BIGINT,

  -- Usage Tracking (STANDARD)
  used_in TEXT[],

  -- Display/Ordering (STANDARD)
  display_order INTEGER,

  -- Timestamps (STANDARD)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_greeting_status
  ON public.greeting(status);

CREATE INDEX IF NOT EXISTS idx_greeting_theme
  ON public.greeting(theme);

CREATE INDEX IF NOT EXISTS idx_greeting_created_at
  ON public.greeting(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_greeting_published_at
  ON public.greeting(published_at DESC);

-- Additional greeting-specific indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_greeting_time_of_day
  ON public.greeting(time_of_day);

-- Table and column comments
COMMENT ON TABLE public.greeting IS 'Dedicated table for greeting messages';
COMMENT ON COLUMN public.greeting.greeting_text IS 'The greeting message text';
COMMENT ON COLUMN public.greeting.tone IS 'Tone/style: friendly, inspirational, casual';
COMMENT ON COLUMN public.greeting.time_of_day IS 'Suggested time: morning, evening, any';
COMMENT ON COLUMN public.greeting.theme IS 'Thematic classification';
COMMENT ON COLUMN public.greeting.status IS 'Workflow status: draft, published, archived';
COMMENT ON COLUMN public.greeting.source_content_id IS 'Foreign key to source material if applicable';
COMMENT ON COLUMN public.greeting.used_in IS 'Array tracking where this greeting has been used';
COMMENT ON COLUMN public.greeting.published_at IS 'Timestamp when first published';
COMMENT ON COLUMN public.greeting.archived_at IS 'Timestamp when archived';
```

---

## Migration Checklist

When creating a new content library table:

### 1. Schema Creation

- [ ] Create table SQL file: `sql/XX-create-{type}-table.sql`
- [ ] Include all standard fields
- [ ] Add content-specific fields
- [ ] Create standard indexes
- [ ] Add table/column comments
- [ ] Test SQL runs without errors

### 2. TypeScript Types

- [ ] Create interface in appropriate component/page
- [ ] Include all fields from schema
- [ ] Use proper TypeScript types (string, number, Date, etc.)

### 3. CMS Page

- [ ] Create page: `app/cms/{type}-library/page.tsx`
- [ ] Implement list view
- [ ] Implement create/edit forms
- [ ] Add search/filter functionality
- [ ] Add status management (draft/publish/archive)

### 4. Public API Routes (for omnipaki.com)

- [ ] Create public API: `/api/public/{type}/random`
- [ ] Create public API: `/api/public/{type}/latest?limit=10`
- [ ] Create public API: `/api/public/{type}?theme=X&limit=20&offset=0`
- [ ] Document API in `PUBLIC-{TYPE}-API.md`
- [ ] Add TypeScript types for API responses

### 5. CMS API Routes (internal, if needed)

- [ ] GET all items: `/api/cms/{type}`
- [ ] GET by ID: `/api/cms/{type}/[id]`
- [ ] POST create: `/api/cms/{type}`
- [ ] PATCH update: `/api/cms/{type}/[id]`
- [ ] DELETE: `/api/cms/{type}/[id]`

### 5. Data Migration (if applicable)

- [ ] Create migration script to move data from `content` table
- [ ] Test migration on dev database
- [ ] Run migration on production

### 6. Navigation

- [ ] Add to sidebar in `components/app-shell.tsx`
- [ ] Choose appropriate icon/emoji

### 7. API Documentation (for omnipaki.com team)

- [ ] Create `PUBLIC-{TYPE}-API.md` handoff document
- [ ] Include example code (vanilla JS and React)
- [ ] Document all endpoints and parameters
- [ ] Provide TypeScript types
- [ ] Include troubleshooting tips

### 8. General Documentation

- [ ] Update this guide with any learnings
- [ ] Document any content-specific behaviors

---

## Status Field Values

Standard across all content library tables:

| Status      | Meaning                                 |
| ----------- | --------------------------------------- |
| `draft`     | Work in progress, not visible to public |
| `published` | Live and available for use              |
| `archived`  | Removed from active use but preserved   |
| `null`      | Legacy content (pre-status system)      |

---

## Usage Tracking Pattern

The `used_in` field tracks where content has been deployed:

```sql
-- Example values in used_in array:
['hero_collection_5', 'trivia_set_12', 'homepage_2025-10-29']
```

**Benefits:**

- Track content usage
- Prevent deletion of in-use content
- Analytics on popular content
- Find duplicates

---

## Query Patterns

### Get Published Items

```sql
SELECT * FROM {table_name}
WHERE status = 'published'
ORDER BY published_at DESC;
```

### Get Draft Items

```sql
SELECT * FROM {table_name}
WHERE status = 'draft'
ORDER BY created_at DESC;
```

### Get Items by Theme

```sql
SELECT * FROM {table_name}
WHERE theme = 'motivation' AND status = 'published'
ORDER BY created_at DESC;
```

### Get Recent Items (CMS)

```sql
SELECT * FROM {table_name}
ORDER BY created_at DESC
LIMIT 50;
```

---

## Performance Considerations

1. **Indexes**: Always create the 4 standard indexes
2. **NOT NULL**: Use for required fields only
3. **Text vs VARCHAR**: Use `TEXT` (no performance penalty in PostgreSQL)
4. **Timestamps**: Include all 4 standard timestamps
5. **Array Fields**: Use `TEXT[]` for `used_in` tracking

---

## Common Pitfalls

### ❌ Don't Do This:

- Mixing content types in one table
- Omitting standard fields to save space
- Using VARCHAR with arbitrary lengths
- Skipping indexes
- Inconsistent field naming

### ✅ Do This:

- One table per content type
- Include all standard fields
- Use TEXT for text fields
- Create standard indexes
- Follow naming conventions

---

## Reference Implementation

See **`sql/15-create-wisdom-table.sql`** for the complete, working example of this pattern.

---

## Questions?

When implementing new content library tables:

1. **Follow this pattern exactly** for standard fields
2. **Customize only** the content-specific fields
3. **Use wisdom table as reference** if unsure
4. **Update this guide** with any improvements

---

## Public API Documentation

When creating content libraries, document the public APIs for the omnipaki.com team:

### Existing Public APIs

- ✅ **Wisdom**: `/api/public/wisdom` - See `PUBLIC-WISDOM-API.md`
- ✅ **Greetings**: `/api/public/greetings` - See `PUBLIC-GREETINGS-API.md`
- ✅ **Hero Collections**: `/api/hero-collections` - See `PUBLIC-HERO-COLLECTIONS-API.md`

### Pattern for API Documentation

Each public API should have:

1. **{TYPE}-API.md** file with complete documentation
2. Example code (vanilla JavaScript + React/Next.js)
3. TypeScript type definitions
4. Error handling examples
5. Performance tips
6. Troubleshooting guide

---

## Change Log

| Date       | Change                                              | Author |
| ---------- | --------------------------------------------------- | ------ |
| 2025-10-29 | Initial pattern documented (based on wisdom table)  | Team   |
| 2025-10-29 | Hero Collections `name` → `title` rename            | Team   |
| 2025-10-29 | Added API architecture and public API documentation | Team   |

---

**Next Tables to Implement:**

1. Motivational Library → `/api/public/motivational`
2. Stats Library → `/api/public/stats`
