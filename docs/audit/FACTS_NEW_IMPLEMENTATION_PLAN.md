# Facts Implementation Plan - Parallel to Stats

**Date:** 2025-01-XX  
**Approach:** Create NEW `collection_facts` functionality alongside existing `collection_stats`  
**Strategy:** Build parallel system, keep stats untouched for safety

---

## Executive Summary

Instead of renaming `collection_stats` to `collection_facts`, we will:

1. **Keep `collection_stats`** - All existing functionality remains untouched
2. **Create NEW `collection_facts`** - Fresh implementation using "facts" terminology
3. **Build parallel systems** - New types, routes, components, pages
4. **Gradual migration** - Optionally migrate data/content later if desired

**Benefits:**

- ✅ Zero risk to existing functionality
- ✅ Can test new system independently
- ✅ Can run both systems in parallel
- ✅ Easy rollback if needed
- ✅ Gradual user migration possible

---

## What Needs to Be Created NEW

### 1. Database Layer

#### 1.1 Table Creation

**File:** `sql/migrations/migration_YYYYMMDD_create_collection_facts.sql`

**Action:** Create `collection_facts` table with same structure as `collection_stats`

```sql
CREATE TABLE public.collection_facts (
  -- Same columns as collection_stats
  id SERIAL PRIMARY KEY,
  fact_text TEXT NOT NULL,  -- Note: Using fact_text instead of stat_text
  fact_value TEXT,
  fact_category TEXT,
  year INTEGER,
  theme TEXT,
  category TEXT,
  attribution TEXT,
  status TEXT,
  source_content_id INTEGER,
  used_in TEXT[],
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
```

**Decision:** Use `fact_text`, `fact_value`, `fact_category` column names (cleaner than keeping `stat_*`)

#### 1.2 RLS Policies

**File:** `sql/migrations/migration_YYYYMMDD_add_rls_policies_facts_auth.sql`

**Action:** Create RLS policies for `collection_facts` (copy pattern from stats)

#### 1.3 Indexes

**Action:** Create same indexes as `collection_stats` for performance

---

### 2. Type Definitions (NEW)

#### 2.1 Collections Types

**File:** `packages/shared/src/types/collections.ts`

**Action:** Add NEW types alongside existing Stat types:

```typescript
// NEW: Facts types (parallel to Stats)
export interface Fact extends StandardContentFields {
  fact_text: string;
  fact_value: string | null;
  fact_category: string | null;
  year: number | null;
}

export interface FactCreateInput {
  fact_text: string;
  fact_value?: string;
  fact_category?: string;
  year?: number;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
}

export interface FactUpdateInput {
  fact_text?: string;
  fact_value?: string;
  fact_category?: string;
  year?: number;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
  published_at?: string;
  archived_at?: string;
}

export interface FactFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  fact_category?: string;
  year?: number;
  limit?: number;
  offset?: number;
}
```

**Note:** Keep existing `Stat` types - don't remove them!

#### 2.2 Content Type

**File:** `packages/shared/src/types/content.ts`

**Action:** Add `'fact'` as NEW content type:

```typescript
export type ContentType =
  // Existing types
  | 'stat'
  | 'greeting'
  | 'motivational'
  | 'wisdom'
  // NEW
  | 'fact' // Add this
  // Trivia types
  | 'multiple-choice'
  | 'true-false'
  | 'who-am-i';

export const ALL_CONTENT_TYPES: ContentType[] = [
  'stat', // Keep existing
  'fact', // Add new
  'greeting',
  'motivational',
  'wisdom',
  'multiple-choice',
  'true-false',
  'who-am-i',
];

export const COLLECTION_TYPES: ContentType[] = [
  'stat', // Keep existing
  'fact', // Add new
  'greeting',
  'motivational',
  'wisdom',
];

// Update getTableName function
export function getTableName(contentType: ContentType): string {
  const tableMap: Record<ContentType, string> = {
    stat: 'collection_stats', // Keep existing
    fact: 'collection_facts', // Add new
    greeting: 'collection_greetings',
    motivational: 'collection_motivational',
    wisdom: 'collection_wisdom',
    'multiple-choice': 'trivia_multiple_choice',
    'true-false': 'trivia_true_false',
    'who-am-i': 'trivia_who_am_i',
  };
  return tableMap[contentType];
}
```

