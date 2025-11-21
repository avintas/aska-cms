# Stats to Facts Table Rename - Comprehensive Impact Audit

**Date:** 2025-01-XX  
**Purpose:** Assess the complete system impact of renaming `collection_stats` table to `collection_facts`

## Executive Summary

This audit identifies **66+ direct references** to `collection_stats` across the codebase, plus numerous indirect references through:

- Type definitions (`Stat`, `StatCreateInput`, `StatUpdateInput`)
- API routes (`/api/stats/*`, `/api/public/stats/*`)
- Frontend routes (`/stats/*`)
- Component names (`StatCard`, `StatsBatchProcessingPanel`)
- Function names (`getUnprocessedSourcesCountForStats`, `batchGenerateStatsAction`)
- Documentation references

**Assessment:** This is a **massive undertaking** affecting every layer of the application. However, it is **systematic and achievable** with careful planning.

---

## Impact Categories

### 1. Database Layer (HIGH IMPACT)

#### 1.1 Table Name

- **Current:** `collection_stats`
- **Target:** `collection_facts`
- **Files Affected:**
  - `sql/migrations/migration_20250107_add_rls_policies_stats_auth.sql` (9 references)
  - `sql/migrations/migration_20251119_copy_stat_to_facts.sql` (15+ references - already exists!)
  - `sql/maintenance/truncate_generated_content.sql` (1 reference)

#### 1.2 RLS Policies

- **Current Policies:**
  - "Authenticated users can select stats"
  - "Authenticated users can insert stats"
  - "Authenticated users can update stats"
  - "Authenticated users can delete stats"
- **Action Required:** Rename all policy names and update table references

#### 1.3 Sequences

- Any SERIAL/BIGSERIAL columns will have sequences named `collection_stats_*_seq`
- **Action Required:** Rename sequences to `collection_facts_*_seq`

#### 1.4 Indexes & Constraints

- All indexes and constraints will have names referencing `collection_stats`
- **Action Required:** Rename for consistency (optional but recommended)

#### 1.5 Foreign Key References

- Check for any foreign keys pointing TO `collection_stats`
- Check for any foreign keys FROM `collection_stats` to other tables
- **Action Required:** Update foreign key definitions

---

### 2. Backend API Layer (HIGH IMPACT)

#### 2.1 CMS API Routes

**Files to Modify:**

- `apps/cms/src/app/api/stats/route.ts` (2 references to `collection_stats`)
- `apps/cms/src/app/api/stats/[id]/route.ts` (2 references to `collection_stats`)

**Route Paths:**

- `GET /api/stats` - Fetch stats with filters
- `GET /api/stats?stats=true` - Get stats counts
- `PATCH /api/stats/[id]` - Update stat
- `DELETE /api/stats/[id]` - Delete stat

**Decision Required:**

- Option A: Keep route paths as `/api/stats/*` (recommended for backward compatibility)
- Option B: Rename to `/api/facts/*` (breaking change)

#### 2.2 Public Web API Routes

**Files to Modify:**

- `apps/web/src/app/api/public/stats/latest/route.ts` (1 reference)
- `apps/web/src/app/api/public/stats/random/route.ts` (2 references)

**Route Paths:**

- `GET /api/public/stats/latest?limit=5`
- `GET /api/public/stats/random`

**Decision Required:**

- Option A: Keep route paths as `/api/public/stats/*` (recommended)
- Option B: Rename to `/api/public/facts/*` (breaking change for external consumers)

---

### 3. Frontend CMS Pages (HIGH IMPACT)

#### 3.1 Page Routes

**Files to Modify:**

- `apps/cms/src/app/stats/page.tsx` - List page
- `apps/cms/src/app/stats/create/page.tsx` - Create form
- `apps/cms/src/app/stats/[id]/page.tsx` - Edit/delete page

**Route Paths:**

- `/stats` - Stats library list
- `/stats/create` - Create new stat
- `/stats/[id]` - Edit stat

**Decision Required:**

