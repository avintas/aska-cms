# OnlyHockey Project - Comprehensive Audit: Folder Rename & Data Persistence Issues

## Executive Summary

This audit identifies all potential issues that could cause data loss or break functionality when folders are renamed in the OnlyHockey project. The audit covers hardcoded paths, data persistence mechanisms, import dependencies, and file-based storage.

**Critical Finding:** The project has several hardcoded folder name dependencies that could break if folders are renamed, particularly in the process-builders system.

---

## 🔴 CRITICAL ISSUES

### 1. Hardcoded Folder Paths in Scripts

**Location:** `scripts/discover-process-builders.ts`

**Issue:** Hardcoded folder name `"process-builders"` used in multiple places:

```19:19:scripts/discover-process-builders.ts
  const processBuildersDir = path.join(process.cwd(), "process-builders");
```

```99:101:scripts/discover-process-builders.ts
    const registryPath = path.join(
      process.cwd(),
      "process-builders-registry.json",
```

**Impact:** 
- If `process-builders/` folder is renamed, the discovery script will fail
- Registry generation will fail
- Process builders won't be discovered

**Risk Level:** 🔴 **CRITICAL** - Breaks core functionality

**Recommendation:** 
- Use environment variable or config file for folder name
- Or use dynamic discovery based on package.json scripts
- Document folder name as a project constant

---

### 2. Registry File References Folder Names

**Location:** `process-builders-registry.json`

**Issue:** Registry file contains hardcoded folder names as keys:

```1:33:process-builders-registry.json
{
  "build-trivia-set": {
    "id": "build-trivia-set",
    ...
  },
  "ingest-source-content": {
    "id": "ingest-source-content",
    ...
  }
}
```

**Impact:**
- If a process builder folder is renamed, the registry becomes out of sync
- The registry must be regenerated after any folder rename
- No automatic detection of renamed folders

**Risk Level:** 🟡 **MEDIUM** - Requires manual intervention

**Recommendation:**
- Add validation to detect folder/registry mismatches
- Add script to sync registry with actual folders
- Consider using folder scanning instead of static registry

---

### 3. TypeScript Path Aliases Depend on Folder Structure

**Location:** `tsconfig.json`

**Issue:** Path aliases use `@/*` which maps to root, but imports reference specific folders:

```21:23:tsconfig.json
    "paths": {
      "@/*": ["./*"]
    }
```

**Examples of hardcoded imports:**
- `@/process-builders/build-trivia-set/lib/actions`
- `@/process-builders/core/types`
- `@/lib/supabase`
- `@/components/ui/button`

**Impact:**
- If any folder referenced in imports is renamed, TypeScript compilation fails
- Runtime errors if imports aren't updated
- No compile-time safety for folder renames

**Risk Level:** 🟡 **MEDIUM** - Breaks compilation but detectable

**Recommendation:**
- Use relative imports where possible
- Document all folder dependencies
- Create a migration guide for folder renames

---

## 🟡 MEDIUM RISK ISSUES

### 4. Import Paths Throughout Codebase

**Location:** Multiple files using `@/process-builders/*` imports

**Files Affected:**
- `app/cms/process-builders/build-trivia-set/page.tsx`
- `app/cms/sourcing/page.tsx`
- All files in `process-builders/` directory

**Example:**
```4:4:app/cms/process-builders/build-trivia-set/page.tsx
import { buildTriviaSetAction } from "@/process-builders/build-trivia-set/lib/actions";
```

**Impact:**
- If `process-builders` folder is renamed, all imports break
- Requires find/replace across entire codebase
- Easy to miss some imports

**Risk Level:** 🟡 **MEDIUM** - Widespread but fixable

**Recommendation:**
- Use TypeScript path mapping constants
- Create refactoring script for folder renames
- Document all import dependencies

---

### 5. Route Paths Reference Folder Names

**Location:** Multiple CMS pages

**Issue:** Route paths match folder structure:

- `/cms/process-builders/build-trivia-set` → `app/cms/process-builders/build-trivia-set/page.tsx`
- `/cms/sourcing` → `app/cms/sourcing/page.tsx`

**Impact:**
- Renaming folders changes URLs
- External links break
- Bookmarks break
- SEO impact

**Risk Level:** 🟡 **MEDIUM** - User-facing impact

**Recommendation:**
- Use route constants/config file
- Implement redirects for renamed routes
- Document URL structure

---

## 🟢 LOW RISK ISSUES

### 6. Session Storage Keys

**Location:** `lib/session-helpers.ts` and multiple pages

**Issue:** Session storage keys are hardcoded strings:

```34:42:lib/session-helpers.ts
    sourceContent: sessionStorage.getItem("sourceContent") || "",
    sourceContentId: sessionStorage.getItem("sourceContentId") || "",
    aiPrompt: sessionStorage.getItem("aiPrompt") || "",
    contentType:
      (sessionStorage.getItem(
        "contentType",
      ) as ProcessingSession["contentType"]) || "mc",
    libraryReturnPath: sessionStorage.getItem("libraryReturnPath") || "",
```

**Impact:**
- Session data persists across folder renames (browser-based)
- Not affected by folder renames
- But keys are magic strings - no type safety

**Risk Level:** 🟢 **LOW** - Not affected by folder renames

**Recommendation:**
- Create constants for storage keys
- Add TypeScript types for storage keys

---

### 7. LocalStorage Usage

