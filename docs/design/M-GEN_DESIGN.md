# M-Gen (Motivational Generation) Design Documentation

**Last Updated:** 2025-01-23  
**Purpose:** Design documentation for Motivational Generation (M-Gen) route, documenting the implementation and evolution of the motivational content generation system.

## Overview

M-Gen is a content generation system that uses Gemini AI to extract motivational content from source articles. It follows the same pattern as W-Gen and F-Gen but focuses on creative retelling and motivational parables rather than direct quotes.

### Key Features

- **AI-Powered Generation**: Uses Gemini 2.0 Flash to extract motivational content from sources
- **Creative Retelling**: Emphasizes storytelling and myth-making over direct quotes
- **Source Tracking**: Prevents duplicate usage of sources
- **Content Analysis**: Scores sources for motivational extraction potential
- **Fail-Safe Filtering**: Sources disappear from dropdown after use

### Route

- **M-Gen** (`/m-gen`): Generates hockey motivational content → `collection_hockey_motivate`

## Database Schema

### Collection Table

#### `collection_hockey_motivate`
```sql
- id (SERIAL PRIMARY KEY)
- quote (TEXT NOT NULL) -- The motivational message/parable
- theme (TEXT) -- Single word summary (e.g., sacrifice, vision, guts)
- category (TEXT) -- Classification (Grit, Team, Focus, Pain, Glory, Silence)
- attribution (TEXT) -- Concept title or source (e.g., "The Yzerman Shift")
- status (TEXT DEFAULT 'draft')
- source_content_id (INTEGER REFERENCES source_content_ingested(id))
- created_at, updated_at
```

**Note:** The `quote` field stores the motivational message, and `attribution` stores the concept title (like "The Yzerman Shift") from the Myth Maker prompt.

## Prompt Evolution

### Initial Prompt: "Bench Boss"
- **Style**: Direct quotes with attribution
- **Output Fields**: `content_text`, `category`, `attribution`, `theme`
- **Categories**: Perseverance, Teamwork, Leadership, Hard Work, Mindset, Resilience, Discipline
- **Focus**: Journalistic quotes with proper attribution

### Current Prompt: "Bench Boss: Myth Maker"
- **Style**: Creative retelling and parables
- **Output Fields**: `concept_title`, `message`, `category`, `theme`
- **Categories**: Grit, Team, Focus, Pain, Glory, Silence
- **Focus**: Storytelling and motivational directives, not direct quotes

**Key Differences:**
- Uses `message` instead of `content_text` or `quote`
- Uses `concept_title` instead of `attribution` (mapped to `attribution` field in DB)
- Emphasizes creative license and myth-making
- Addresses user directly ("You think you're tired?")
- SMS-ready, under 2 sentences

## Field Mapping & Normalization

The normalization function (`normalizeMotivateItem`) handles both prompt formats:

```typescript
// Primary field (message/quote) - tries multiple variations
const quote =
  coerceString(item.message) ??           // New "Myth Maker" prompt
  coerceString(item.quote) ??             // Old "Bench Boss" prompt
  coerceString(item.content_text) ??      // Alternative format
  coerceString(item.text) ??              // Fallback
  // ... other variations

// Attribution/Concept Title mapping
const attribution = 
  coerceString(item.concept_title) ??     // New "Myth Maker" prompt
  coerceString(item.attribution) ??       // Old "Bench Boss" prompt
  coerceString(item.author) ??            // Fallback
  null;
```

**Database Storage:**
- `message` → stored in `quote` column
- `concept_title` → stored in `attribution` column
- `category` → stored in `category` column
- `theme` → stored in `theme` column

## Content Analysis

The analysis function is optimized for motivational content:

- **Quote Detection**: Counts quotation marks to find direct quotes
- **Motivational Keywords**: Looks for words like "inspire", "motivate", "determination", "resilience", "overcome", etc.
- **Scoring**: Emphasizes quote count and motivational language over statistics/numbers

**Scoring Weights:**
- Quote count: Up to 25 points
- Motivational indicators: Up to 30 points
- Word/sentence count: Standard scoring

## Key Implementation Details

### Source Filtering Logic
- Checks both `collection_hockey_motivate` and `collection_motivational` tables
- Uses `used_for` array as secondary fail-safe
- Matches pattern from W-Gen/F-Gen

### UI Behavior
- **Optimistic Updates**: Removes source from dropdown immediately after generation
- **Item Persistence**: Keeps generated items visible even after source is removed from available list
- **Source Selection**: Doesn't auto-change source after generation (preserves generated items display)

### Bug Fixes Applied
- Fixed issue where generated items would disappear due to `useEffect` clearing items when source changed
- Added `justGeneratedSourceId` flag to prevent clearing items immediately after generation
- Ensured items are set before any source selection changes

## Migration History

1. **2025-01-23**: Created `collection_hockey_motivate` table
2. **2025-01-23**: Inserted initial "Bench Boss" prompt
3. **2025-01-23**: Updated prompt to "Bench Boss: Myth Maker"
4. **2025-01-23**: Added `created_at` and `updated_at` to `collection_prompts` table

## Differences from W-Gen/F-Gen

1. **Creative License**: Myth Maker prompt allows creative retelling, not just extraction
2. **Field Names**: Uses `message` and `concept_title` instead of `content_text` and `quote`
3. **Category Values**: Different set (Grit, Team, Focus, Pain, Glory, Silence)
4. **No Attribution Required**: Attribution/concept title/concept, not person/event
5. **Direct Address**: Content often addresses user directly ("You think...")

## Files Created/Modified

### New Files
- `src/app/m-gen/actions.ts` - Server actions
- `src/lib/gemini/generators/motivate.ts` - Gemini API wrapper
- `src/components/m-gen/MGenWorkspace.tsx` - Client component
- `src/app/m-gen/page.tsx` - Page route
- `sql/migrations/migration_20250123_create_collection_hockey_motivate.sql` - Table creation
- `sql/migrations/migration_20250123_insert_motivate_prompt.sql` - Initial prompt
- `sql/migrations/migration_20250123_update_motivate_prompt_myth_maker.sql` - Prompt update
- `sql/migrations/migration_20250123_add_timestamps_to_collection_prompts.sql` - Timestamp fields

### Modified Files
- `src/shared/types/collections.ts` - Added `HockeyMotivate` types
- `src/lib/ideation/data.ts` - Added to `SOURCE_USAGE_TABLES`
- `src/app/api/content-browser/route.ts` - Added to `SOURCE_USAGE_TABLES`
- `src/components/layout/shell/ShellChrome.tsx` - Added navigation route

## Testing Notes

- Initial generation worked correctly (5 quotes generated)
- Database insertion successful
- UI display issue fixed (items now persist after generation)
- Prompt update successful (Bench Boss → Bench Boss: Myth Maker)
- Normalization handles both prompt formats correctly

## Future Considerations

- Consider adding `concept_title` as separate field if needed (currently stored in `attribution`)
- May want to add validation for category values (currently accepts any string)
- Consider adding prompt version tracking if prompts evolve further

---

**Reference:** See `docs/design/W-GEN_F-GEN_DESIGN.md` for the base pattern that M-Gen follows.






