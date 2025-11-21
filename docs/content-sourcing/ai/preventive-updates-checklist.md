# Preventive Updates Checklist

## Purpose

This checklist ensures all references to theme counts and outdated theme lists are updated to prevent future confusion and bugs.

---

## ✅ Already Fixed

1. ✅ **Code**: `apps/cms/src/lib/sourcing/adapters.ts` - Removed hardcoded prompt additions, now uses database prompt only
2. ✅ **Code**: Hardcoded "5 themes" → "13 themes" reference removed (was in adapters.ts)
3. ✅ **Validation**: `apps/cms/src/lib/sourcing/validators.ts` - Already says "13 standardized themes" in error message
4. ✅ **Types**: `apps/cms/src/lib/ideation/types.ts` - Already has all 13 themes defined
5. ✅ **Validators**: `apps/cms/src/lib/sourcing/validators.ts` - Already has all 13 themes and categories

---

## ⚠️ Recommended Updates (Non-Critical but Helpful)

### 1. Code Comments (Cosmetic - Won't Break Anything)

**File**: `apps/cms/src/lib/sourcing/validators.ts` (line 2)

- **Current**: `// Core Themes (5)`
- **Update to**: `// Core Themes (5 of 13 total)`
- **Why**: Clarifies there are more themes, but keeps historical context

**File**: `apps/cms/src/lib/ideation/types.ts` (line 4)

- **Current**: `// Core Themes (5)`
- **Update to**: `// Core Themes (5 of 13 total)`
- **Why**: Same reason as above

### 2. Documentation Files (Important for Future Reference)

**File**: `docs/source-content-ingested-table-schema.md`

- **Line 37**: Says "must be one of 5 standardized themes"
- **Line 76**: CHECK constraint example shows only 5 themes
- **Update**: Change to "13 standardized themes" and update CHECK constraint example
- **Why**: This is reference documentation - should reflect current state

**File**: `docs/source-content-metadata-definitions.md`

- **Line 412**: Says "one of 5" in Theme vs Tags section
- **Line 422**: Says "one of 5" in Category vs Theme section
- **Line 436**: Says "Core themes: Players, Teams & Organizations..." (lists only 5)
- **Update**: Change to "13" and list all themes
- **Why**: This is the authoritative metadata definitions doc

**File**: `docs/sourcing-workflow-database-structure.md` (if it exists)

- **Update**: Any references to "5 themes" → "13 themes"
- **Why**: Database structure docs should be accurate

### 3. Other Documentation Files (Lower Priority)

**File**: `docs/theme-expansion-plan.md`

- **Status**: This is a historical planning doc - OK to leave as-is (shows the expansion plan)
- **Action**: None needed - it's documenting the expansion process

**File**: `docs/Gemini Prompts.txt` (if still in use)

- **Lines 158, 265, 362**: Reference only 5 themes
- **Action**: Check if this file is still actively used. If yes, update. If legacy, consider archiving.

---

## 🔍 Database Prompts (CRITICAL - Must Update)

### 1. `metadata_extraction` Prompt

- **Table**: `ai_extraction_prompts`
- **Where**: `prompt_type = 'metadata_extraction'` AND `is_active = true`
- **Status**: ⚠️ **NEEDS UPDATE**
- **Action**: Replace with content from `docs/updated-metadata-extraction-prompt.md`
- **Why**: This is what Gemini uses - must have all 13 themes

### 2. `content_enrichment` Prompt

- **Table**: `ai_extraction_prompts`
- **Where**: `prompt_type = 'content_enrichment'` AND `is_active = true`
- **Status**: ✅ **OPTIONAL** (doesn't reference themes, but good to update for clarity)
- **Action**: Replace with content from `docs/updated-content-enrichment-prompt.md`
- **Why**: Cleaner, more focused prompt

---

## 🎯 Priority Order

### **HIGH PRIORITY (Do Now)**

1. ✅ Update `metadata_extraction` prompt in database (CRITICAL)
2. ✅ Update `content_enrichment` prompt in database (RECOMMENDED)

### **MEDIUM PRIORITY (Do Soon)**

3. Update `docs/source-content-ingested-table-schema.md`
4. Update `docs/source-content-metadata-definitions.md` (lines 412, 422, 436)

### **LOW PRIORITY (Nice to Have)**

5. Update code comments in `validators.ts` and `types.ts`
6. Check/update `docs/Gemini Prompts.txt` if still in use

---

## 🚫 What NOT to Update

- **`docs/theme-expansion-plan.md`**: Historical planning doc - leave as-is
- **Migration files**: Historical records - don't modify
- **Comments that say "Core Themes (5)"**: These are accurate (there ARE 5 core themes, plus 8 more)

---

## ✅ Testing Checklist (After Updates)

1. Test Source Content Updater regeneration with all 13 themes
2. Test new content ingestion with various themes
3. Verify validation accepts all 13 themes
4. Verify categories match their themes correctly
5. Test with edge cases (null categories, etc.)

---

## 📝 Summary

**Must Do Now:**

- Update database prompts (metadata_extraction and content_enrichment)

**Should Do Soon:**

- Update documentation files that reference "5 themes"

**Nice to Have:**

- Update code comments for clarity

**Don't Touch:**

- Historical planning docs
- Migration files
- Comments that accurately describe "Core Themes (5)" as part of 13 total