- Option A: Keep routes as `/stats/*` (recommended)
- Option B: Rename to `/facts/*` (requires redirects)

#### 3.2 Components

**Files to Modify:**

- `apps/cms/src/components/stats/StatCard.tsx` (uses `stat.stat_text`, `stat.stat_value`, etc.)
- `apps/cms/src/components/generator/StatsBatchProcessingPanel.tsx` (component name + function calls)

**Component Names:**

- `StatCard` → `FactCard`?
- `StatsBatchProcessingPanel` → `FactsBatchProcessingPanel`?

---

### 4. Frontend Web Pages (MEDIUM IMPACT)

#### 4.1 Public Pages

**Files to Modify:**

- `apps/web/src/app/shareables/page.tsx`
  - Interface `Stat` (lines 20-27)
  - State variable `stats` (line 43)
  - API call to `/api/public/stats/latest` (line 54)
  - UI rendering (lines 185-224)

**Display Text:**

- "📊 Did you know?" section
- "Interesting hockey statistics and facts"
- "No stats available yet."

---

### 5. Type Definitions (HIGH IMPACT)

#### 5.1 Shared Types Package

**File:** `packages/shared/src/types/collections.ts`

**Types to Rename:**

- `Stat` → `Fact`
- `StatCreateInput` → `FactCreateInput`
- `StatUpdateInput` → `FactUpdateInput`
- `StatFetchParams` → `FactFetchParams`

**Fields to Consider:**

- `stat_text` → `fact_text`?
- `stat_value` → `fact_value`?
- `stat_category` → `fact_category`?

**Decision Required:**

- **CRITICAL:** Do we rename the database columns (`stat_text`, `stat_value`, `stat_category`) or keep them?
- If keeping column names: Only rename TypeScript types
- If renaming columns: Much larger migration required

#### 5.2 Content Type Mapping

**File:** `packages/shared/src/types/content.ts`

**Current:**

```typescript
export type ContentType = 'stat' | 'greeting' | 'motivational' | 'wisdom' | ...
export const COLLECTION_TYPES: ContentType[] = ['stat', ...]
export function getTableName(contentType: ContentType): string {
  const tableMap: Record<ContentType, string> = {
    stat: 'collection_stats',
    ...
  }
}
```

**Action Required:**

- Change `'stat'` to `'fact'` in `ContentType`
- Update `getTableName()` mapping
- Update `COLLECTION_TYPES` array

---

### 6. Generator/Processing Logic (HIGH IMPACT)

#### 6.1 Main Generator Actions

**File:** `apps/cms/src/app/main-generator/actions.ts`

**Functions:**

- `getUnprocessedSourcesCountForStats()` → `getUnprocessedSourcesCountForFacts()`
- `findNextUnprocessedSourceForStats()` → `findNextUnprocessedSourceForFacts()`
- `batchGenerateStatsAction()` → `batchGenerateFactsAction()`

**References:**

- Line 32: `stats: ['stat_text']`
- Line 951: `.from('collection_stats')`
- Line 1008: `.from('collection_stats')`
- Line 1089: `trackKey: 'stats'`

#### 6.2 Generator Tracks

**File:** `apps/cms/src/lib/generator/tracks.ts`

**Current:**

```typescript
stats: {
  key: 'stats',
  label: 'Stats',
  targetTable: 'collection_stats',
  ...
}
```

**Action Required:**

- Update `key`, `label`, `targetTable`
- Update adapter references

#### 6.3 Gemini Generator

**File:** `apps/cms/src/lib/gemini/generators/stats.ts`

**Interfaces:**

- `StatsGenerationRequest` → `FactsGenerationRequest`?
- `StatsGenerationResponse` → `FactsGenerationResponse`?
- `generateStatsContent()` → `generateFactsContent()`?

---

### 7. Ideation/Content Browser (MEDIUM IMPACT)

#### 7.1 Ideation Data

**File:** `apps/cms/src/lib/ideation/data.ts`

**Current:**

```typescript
{ table: 'collection_stats', key: 'stat' }
```

