# W-Gen and F-Gen Route Design Documentation

**Last Updated:** 2025-01-22  
**Purpose:** Design documentation for Wisdom Generation (W-Gen) and Facts Generation (F-Gen) routes, to be used as a reference for implementing similar generation routes (e.g., M-Gen for motivational content

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Key Components](#key-components)
5. [Generation Flow](#generation-flow)
6. [Source Management](#source-management)
7. [Prompt System](#prompt-system)
8. [Implementation Checklist](#implementation-checklist)



## Overview

W-Gen and F-Gen are content generation systems that use Gemini AI to extract structured content from source articles. They follow a consistent pattern that can be replicated for other content types.

### Key Features

- **AI-Powered Generation**: Uses Gemini 2.0 Flash to extract content from sources
- **Source Tracking**: Prevents duplicate usage of sources
- **Content Analysis**: Scores sources for extraction potential
- **Fail-Safe Filtering**: Sources disappear from dropdown after use
- **Temporal Anchoring**: (F-Gen) Converts relative dates to absolute dates for trivia

### Routes

- **W-Gen** (`/w-gen`): Generates hockey wisdom content → `collection_hockey_wisdom`
- **F-Gen** (`/f-gen`): Generates hockey facts content → `collection_hockey_facts`



## Architecture

### File Structure

```
src/
├── app/
│   ├── w-gen/
│   │   ├── actions.ts          # Server actions (fetch, generate, analyze)
│   │   └── page.tsx            # Page route (server component)
│   └── f-gen/
│       ├── actions.ts          # Server actions (fetch, generate, analyze)
│       └── page.tsx            # Page route (server component)
├── components/
│   ├── w-gen/
│   │   └── WGenWorkspace.tsx  # Client component (UI)
│   └── f-gen/
│       └── FGenWorkspace.tsx   # Client component (UI)
└── lib/
    └── gemini/
        └── generators/
            ├── wisdom.ts       # Gemini API wrapper for wisdom
            └── facts.ts         # Gemini API wrapper for facts
```

### Component Hierarchy

```
Page (Server Component)
  └── Workspace (Client Component)
      ├── Source Selection
      ├── Content Analysis
      ├── Prompt Display
      ├── Generate Button
      ├── System Messages
      └── Generated Items List
```



## Database Schema

### Collection Tables

#### `collection_hockey_wisdom`
```sql
- id (SERIAL PRIMARY KEY)
- title (TEXT)
- musing (TEXT NOT NULL)
- from_the_box (TEXT NOT NULL)
- theme (TEXT NOT NULL) -- Must be one of: "The Grind", "The Room", "The Code", "The Flow", "The Stripes", "The Chirp"
- status (TEXT DEFAULT 'draft')
- source_content_id (INTEGER REFERENCES source_content_ingested(id))
- created_at, updated_at
```

#### `collection_hockey_facts`
```sql
- id (SERIAL PRIMARY KEY)
- text (TEXT NOT NULL)
- category (TEXT) -- milestone, anomaly, record, on-this-day, franchise, obscure
- theme (TEXT) -- scoring, defense, goaltending, awards, coaching, special-teams, business
- status (TEXT DEFAULT 'draft')
- source_content_id (INTEGER REFERENCES source_content_ingested(id))
- created_at, updated_at
```

### Prompt Table

#### `collection_prompts`
```sql
- id (SERIAL PRIMARY KEY)
- prompt_name (TEXT NOT NULL)
- prompt_content (TEXT NOT NULL)
- content_type (TEXT) -- 'wisdom', 'fact', etc.
- created_at, updated_at
```

**Current Prompts:**
- `content_type = 'wisdom'`: "Penalty Box Philosopher"
- `content_type = 'fact'`: "Data Historian"

### Source Tracking

#### `source_content_ingested.used_for`
- Array field tracking which content types have used this source
- Example: `['wisdom', 'fact']`
- Used as secondary fail-safe check (primary is checking collection tables)



## Key Components

### 1. Server Actions (`actions.ts`)

#### Core Functions

**Prompt Fetching:**
```typescript
getWisdomPrompt() / getFactsPrompt()
- Fetches prompt from collection_prompts WHERE content_type = 'wisdom'/'fact'
- Returns: { success, prompt?, error? }
```

**Source Management:**
```typescript
getAvailableSourcesForWisdom() / getAvailableSourcesForFacts()
- Returns sources NOT yet used for generation
- FAIL-SAFE: Checks both collection tables AND used_for array
- Filters out sources that have items in collection_hockey_wisdom/facts
```

**Content Analysis:**
```typescript
analyzeSourceContent(sourceId)
- Scores source for extraction potential (0-100)
- Returns: wordCount, sentenceCount, extractionScore, assessment, insights
- Assessment: 'excellent' | 'good' | 'fair' | 'poor'
```

**Generation:**
```typescript
generateWisdomAction(sourceId) / generateFactsAction(sourceId)
- Validates source hasn't been used
- Fetches prompt and source content
- Calls Gemini API via generator
- Normalizes response
- Saves to collection table
- Marks source as used
- Returns: { success, message, itemCount, generatedItems }
```

**Duplicate Prevention:**
```typescript
isSourceUsedForWisdom(sourceId) / isSourceUsedForFacts(sourceId)
- Checks collection table for existing items
- Checks used_for array
- Returns: boolean

markSourceAsUsedForWisdom(sourceId) / markSourceAsUsedForFacts(sourceId)
- Updates used_for array in source_content_ingested
- Adds 'wisdom'/'fact' to array if not present
```

### 2. Gemini Generators (`lib/gemini/generators/`)

**Pattern:**
```typescript
generateWisdomContent(request) / generateFactsContent(request)
- Input: { sourceContent, customPrompt, articleDate? }
- Processes prompt placeholders ({{ARTICLE_DATE}}, {{PASTE_YOUR_CONTENT_HERE}})
- Calls gemini.models.generateContent()
- Parses JSON response
- Validates "items" array exists
- Returns: { success, data?, error? }
```

**Placeholder Processing (F-Gen):**
- `{{ARTICLE_DATE}}` → Replaced with source's `created_at` date (YYYY-MM-DD)
- `{{PASTE_YOUR_CONTENT_HERE}}` → Replaced with source content
- Falls back to appending source content if no placeholders found

### 3. Normalization Functions

**Purpose:** Convert Gemini's flexible JSON output into strict schema

**Wisdom Normalization:**
```typescript
normalizeWisdomItem(item, sourceId)
- Tries multiple field names: title/content_title/heading
- Tries multiple field names: musing/musings/body/content_text
- Tries multiple field names: from_the_box/pull_quote/highlight/quote
- Validates theme is one of 6 allowed values (strict)
- Returns normalized object or null if validation fails
```

**Facts Normalization:**
```typescript
normalizeFactItem(item, sourceId)
- Tries multiple field names: text/fact_text/content_text/fact/statement/summary
- Category and theme are optional
- Returns normalized object or null if text is missing
```

### 4. Client Components (`Workspace.tsx`)

**State Management:**
- `availableSources`: Array of sources (updates after generation)
- `selectedSourceId`: Currently selected source
- `systemMessages`: Array of status messages
- `contentAnalysis`: Analysis results for selected source
- `generatedItems`: List of generated items for selected source

**Key Behaviors:**
- **Auto-refresh**: After successful generation, immediately removes used source from dropdown
- **Source Analysis**: Automatically analyzes source when selected
- **Item Loading**: Loads existing generated items when source changes

**Optimistic Updates:**
```typescript
// Immediately remove source from dropdown
setAvailableSources((prev) => prev.filter((s) => s.id !== selectedSourceId));

// Then refresh from server after 500ms delay
setTimeout(() => {
  getAvailableSourcesForFacts().then(...);
}, 500);
```



## Generation Flow

### Step-by-Step Process

1. **User Selects Source**
   - Component calls `analyzeSourceContent(sourceId)`
   - Displays extraction potential score and insights
   - Loads existing generated items for that source

2. **User Clicks "Generate It"**
   - Validates source hasn't been used (`isSourceUsedFor...`)
   - Fetches prompt from `collection_prompts`
   - Fetches source content from `source_content_ingested`

3. **Gemini API Call**
   - Processes prompt placeholders
   - Sends to Gemini with `responseMimeType: 'application/json'`
   - Expects response: `{ "items": [...] }`

4. **Normalization**
   - Maps each item through normalization function
   - Filters out items that fail validation
   - Logs failures for debugging

5. **Database Save**
   - Inserts normalized items into collection table
   - Marks source as used (`markSourceAsUsedFor...`)

6. **UI Update**
   - Optimistically removes source from dropdown
   - Refreshes source list from server
   - Updates generated items display
   - Shows success message

### Error Handling

- **No items returned**: Clear message explaining possible causes
- **All items failed validation**: Shows sample keys and required fields
- **Source already used**: Prevents generation, suggests different source
- **Database errors**: Shows specific error message



## Source Management

### Fail-Safe Filtering System

**Primary Check:** Query collection tables directly
```typescript
// Check both tables (hockey-specific and generic)
const factTables = ['collection_hockey_facts', 'collection_facts'];
await Promise.all(
  factTables.map(async (table) => {
    const { data } = await supabase
      .from(table)
      .select('source_content_id')
      .not('source_content_id', 'is', null);
    // Add source IDs to processedSourceIds Set
  })
);
```

**Secondary Check:** Check `used_for` array
```typescript
const usedFor = Array.isArray(source.used_for)
  ? source.used_for.map((v) => String(v).toLowerCase())
  : [];

if (usedFor.includes('fact') || usedFor.includes('f-gen')) {
  continue; // Skip this source
}
```

**Why Both Checks?**
- Collection table check is most reliable (if items exist, source was used)
- `used_for` array is backup (catches edge cases)
- Matches pattern used by badging system (`SOURCE_USAGE_TABLES`)

### Badge System Integration

The badging system uses `SOURCE_USAGE_TABLES` in `src/lib/ideation/data.ts`:

```typescript
const SOURCE_USAGE_TABLES = [
  { table: 'collection_hockey_wisdom', key: 'wisdom' },
  { table: 'collection_hockey_facts', key: 'fact' },
  // ... other tables
];
```

**Important:** When adding a new generation route, update `SOURCE_USAGE_TABLES` to include the new collection table so badges display correctly.



## Prompt System

### Prompt Structure

Prompts are stored in `collection_prompts` with `content_type` matching the generation type.

### Prompt Requirements

**JSON Output Format:**
```json
{
  "items": [
    {
      "content_text": "...",  // or "text", "musing", etc. (normalized)
      "category": "...",
      "theme": "..."
    }
  ]
}
```

**Key Instructions:**
- Must output valid JSON only (no markdown, no conversational text)
- Must have "items" array
- Each item must have required fields (varies by content type)

### W-Gen Prompt: "Penalty Box Philosopher"

**Fields:**
- `content_title` → normalized to `title`
- `musings` → normalized to `musing`
- `from_the_box` → normalized to `from_the_box`
- `theme` → Must be one of: "The Grind", "The Room", "The Code", "The Flow", "The Stripes", "The Chirp"

### F-Gen Prompt: "Data Historian"

**Special Features:**
- **Temporal Anchoring**: Converts "this season" → "2023-24 season"
- **Placeholders**: `{{ARTICLE_DATE}}` and `{{PASTE_YOUR_CONTENT_HERE}}`
- **Trivia-Focused**: Emphasizes specificity, anomalies, self-contained facts

**Fields:**
- `content_text` → normalized to `text`
- `category` → milestone, anomaly, record, on-this-day, franchise, obscure
- `theme` → scoring, defense, goaltending, awards, coaching, special-teams, business

**Placeholder Processing:**
```typescript
// Replace {{ARTICLE_DATE}} with source's created_at
const dateToUse = articleDate 
  ? new Date(articleDate).toISOString().split('T')[0]
  : new Date().toISOString().split('T')[0];

processedPrompt = processedPrompt.replace(/\{\{ARTICLE_DATE\}\}/g, dateToUse);
processedPrompt = processedPrompt.replace(/\{\{PASTE_YOUR_CONTENT_HERE\}\}/g, sourceContent);
```



## Implementation Checklist

When implementing a new generation route (e.g., M-Gen for motivational), follow this checklist:

### 1. Database Setup

- [ ] Create migration for collection table (e.g., `collection_hockey_motivational`)
- [ ] Add indexes: `status`, `theme`, `source_content_id`
- [ ] Add trigger for `updated_at`
- [ ] Add table to `SOURCE_USAGE_TABLES` in `src/lib/ideation/data.ts`
- [ ] Add table to `SOURCE_USAGE_TABLES` in `src/app/api/content-browser/route.ts`

### 2. TypeScript Types

- [ ] Add types to `src/shared/types/collections.ts`:
  - [ ] `Motivational` interface
  - [ ] `MotivationalCreateInput`
  - [ ] `MotivationalUpdateInput`
  - [ ] `MotivationalFetchParams`

### 3. Server Actions (`src/app/m-gen/actions.ts`)

- [ ] `getMotivationalPrompt()` - Fetch prompt where `content_type = 'motivational'`
- [ ] `getAvailableSourcesForMotivational()` - Filter unused sources
- [ ] `analyzeSourceContent()` - Score source for extraction potential
- [ ] `normalizeMotivationalItem()` - Normalize Gemini output
- [ ] `isSourceUsedForMotivational()` - Check if source used
- [ ] `markSourceAsUsedForMotivational()` - Mark source as used
- [ ] `generateMotivationalAction()` - Main generation function
- [ ] `getGeneratedMotivationalItems()` - Fetch generated items for source
- [ ] `generateSourcesReport()` - Bulk analysis (optional)

### 4. Gemini Generator (`src/lib/gemini/generators/motivational.ts`)

- [ ] `MotivationalGenerationRequest` interface
- [ ] `MotivationalGenerationResponse` interface
- [ ] `generateMotivationalContent()` function
- [ ] Process placeholders if needed
- [ ] Validate JSON response structure

### 5. Client Component (`src/components/m-gen/MGenWorkspace.tsx`)

- [ ] Copy structure from `FGenWorkspace.tsx` or `WGenWorkspace.tsx`
- [ ] Update imports and types
- [ ] Implement optimistic source removal
- [ ] Add source refresh after generation
- [ ] Update UI labels and messages

### 6. Page Route (`src/app/m-gen/page.tsx`)

- [ ] Fetch initial prompt and sources
- [ ] Render `MGenWorkspace` component
- [ ] Handle errors

### 7. Navigation

- [ ] Add route to `src/components/layout/shell/ShellChrome.tsx`
- [ ] Add description and href

### 8. Prompt Migration

- [ ] Create migration to insert prompt into `collection_prompts` table
- [ ] Set `content_type = 'motivational'`
- [ ] Include JSON schema instructions
- [ ] Include few-shot examples

### 9. Testing

- [ ] Test source filtering (used sources don't appear)
- [ ] Test generation with valid source
- [ ] Test normalization with various Gemini outputs
- [ ] Test error handling (no items, validation failures)
- [ ] Test optimistic UI updates
- [ ] Test badge display on source content

### 10. Content Analysis (Optional)

- [ ] Update scoring logic if needed (currently uses fact-based scoring)
- [ ] Adjust keywords/indicators for motivational content
- [ ] Test scoring accuracy



## Key Patterns to Follow

### 1. Fail-Safe Source Filtering

Always check both:
- Collection table for existing items (primary)
- `used_for` array (secondary backup)

### 2. Normalization Flexibility

Accept multiple field name variations:
```typescript
const text =
  coerceString(item.text) ??
  coerceString(item.content_text) ??
  coerceString(item.fact_text) ??
  null;
```

### 3. Optimistic UI Updates

Remove source immediately, then refresh:
```typescript
// Immediate
setAvailableSources((prev) => prev.filter((s) => s.id !== sourceId));

// Then sync with server
setTimeout(() => {
  getAvailableSourcesForMotivational().then(...);
}, 500);
```

### 4. Error Messages

Be specific about what failed:
- "Gemini did not generate any items" vs "All items failed validation"
- Show sample keys when validation fails
- Log details to console for debugging

### 5. Badge Integration

Always update `SOURCE_USAGE_TABLES` in both:
- `src/lib/ideation/data.ts`
- `src/app/api/content-browser/route.ts`



## Common Pitfalls

1. **Forgetting to update `SOURCE_USAGE_TABLES`**: Badges won't show correctly
2. **Strict normalization**: Gemini output varies, be flexible
3. **Not checking both collection tables**: May miss used sources
4. **Missing optimistic update**: User sees stale source list
5. **Not handling placeholder processing**: Prompt won't work correctly
6. **Forgetting to mark source as used**: Can generate duplicates



## Example: Quick Reference

### Creating a New Route (M-Gen)

```typescript
// 1. Create actions.ts
export async function generateMotivationalAction(sourceId: number) {
  // Check duplicate
  if (await isSourceUsedForMotivational(sourceId)) {
    return { success: false, message: 'Source already used' };
  }
  
  // Fetch prompt and source
  const prompt = await getMotivationalPrompt();
  const source = await getSourceById(sourceId);
  
  // Generate
  const result = await generateMotivationalContent({
    sourceContent: source.content_text,
    customPrompt: prompt.prompt_content,
  });
  
  // Normalize and save
  const normalized = result.data.map(item => normalizeMotivationalItem(item, sourceId));
  await supabase.from('collection_hockey_motivational').insert(normalized);
  
  // Mark as used
  await markSourceAsUsedForMotivational(sourceId);
  
  return { success: true, message: 'Generated!', itemCount: normalized.length };
}
```

### Normalization Pattern

```typescript
function normalizeMotivationalItem(item: Record<string, unknown>, sourceId: number) {
  const text = coerceString(item.text) ?? coerceString(item.content_text) ?? null;
  if (!text) return null;
  
  return {
    text,
    category: coerceString(item.category) ?? null,
    theme: coerceString(item.theme) ?? null,
    status: 'draft',
    source_content_id: sourceId,
  };
}
```



## Questions?

When implementing a new route, refer to:
- `src/app/w-gen/actions.ts` - Complete server actions example
- `src/components/w-gen/WGenWorkspace.tsx` - Complete UI example
- `src/lib/gemini/generators/wisdom.ts` - Gemini integration example
- `sql/migrations/migration_20250122_create_collection_hockey_facts.sql` - Table schema example

---

**Note:** This document should be updated as patterns evolve or new features are added.

