# Prompt Tables Usage Comparison

## Overview

This document compares the two prompt tables in the system: `prompts` and `ai_extraction_prompts`.

---

## Table Comparison

| Aspect | `prompts` Table | `ai_extraction_prompts` Table |
|--------|----------------|-------------------------------|
| **Primary Purpose** | Content generation prompts (Main Generator) | Metadata extraction & content enrichment prompts |
| **Used For** | Generating content (Wisdom, Greetings, Stats, Motivational, Trivia) | Extracting metadata from source content & enriching content |
| **Query Field** | `content_type` | `prompt_type` |
| **Active Flag** | No `is_active` field (uses latest by ID) | Has `is_active` boolean field |
| **Location** | `apps/cms/src/lib/prompts/repository.ts` (lines 46-78) | `apps/cms/src/lib/prompts/repository.ts` (lines 80-98) |

---

## `prompts` Table Usage

### Purpose
Stores prompts for **content generation** in the Main Generator.

### Content Types (via `content_type` field)
1. `wisdom` → Generator: Wisdom content
2. `greeting` → Generator: Greetings content
3. `motivational` → Generator: Motivational content
4. `stat` → Generator: Stats content
5. `multiple-choice` → Generator: Trivia Multiple Choice questions
6. `true-false` → Generator: Trivia True/False questions
7. `who-am-i` → Generator: Trivia Who Am I? questions

### Where It's Used

**File: `apps/cms/src/lib/prompts/repository.ts`**
- Lines 46-78: `getActivePromptByType()` function
- Queries `prompts` table when `promptType` is a generator type
- Maps `PromptType` → `content_type`:
  ```typescript
  generator_wisdom → 'wisdom'
  generator_greetings → 'greeting'
  generator_motivational → 'motivational'
  generator_stats → 'stat'
  generator_trivia_multiple_choice → 'multiple-choice'
  generator_trivia_true_false → 'true-false'
  generator_trivia_who_am_i → 'who-am-i'
  ```

**File: `apps/cms/src/lib/generator/context.ts`**
- Line 62: `getActivePromptByType(track.promptType)` 
- Used to load prompts for content generation tracks

**File: `apps/cms/src/app/main-generator/actions.ts`**
- Used when generating content (Wisdom, Greetings, Stats, Motivational, Trivia)

### Query Pattern
```typescript
.from('prompts')
.select('*')
.eq('content_type', generatorContentType)  // e.g., 'wisdom', 'greeting'
.order('id', { ascending: false })
.limit(1)
.maybeSingle()
```

### Key Characteristics
- ✅ No `is_active` field - uses latest prompt by ID
- ✅ Organized by `content_type` (not `prompt_type`)
- ✅ Used for **content generation** workflows
- ✅ Managed in Prompts Library UI (likely)

---

## `ai_extraction_prompts` Table Usage

### Purpose
Stores prompts for **metadata extraction** and **content enrichment** from source content.

### Prompt Types (via `prompt_type` field)
1. `metadata_extraction` → Extract theme, tags, category, summary from source content
2. `content_enrichment` → Generate title and key phrases from source content

### Where It's Used

**File: `apps/cms/src/lib/prompts/repository.ts`**
- Lines 80-98: `getActivePromptByType()` function
- Queries `ai_extraction_prompts` table when `promptType` is NOT a generator type
- Lines 107-120: `listPromptsByType()` function (read-only viewer)

**File: `apps/cms/src/app/sourcing/actions.ts`**
- Line 50: `getActivePromptByType('metadata_extraction')` - Used during content ingestion
- Line 70: `getActivePromptByType('content_enrichment')` - Used for title/key phrases

**File: `apps/cms/src/app/source-content-updater/actions.ts`**
- Line 159: `getActivePromptByType('metadata_extraction')` - Used for metadata regeneration

**File: `apps/cms/src/lib/ideation/prompts.ts`**
- Line 6: `getActivePromptByType('content_enrichment')` - Used for content analysis
- Line 11: `getActivePromptByType('metadata_extraction')` - Used for exploration

**File: `apps/cms/src/lib/sourcing/adapters.ts`**
- Line 159: Receives prompt from `getActivePromptByType('metadata_extraction')`
- Used in `extractMetadata()` function to extract metadata from source content

### Query Pattern
```typescript
.from('ai_extraction_prompts')
.select('id,prompt_name,prompt_type,prompt_content,description,is_active,created_at,updated_at,created_by')
.eq('prompt_type', promptType)  // e.g., 'metadata_extraction', 'content_enrichment'
.eq('is_active', true)
.order('updated_at', { ascending: false })
.limit(1)
.maybeSingle()
```

### Key Characteristics
- ✅ Has `is_active` boolean field - only active prompts are used
- ✅ Organized by `prompt_type` (not `content_type`)
- ✅ Used for **source content processing** workflows
- ✅ Supports multiple versions with active/inactive flag
- ✅ Managed in Prompts Library UI (likely)

---

## Current Issue: Source Content Updater

**Problem**: The Source Content Updater is using `metadata_extraction` prompt from `ai_extraction_prompts` table, but the hardcoded code in `adapters.ts` says "5 standardized themes" when it should say "13 standardized themes".

**Location**: `apps/cms/src/lib/sourcing/adapters.ts` line 27

**Fix Needed**: Update hardcoded text from "5 standardized themes" to "13 standardized themes"

---

## Recommendation: Rename `prompts` Table

### Proposed Name
**`generator_prompts`** or **`content_generation_prompts`**

### Rationale
1. **Clarity**: Makes it clear this table is for content generation, not extraction
2. **Consistency**: Matches the pattern of `ai_extraction_prompts` (descriptive name)
3. **Avoid Confusion**: `prompts` is too generic - could be confused with `ai_extraction_prompts`

### Migration Considerations
- Update all queries from `prompts` → `generator_prompts`
- Update `apps/cms/src/lib/prompts/repository.ts` line 48
- Update any UI that references this table
- Update database schema documentation

---

## Summary

| Table | Used For | Key Field | Active Flag | Rename Suggestion |
|-------|----------|-----------|-------------|-------------------|
| `prompts` | Content Generation | `content_type` | No (uses latest) | `generator_prompts` |
| `ai_extraction_prompts` | Metadata Extraction | `prompt_type` | Yes (`is_active`) | Keep as-is |

---

## Action Items

1. ✅ **Fix hardcoded "5 themes" → "13 themes"** in `adapters.ts`
2. ⏳ **Rename `prompts` table** to `generator_prompts` (or preferred name)
3. ⏳ **Update database prompt** for `metadata_extraction` to include all 13 themes
4. ⏳ **Update documentation** to reflect table rename