**Action Required:**

- Update table name
- Consider updating key from `'stat'` to `'fact'`

#### 7.2 Content Browser API

**File:** `apps/cms/src/app/api/content-browser/route.ts`

**Current:**

```typescript
{ table: 'collection_stats', key: 'stat' }
```

**Action Required:**

- Update table name
- Update key if changing content type

---

### 8. Navigation & UI (LOW-MEDIUM IMPACT)

#### 8.1 Shell Navigation

**File:** `apps/cms/src/components/layout/shell/ShellChrome.tsx`

**Current:**

```typescript
{ label: 'Stats', href: '/stats', description: 'Shareable hockey stat nuggets.' }
```

**Action Required:**

- Update label, description
- Consider href if renaming routes

#### 8.2 Header Navigation

**Files:**

- `apps/cms/src/components/layout/Header.tsx`
- `apps/cms/src/components/layout/HeaderWrapper.tsx`

**Action Required:**

- Update navigation links and labels

---

### 9. Documentation (LOW IMPACT - but important)

#### 9.1 API Documentation

**Files:**

- `docs/collections/api/PUBLIC-STATS-API.md` (extensive documentation)
- `docs/system/architecture/WEB-CMS-COMMUNICATION.md`
- `docs/system/guides/DEVELOPER-HANDOFF-SUMMARY.md`

**Action Required:**

- Update all documentation references
- Update code examples
- Update endpoint descriptions

#### 9.2 Architecture Documentation

**Files:**

- `docs/system/architecture/tango-cms-architecture.md`
- `docs/collections/implementation/CONTENT-LIBRARY-API-PATTERN.md`
- `docs/collections/history/*.md`

**Action Required:**

- Update table references
- Update examples

---

### 10. Database Column Names (CRITICAL DECISION)

#### 10.1 Current Column Names

- `stat_text`
- `stat_value`
- `stat_category`

#### 10.2 Options

**Option A: Keep Column Names (RECOMMENDED)**

- **Pros:**
  - Smaller migration scope
  - Less risk of data loss
  - Faster implementation
- **Cons:**
  - Inconsistent naming (table is `facts` but columns are `stat_*`)
  - May confuse future developers

**Option B: Rename Columns**

- **Pros:**
  - Consistent naming throughout
  - Cleaner long-term architecture
- **Cons:**
  - Much larger migration
  - Need to update ALL code references to these columns
  - Higher risk of missing references
  - Requires updating TypeScript interfaces

**Recommendation:** **Option A** for initial migration, consider Option B as a follow-up if needed.

---

## Migration Strategy Comparison

### Strategy 1: Rename Existing Table (Recommended)

**Approach:**

1. Create `collection_facts` table (copy structure from `collection_stats`)
2. Copy all data from `collection_stats` to `collection_facts`
3. Update all code references
4. Drop `collection_stats` table
5. Optionally rename `collection_facts` to `collection_stats` if you want to keep the name

**Pros:**

- Preserves all data
- Can test new table before dropping old one
- Rollback is easier (just drop new table)
- Migration script already exists (`migration_20251119_copy_stat_to_facts.sql`)

**Cons:**

- Temporary storage duplication
- Need to ensure no writes to old table during migration

**Estimated Effort:** 2-3 days

---

### Strategy 2: Recreate Processes (NOT RECOMMENDED)

**Approach:**

1. Drop `collection_stats` table
2. Create `collection_facts` table
3. Rebuild all code from scratch

**Pros:**

- Clean slate
- Can fix any architectural issues

**Cons:**

- **MASSIVE** effort (weeks of work)
- High risk of bugs
- Loss of existing data unless backed up
- Need to rebuild:
  - All API routes
  - All frontend pages
  - All type definitions
  - All generator logic
  - All documentation

**Estimated Effort:** 2-3 weeks

**Assessment:** **NOT RECOMMENDED** - The rename approach is far more efficient and safer.

---

## Detailed File-by-File Impact

### Database Files (3 files)