---

### 3. Backend API Routes (NEW)

#### 3.1 CMS API Routes

**New Files to Create:**

1. **`apps/cms/src/app/api/facts/route.ts`**
   - `GET /api/facts` - Fetch facts with filters
   - `GET /api/facts?stats=true` - Get fact counts
   - Copy pattern from `apps/cms/src/app/api/stats/route.ts`
   - Use `collection_facts` table
   - Use `Fact` types

2. **`apps/cms/src/app/api/facts/[id]/route.ts`**
   - `PATCH /api/facts/[id]` - Update fact
   - `DELETE /api/facts/[id]` - Delete fact
   - Copy pattern from `apps/cms/src/app/api/stats/[id]/route.ts`
   - Use `collection_facts` table
   - Use `Fact` types

**Note:** Keep existing `/api/stats/*` routes - don't modify them!

#### 3.2 Public Web API Routes

**New Files to Create:**

1. **`apps/web/src/app/api/public/facts/latest/route.ts`**
   - `GET /api/public/facts/latest?limit=5`
   - Copy pattern from `apps/web/src/app/api/public/stats/latest/route.ts`
   - Use `collection_facts` table

2. **`apps/web/src/app/api/public/facts/random/route.ts`**
   - `GET /api/public/facts/random`
   - Copy pattern from `apps/web/src/app/api/public/stats/random/route.ts`
   - Use `collection_facts` table

**Note:** Keep existing `/api/public/stats/*` routes - don't modify them!

---

### 4. Frontend CMS Pages (NEW)

#### 4.1 Page Routes

**New Files to Create:**

1. **`apps/cms/src/app/facts/page.tsx`**
   - Route: `/facts`
   - Facts library list page
   - Copy pattern from `apps/cms/src/app/stats/page.tsx`
   - Use `Fact` types
   - Use `/api/facts` endpoints

2. **`apps/cms/src/app/facts/create/page.tsx`**
   - Route: `/facts/create`
   - Create new fact form
   - Copy pattern from `apps/cms/src/app/stats/create/page.tsx`
   - Use `FactCreateInput` type
   - Use `fact_text`, `fact_value`, `fact_category` fields

3. **`apps/cms/src/app/facts/[id]/page.tsx`**
   - Route: `/facts/[id]`
   - Edit/delete fact page
   - Copy pattern from `apps/cms/src/app/stats/[id]/page.tsx`
   - Use `Fact` and `FactUpdateInput` types

**Note:** Keep existing `/stats/*` pages - don't modify them!

#### 4.2 Components

**New Files to Create:**

1. **`apps/cms/src/components/facts/FactCard.tsx`**
   - Display fact card component
   - Copy pattern from `apps/cms/src/components/stats/StatCard.tsx`
   - Use `Fact` type
   - Use `fact_text`, `fact_value`, `fact_category` fields

**Note:** Keep existing `StatCard` component - don't modify it!

#### 4.3 Generator Components

**New Files to Create:**

1. **`apps/cms/src/components/generator/FactsBatchProcessingPanel.tsx`**
   - Batch processing panel for facts
   - Copy pattern from `apps/cms/src/components/generator/StatsBatchProcessingPanel.tsx`
   - Use new fact generation functions

**Note:** Keep existing `StatsBatchProcessingPanel` - don't modify it!

---

### 5. Frontend Web Pages (UPDATE)

#### 5.1 Shareables Page

**File:** `apps/web/src/app/shareables/page.tsx`

**Action:** Add facts section alongside stats section

```typescript
// Add new interface
interface Fact {
  id: number;
  fact_text: string;
  fact_value: string | null;
  fact_category: string | null;
  theme: string | null;
  attribution: string | null;
}

// Add state
const [facts, setFacts] = useState<Fact[]>([]);

// Add API call
const factsRes = await fetch(`${API_BASE}/facts/latest?limit=5`);
const factsData = await factsRes.json();
if (factsData.success) setFacts(factsData.data || []);

// Add UI section
{/* Facts Section */}
<section className="mb-16">
  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
    📊 Facts
  </h2>
  {/* ... render facts ... */}
</section>
```

**Note:** Keep existing stats section - don't remove it!