**Location:** Multiple pages using localStorage

**Issue:** localStorage keys are hardcoded strings (e.g., `"activeBulkJob"`, `"recentHeroCollections"`)

**Impact:**
- Not affected by folder renames
- Data persists in browser
- But keys are magic strings

**Risk Level:** 🟢 **LOW** - Not affected by folder renames

**Recommendation:**
- Create constants for localStorage keys
- Document all localStorage usage

---

## 📊 DATA PERSISTENCE ANALYSIS

### Database Storage ✅ SAFE
- All data stored in Supabase (PostgreSQL)
- Not affected by folder renames
- No file path dependencies

### File-Based Storage ⚠️ RISK
- `process-builders-registry.json` - Generated file, references folder names
- Config files in `process-builders/*/config.json` - Safe (relative paths)
- SQL files in `sql/` - Safe (no folder dependencies)

### Browser Storage ✅ SAFE
- sessionStorage - Not affected by folder renames
- localStorage - Not affected by folder renames
- Cookies - Not affected by folder renames

### External Tools ⚠️ UNKNOWN
- **Cursor Chat History** - Stored outside project folder (likely in Cursor's app data)
- If Cursor's storage references project folder path, renaming could break chat history
- **Recommendation:** Check Cursor's documentation for chat storage location

---

## 🔍 COMPREHENSIVE FOLDER DEPENDENCY MAP

### Folders That Must Not Be Renamed Without Updates:

1. **`process-builders/`** 🔴
   - Referenced in: `scripts/discover-process-builders.ts`
   - Referenced in: 294+ import statements
   - Referenced in: Route paths
   - **Impact:** CRITICAL - Breaks entire process builder system

2. **`lib/`** 🟡
   - Referenced in: 200+ import statements
   - **Impact:** MEDIUM - Breaks imports but detectable

3. **`components/`** 🟡
   - Referenced in: 150+ import statements
   - **Impact:** MEDIUM - Breaks imports but detectable

4. **`app/`** 🟡
   - Referenced in: Route structure
   - **Impact:** MEDIUM - Changes URLs

5. **`process-builders/core/`** 🟡
   - Referenced in: Process builder imports
   - **Impact:** MEDIUM - Breaks process builders

6. **`process-builders/build-trivia-set/`** 🟡
   - Referenced in: Imports and routes
   - **Impact:** MEDIUM - Breaks trivia set builder

7. **`process-builders/ingest-source-content/`** 🟡
   - Referenced in: Imports and routes
   - **Impact:** MEDIUM - Breaks content ingestion

---

## ✅ RECOMMENDATIONS

### Immediate Actions

1. **Document Folder Structure**
   - Create `FOLDER-STRUCTURE.md` documenting all folders and their purposes
   - Mark folders as "rename-safe" or "do-not-rename"

2. **Create Folder Rename Migration Guide**
   - Step-by-step process for renaming folders
   - Checklist of files to update
   - Testing procedures

3. **Add Validation Scripts**
   - Script to detect folder/import mismatches
   - Script to validate registry sync
   - Pre-commit hook to check for broken imports

4. **Refactor Hardcoded Paths**
   - Extract folder names to constants
   - Use environment variables for configurable paths
   - Create path helper utilities

### Long-Term Improvements

1. **Use Relative Imports Where Possible**
   - Reduces dependency on folder structure
   - Easier to refactor

2. **Implement Route Constants**
   - Centralized route definitions
   - Easy to update when folders change

3. **Add Folder Rename Tooling**
   - Script to automatically update imports
   - Script to update routes
   - Script to regenerate registry

4. **Document External Dependencies**
   - Cursor chat storage location
   - Any other external tools that reference folder paths

---

## 🚨 CRITICAL WARNINGS

### ⚠️ DO NOT RENAME WITHOUT UPDATES:

1. **`process-builders/`** - Will break discovery script and all imports
2. Any folder referenced in `@/` imports - Will break TypeScript compilation
3. Any folder that matches a route path - Will break URLs

### ✅ SAFE TO RENAME:

1. `docs/` - Only documentation, no code dependencies
2. `public/` - Static assets, referenced by URL not import
3. `sql/` - SQL files, no import dependencies

---

## 📝 TESTING CHECKLIST FOR FOLDER RENAMES

If you must rename a folder, verify:

- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] All imports resolve correctly
- [ ] Routes still work (test in browser)
- [ ] Process builder discovery works (`npm run discover-builders`)
- [ ] Registry file is regenerated
- [ ] No broken links in documentation
- [ ] External tools (Cursor, etc.) still work
- [ ] Database connections unaffected
- [ ] Session/localStorage unaffected

---

## 🔗 RELATED DOCUMENTATION

- `docs/process-builders-final-architecture.md` - Process builder architecture
- `docs/sourcing-workflow-naming-ui-patterns.md` - Naming conventions
- `process-builders/README.md` - Process builder isolation

---

## 📅 AUDIT DATE

**Date:** 2024-12-19
**Auditor:** AI Assistant
**Scope:** Complete project audit for folder rename and data persistence issues

---

## 🎯 SUMMARY

**Total Issues Found:** 7
- 🔴 Critical: 1
- 🟡 Medium: 4
- 🟢 Low: 2

**Main Risk:** Hardcoded folder paths in scripts and imports

**Recommendation:** Before renaming any folder, check this audit and update all references. Consider creating a migration script for common renames.