1. ✅ `sql/migrations/migration_20250107_add_rls_policies_stats_auth.sql` - 9 references
2. ✅ `sql/migrations/migration_20251119_copy_stat_to_facts.sql` - Already exists!
3. ✅ `sql/maintenance/truncate_generated_content.sql` - 1 reference

### Backend API Routes (4 files)

1. ✅ `apps/cms/src/app/api/stats/route.ts` - 2 references
2. ✅ `apps/cms/src/app/api/stats/[id]/route.ts` - 2 references
3. ✅ `apps/web/src/app/api/public/stats/latest/route.ts` - 1 reference
4. ✅ `apps/web/src/app/api/public/stats/random/route.ts` - 2 references

### Frontend CMS Pages (3 files)

1. ✅ `apps/cms/src/app/stats/page.tsx` - Multiple references
2. ✅ `apps/cms/src/app/stats/create/page.tsx` - Multiple references
3. ✅ `apps/cms/src/app/stats/[id]/page.tsx` - Multiple references

### Frontend CMS Components (2 files)

1. ✅ `apps/cms/src/components/stats/StatCard.tsx` - Uses Stat type, stat_text, stat_value
2. ✅ `apps/cms/src/components/generator/StatsBatchProcessingPanel.tsx` - Component name + functions

### Frontend Web Pages (1 file)

1. ✅ `apps/web/src/app/shareables/page.tsx` - Stat interface, API calls, UI rendering

### Type Definitions (2 files)

1. ✅ `packages/shared/src/types/collections.ts` - Stat, StatCreateInput, StatUpdateInput types
2. ✅ `packages/shared/src/types/content.ts` - ContentType, getTableName mapping

### Generator Logic (3 files)

1. ✅ `apps/cms/src/app/main-generator/actions.ts` - 3 functions, multiple table references
2. ✅ `apps/cms/src/lib/generator/tracks.ts` - Track definition
3. ✅ `apps/cms/src/lib/gemini/generators/stats.ts` - Generator functions

### Ideation/Content Browser (2 files)

1. ✅ `apps/cms/src/lib/ideation/data.ts` - Table mapping
2. ✅ `apps/cms/src/app/api/content-browser/route.ts` - Table mapping

### Navigation (3 files)

1. ✅ `apps/cms/src/components/layout/shell/ShellChrome.tsx` - Navigation item
2. ✅ `apps/cms/src/components/layout/Header.tsx` - Navigation link
3. ✅ `apps/cms/src/components/layout/HeaderWrapper.tsx` - Navigation link

### Documentation (10+ files)

- Multiple documentation files with references

**Total Files Requiring Changes: ~30+ files**

---

## Critical Decisions Required

### Decision 1: Database Column Names

**Question:** Rename `stat_text`, `stat_value`, `stat_category` to `fact_text`, `fact_value`, `fact_category`?

**Recommendation:** **NO** - Keep column names as-is for initial migration. This reduces scope significantly.

### Decision 2: API Route Paths

**Question:** Rename `/api/stats/*` to `/api/facts/*`?

**Recommendation:** **NO** - Keep route paths as-is. This maintains backward compatibility and reduces breaking changes.

### Decision 3: Frontend Routes

**Question:** Rename `/stats/*` to `/facts/*`?

**Recommendation:** **NO** - Keep routes as-is, or add redirects if you want to change URLs.

### Decision 4: TypeScript Types

**Question:** Rename `Stat` type to `Fact`?

**Recommendation:** **YES** - This is a code-level change that doesn't break external APIs. Update:

- `Stat` → `Fact`
- `StatCreateInput` → `FactCreateInput`
- `StatUpdateInput` → `FactUpdateInput`

### Decision 5: Content Type Key

**Question:** Change `ContentType` from `'stat'` to `'fact'`?

**Recommendation:** **YES** - This is internal and should match the new naming.

---

## Recommended Migration Plan

### Phase 1: Database Migration (Day 1)