---

### 6. Generator Logic (NEW)

#### 6.1 Main Generator Actions

**File:** `apps/cms/src/app/main-generator/actions.ts`

**Action:** Add NEW functions alongside existing stats functions:

```typescript
// NEW: Facts functions (parallel to stats functions)
export async function getUnprocessedSourcesCountForFacts(): Promise<UnprocessedSourcesCount> {
  // Copy pattern from getUnprocessedSourcesCountForStats()
  // Use 'collection_facts' table
  // Use 'fact' as trackKey
}

async function findNextUnprocessedSourceForFacts(): Promise<number | null> {
  // Copy pattern from findNextUnprocessedSourceForStats()
  // Use 'collection_facts' table
}

export async function batchGenerateFactsAction(count: number): Promise<BatchProcessResult> {
  // Copy pattern from batchGenerateStatsAction()
  // Use 'fact' as trackKey
  // Use findNextUnprocessedSourceForFacts()
}
```

**Note:** Keep existing stats functions - don't modify them!

#### 6.2 Generator Tracks

**File:** `apps/cms/src/lib/generator/tracks.ts`

**Action:** Add NEW track alongside existing stats track:

```typescript
facts: {
  key: 'facts',
  label: 'Facts',
  shortLabel: 'Facts',
  description: 'Snackable fact nuggets anchored in authentic hockey data.',
  promptType: 'generator_facts',
  targetTable: 'collection_facts',
  defaultStatus: 'draft',
  adapter: {
    run: (args) => generateFactsContent(args),
    normalize: normalizeFactItem,
    validate: validateFactInput,
  },
  // ... rest of config
},
```

**Note:** Keep existing `stats` track - don't modify it!

#### 6.3 Gemini Generator

**New File:** `apps/cms/src/lib/gemini/generators/facts.ts`

**Action:** Create new generator file:

```typescript
// Copy pattern from apps/cms/src/lib/gemini/generators/stats.ts
// Rename interfaces:
//   StatsGenerationRequest → FactsGenerationRequest
//   StatsGenerationResponse → FactsGenerationResponse
//   generateStatsContent → generateFactsContent
// Update to use fact_text, fact_value, fact_category
```

**Note:** Keep existing `stats.ts` generator - don't modify it!

---

### 7. Ideation/Content Browser (UPDATE)

#### 7.1 Ideation Data

**File:** `apps/cms/src/lib/ideation/data.ts`

**Action:** Add facts to source usage tables:

```typescript
const SOURCE_USAGE_TABLES: Array<{ table: string; key: SourceUsageKey }> = [
  { table: 'collection_wisdom', key: 'wisdom' },
  { table: 'collection_greetings', key: 'greeting' },
  { table: 'collection_motivational', key: 'motivational' },
  { table: 'collection_stats', key: 'stat' }, // Keep existing
  { table: 'collection_facts', key: 'fact' }, // Add new
  { table: 'trivia_multiple_choice', key: 'multiple-choice' },
  { table: 'trivia_true_false', key: 'true-false' },
  { table: 'trivia_who_am_i', key: 'who-am-i' },
];
```

**Note:** Keep existing stats entry - don't remove it!

#### 7.2 Content Browser API

**File:** `apps/cms/src/app/api/content-browser/route.ts`

**Action:** Add facts to source usage tables (same as above)

---

### 8. Navigation & UI (UPDATE)

#### 8.1 Shell Navigation

**File:** `apps/cms/src/components/layout/shell/ShellChrome.tsx`

**Action:** Add facts navigation item:

```typescript
{ label: 'Stats', href: '/stats', description: 'Shareable hockey stat nuggets.' },  // Keep existing
{ label: 'Facts', href: '/facts', description: 'Shareable hockey fact nuggets.' },  // Add new
```

**Note:** Keep existing Stats navigation - don't remove it!

#### 8.2 Header Navigation

**Files:**

- `apps/cms/src/components/layout/Header.tsx`
- `apps/cms/src/components/layout/HeaderWrapper.tsx`

**Action:** Add facts navigation link alongside stats

---

### 9. Main Generator Workspace (UPDATE)

#### 9.1 Generator Workspace

**File:** `apps/cms/src/components/generator/MainGeneratorWorkspace.tsx`

**Action:** Add facts track to workspace:

```typescript
// Add to tracks array
{ title: 'Fact • Road power-play conversion', track: 'Facts', status: 'Needs review' },

// Add to themeStats/tagStats if needed
facts: IdeationThemeFact[];  // New type if needed
tagFacts: IdeationTagFact[];  // New type if needed

// Add FactsBatchProcessingPanel component
<FactsBatchProcessingPanel />
```

**Note:** Keep existing stats track - don't remove it!

---

## Implementation Checklist

### Phase 1: Database Setup

- [ ] Create `collection_facts` table migration
- [ ] Create RLS policies for `collection_facts`
- [ ] Create indexes for `collection_facts`
- [ ] Test database access

### Phase 2: Type Definitions

- [ ] Add `Fact`, `FactCreateInput`, `FactUpdateInput` types to `collections.ts`
- [ ] Add `'fact'` to `ContentType` in `content.ts`
- [ ] Update `getTableName()` to include facts
- [ ] Update `COLLECTION_TYPES` array
- [ ] Run TypeScript compiler to verify

### Phase 3: Backend APIs

- [ ] Create `apps/cms/src/app/api/facts/route.ts`
- [ ] Create `apps/cms/src/app/api/facts/[id]/route.ts`
- [ ] Create `apps/web/src/app/api/public/facts/latest/route.ts`
- [ ] Create `apps/web/src/app/api/public/facts/random/route.ts`
- [ ] Test all API endpoints

### Phase 4: Frontend CMS

- [ ] Create `apps/cms/src/app/facts/page.tsx`
- [ ] Create `apps/cms/src/app/facts/create/page.tsx`
- [ ] Create `apps/cms/src/app/facts/[id]/page.tsx`
- [ ] Create `apps/cms/src/components/facts/FactCard.tsx`
- [ ] Create `apps/cms/src/components/generator/FactsBatchProcessingPanel.tsx`
- [ ] Update navigation components
- [ ] Test all CMS pages

### Phase 5: Frontend Web

- [ ] Update `apps/web/src/app/shareables/page.tsx` to include facts section
- [ ] Test shareables page

### Phase 6: Generator Logic

- [ ] Create `apps/cms/src/lib/gemini/generators/facts.ts`
- [ ] Add fact generation functions to `main-generator/actions.ts`
- [ ] Add facts track to `generator/tracks.ts`
- [ ] Update `MainGeneratorWorkspace.tsx`
- [ ] Test batch processing

### Phase 7: Content Browser

- [ ] Update `ideation/data.ts` to include facts
- [ ] Update `api/content-browser/route.ts` to include facts
- [ ] Test content browser

### Phase 8: Testing & Documentation

- [ ] Test complete facts workflow
- [ ] Verify stats still works
- [ ] Update documentation
- [ ] Create migration guide (if migrating data later)

---

## Key Principles

1. **Never modify existing stats code** - Only create new facts code
2. **Copy patterns** - Use stats as template, adapt for facts
3. **Parallel systems** - Both stats and facts can coexist
4. **Independent testing** - Test facts without affecting stats
5. **Gradual migration** - Optionally migrate content/data later

---

## Data Migration (Optional, Later)

If you want to migrate existing stats data to facts:

1. Create migration script to copy data from `collection_stats` to `collection_facts`
2. Map `stat_text` → `fact_text`, `stat_value` → `fact_value`, etc.
3. Run migration when ready
4. Keep both tables (or drop stats after verification)

**This is optional and can be done later!**

---

## Benefits of This Approach

✅ **Zero Risk** - Existing stats functionality untouched  
✅ **Independent Testing** - Test facts system separately  
✅ **Easy Rollback** - Just don't use facts if issues arise  
✅ **Gradual Adoption** - Use facts for new content, keep stats for old  
✅ **Clear Separation** - Easy to see what's new vs old  
✅ **No Breaking Changes** - All existing APIs/routes work

---

## Next Steps

1. Review this plan
2. Start with Phase 1 (Database Setup)
3. Build incrementally, testing as you go
4. Keep stats system running in parallel
5. Optionally migrate data later if desired

This approach is **much safer** than renaming and allows you to build confidence in the new system before committing fully!