1. ✅ Run existing migration: `migration_20251119_copy_stat_to_facts.sql`
2. Verify data copied correctly
3. Update RLS policies (create new ones for `collection_facts`)
4. Test database access

### Phase 2: Type Definitions (Day 1-2)

1. Update `packages/shared/src/types/collections.ts`
   - Rename `Stat` → `Fact`
   - Rename input types
2. Update `packages/shared/src/types/content.ts`
   - Change `'stat'` → `'fact'` in `ContentType`
   - Update `getTableName()` mapping
3. Run TypeScript compiler to find all broken references

### Phase 3: Backend API (Day 2)

1. Update all API routes to use `collection_facts`
2. Keep route paths as `/api/stats/*` (no breaking changes)
3. Update function names internally
4. Test all API endpoints

### Phase 4: Frontend CMS (Day 2-3)

1. Update all page components
2. Update `StatCard` component (rename to `FactCard` or keep name)
3. Update generator panels
4. Update navigation labels
5. Test all CMS functionality

### Phase 5: Frontend Web (Day 3)

1. Update shareables page
2. Update API calls (still use `/api/public/stats/*` paths)
3. Update UI text ("facts" instead of "stats")
4. Test public pages

### Phase 6: Generator Logic (Day 3)

1. Update generator actions
2. Update track definitions
3. Update Gemini generator
4. Test batch processing

### Phase 7: Cleanup & Documentation (Day 3-4)

1. Update all documentation
2. Remove old `collection_stats` table (after verification)
3. Update migration scripts
4. Create migration summary document

---

## Risk Assessment

### High Risk Areas

1. **Data Loss:** Mitigated by copying data first, verifying before dropping old table
2. **Breaking Changes:** Mitigated by keeping API routes and frontend routes unchanged
3. **Missing References:** Mitigated by TypeScript compiler catching type errors
4. **RLS Policies:** Need careful testing to ensure permissions work correctly

### Low Risk Areas

1. **Type Definitions:** TypeScript will catch errors at compile time
2. **Documentation:** Can be updated incrementally
3. **UI Text:** Easy to update, low impact if missed

---

## Testing Checklist

### Database

- [ ] `collection_facts` table created with correct structure
- [ ] All data copied from `collection_stats`
- [ ] RLS policies working correctly
- [ ] Sequences working correctly
- [ ] Indexes created correctly

### Backend APIs

- [ ] `GET /api/stats` returns data from `collection_facts`
- [ ] `GET /api/stats?stats=true` returns correct counts
- [ ] `PATCH /api/stats/[id]` updates `collection_facts`
- [ ] `DELETE /api/stats/[id]` deletes from `collection_facts`
- [ ] `GET /api/public/stats/latest` works
- [ ] `GET /api/public/stats/random` works

### Frontend CMS

- [ ] `/stats` page loads and displays data
- [ ] `/stats/create` creates records in `collection_facts`
- [ ] `/stats/[id]` edits records in `collection_facts`
- [ ] Status changes work (publish/unpublish/archive)
- [ ] Deletion works
- [ ] Batch processing works

### Frontend Web

- [ ] `/shareables` page displays facts correctly
- [ ] API calls work
- [ ] UI text updated

### Generator

- [ ] Batch generation creates records in `collection_facts`
- [ ] Source tracking works correctly
- [ ] Unprocessed count calculation works

---

## Conclusion

**Renaming `collection_stats` to `collection_facts` is a significant but manageable undertaking.**

**Estimated Total Effort:** 3-4 days of focused work

**Recommended Approach:**

1. Use the existing migration script to copy data
2. Update code systematically (types → backend → frontend)
3. Keep API routes unchanged for backward compatibility
4. Keep database column names unchanged initially
5. Update TypeScript types and internal naming

**Is it easier to recreate?** **NO** - Recreating would take 2-3 weeks and introduce significant risk. The rename approach is far more efficient and safer.

**Next Steps:**

1. Review and approve this audit
2. Make decisions on the critical questions above
3. Create detailed migration task list
4. Begin Phase 1 (Database Migration)
