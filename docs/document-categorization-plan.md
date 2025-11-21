# Document Categorization and Cleanup Plan

**Created:** January 2025  
**Purpose:** Systematically categorize and identify outdated documents in the `docs/` folder

---

## Overview

The `docs/` folder currently contains **80+ documents** covering various aspects of the project. This plan establishes a system to:

1. **Categorize** documents by topic/area of concern
2. **Identify** outdated or obsolete documents
3. **Organize** documents for easier navigation and maintenance
4. **Archive or remove** documents that are no longer relevant

---

## Document Categories

### 1. **Architecture & System Design**
**Purpose:** Core system architecture, design decisions, and structural documentation

**Examples:**
- `ARCHITECTURE.md`
- `SYSTEM_DESIGN.md`
- `tango-cms-architecture.md`
- `PROJECT_ORGANIZATION.md`
- `scoring-user-system-architecture.md`

**Status:** Usually long-lived, but may need updates as system evolves

---

### 2. **API Documentation**
**Purpose:** Public API specifications and integration guides

**Examples:**
- `PUBLIC-*-API.md` files (Wisdom, Greetings, Stats, Motivational, Trivia)
- `API_DESIGN.md`
- `API_TRIVIA_SETS.md`
- `ONLYHOCKEY-API-HANDOFF.md`
- `onlyhockey-api-types.ts`

**Status:** Should be kept current, but older versions may be archived

---

### 3. **Implementation Guides & Patterns**
**Purpose:** How-to guides, patterns, and best practices for developers

**Examples:**
- `CONTENT-LIBRARY-TABLE-PATTERN.md`
- `CONTENT-LIBRARY-API-PATTERN.md`
- `DEVELOPER-HANDOFF-SUMMARY.md`
- `server-actions-explained.md`
- `working-with-supabase-table-safely.md`

**Status:** Long-lived reference material, may need periodic updates

---

### 4. **Migration & Status Reports**
**Purpose:** Historical records of migrations, status updates, and completion milestones

**Examples:**
- `STEP_1_COMPLETE.md`
- `STEP_2_COMPLETE.md`
- `STEP_3_COMPLETE.md`
- `STEP_4_COMPLETE.md`
- `MIGRATION_STATUS_UPDATE.md`
- `CURRENT_STATUS.md`
- `COLLECTIONS_PROGRESS.md`
- `COLLECTIONS_COMPLETE_SUMMARY.md`
- `TRIVIA_BUILD_PROGRESS.md`
- `CMS_MIGRATION_PLAN.md`

**Status:** ⚠️ **CANDIDATE FOR ARCHIVING** - Historical records, may be outdated

---

### 5. **Feature-Specific Documentation**
**Purpose:** Documentation for specific features or modules

**Examples:**
- `WISDOM-CONTENT-STRUCTURE.md`
- `HERO-COLLECTIONS-INTEGRATION.md`
- `trivia-sets-*.md` files
- `process-builder-*.md` files
- `sourcing-workflow-*.md` files

**Status:** Keep if feature is active, archive if deprecated

---

### 6. **Planning & Strategy Documents**
**Purpose:** Planning documents, strategies, and proposals

**Examples:**
- `theme-expansion-plan.md`
- `theme-expansion-testing-plan.md`
- `category-normalization-plan.md`
- `category-population-strategy.md`
- `PLATFORM-CONSOLIDATION-PLAN.md`
- `multiple-choice-builder-improvement-plan.md`
- `trivia-statistics-system.md`

**Status:** Review for completion - archive completed plans, keep active ones

---

### 7. **Testing & Troubleshooting**
**Purpose:** Testing guides, troubleshooting docs, and debugging checklists

**Examples:**
- `testing-process-builder-guide.md`
- `testing-process-builders-quick.md`
- `testing-process-builders.md`
- `troubleshooting-trivia-sets-not-showing.md`
- `generator-schema-debugging-checklist.md`
- `HYDRATION_ERROR_FIX.md`

**Status:** Keep if still relevant, archive if issue is resolved

---

### 8. **Database & Schema Documentation**
**Purpose:** Database structure, schema definitions, and metadata documentation

**Examples:**
- `source-content-ingested-table-schema.md`
- `source-content-metadata-definitions.md`
- `sourcing-workflow-database-structure.md`
- `correct-answer-storage-clarification.md`

**Status:** Keep current, archive outdated schema docs

---

### 9. **AI & Prompt Documentation**
**Purpose:** AI prompts, extraction documentation, and Gemini integration

**Examples:**
- `Gemini Prompts.txt`
- `updated-metadata-extraction-prompt.md`
- `updated-content-enrichment-prompt.md`
- `prompt-tables-comparison.md`
- `preventive-updates-checklist.md`

**Status:** Keep current prompts, archive old versions

---

### 10. **Setup & Handoff Documentation**
**Purpose:** Setup guides, handoff packages, and onboarding materials

**Examples:**
- `ONLYHOCKEY-SETUP-CHECKLIST.md`
- `ONLYHOCKEY-HANDOFF-PACKAGE.md`
- `onlyhockey-implementation-guide.md`
- `onlyhockey-marketing-positioning.md`

**Status:** Keep current, update as needed

---

### 11. **Historical & Recovery Documents**
**Purpose:** Recovery notes, audit reports, and historical context

**Examples:**
- `CURSOR-CHAT-RECOVERY.md`
- `PROJECT-AUDIT-FOLDER-RENAME-ISSUES.md`
- `FOLDER-RENAME-QUICK-REFERENCE.md`
- `LAYOUT_FIX.md`
- `LAYOUT_IMPLEMENTATION_SUMMARY.md`

**Status:** ⚠️ **CANDIDATE FOR ARCHIVING** - Historical context, may be outdated

---

### 12. **Index & Organization Documents**
**Purpose:** Documentation indexes and organization guides

**Examples:**
- `DOCUMENTATION-INDEX.md`
- `README.md`
- `MEMORY_NOTES.md`

**Status:** Keep current, update regularly

---

## Outdated Document Indicators

### Red Flags (Likely Outdated)

1. **"COMPLETE" or "COMPLETE" in filename**
   - `STEP_*_COMPLETE.md` files
   - Historical milestone records
   - **Action:** Archive to `docs/archive/` or `docs/history/`

2. **Status/Progress Reports**
   - `*_STATUS*.md`
   - `*_PROGRESS.md`
   - `*_UPDATE.md`
   - **Action:** Review date - archive if > 3 months old and superseded

3. **Fix/Recovery Documents**
   - `*_FIX.md`
   - `*_RECOVERY.md`
   - `*_ERROR*.md`
   - **Action:** Archive if issue is resolved

4. **Old Dates in Content**
   - Documents referencing old dates (e.g., "November 2025" when we're in January 2025)
   - **Action:** Review for accuracy

5. **Superseded Plans**
   - Planning documents where the work is complete
   - **Action:** Archive completed plans

---

## Proposed Folder Structure

### Option A: Flat with Categories (Recommended)
```
docs/
├── architecture/          # Architecture & system design
├── api/                   # API documentation
├── guides/                # Implementation guides & patterns
├── features/              # Feature-specific docs
├── database/              # Database & schema docs
├── ai/                    # AI & prompt documentation
├── setup/                 # Setup & handoff docs
├── archive/               # Archived/outdated documents
│   ├── completed/        # Completed milestone docs
│   ├── historical/       # Historical status reports
│   └── resolved/         # Resolved issues/fixes
└── [root files]          # Index, README, etc.
```

### Option B: Keep Flat, Add Metadata
```
docs/
├── [all current files]
└── document-index.json    # Metadata file with categories and status
```

---

## Implementation Plan

### Phase 1: Analysis (Current)
1. ✅ Create categorization plan (this document)
2. ⏳ Analyze all documents
3. ⏳ Create document inventory with categories
4. ⏳ Identify outdated documents

### Phase 2: Categorization
1. Create category folders (if using Option A)
2. Move documents to appropriate categories
3. Update cross-references
4. Update `DOCUMENTATION-INDEX.md`

### Phase 3: Cleanup
1. Archive outdated documents
2. Remove truly obsolete documents
3. Update index files
4. Create archive index

### Phase 4: Maintenance
1. Establish process for new documents
2. Regular review schedule (quarterly?)
3. Update categorization as needed

---

## Document Analysis Tool

### Proposed: `scripts/analyze-docs.js`

**Features:**
- Scan `docs/` folder
- Extract metadata (date, category, status)
- Identify potential outdated documents
- Generate report
- Suggest categorization

**Output:**
- Document inventory CSV/JSON
- Outdated document list
- Categorization suggestions
- Cross-reference analysis

---

## Decision Criteria

### Archive (Move to `docs/archive/`)
- ✅ Historical milestone records (`STEP_*_COMPLETE.md`)
- ✅ Old status reports (> 3 months, superseded)
- ✅ Resolved issue documentation
- ✅ Completed planning documents
- ✅ Superseded versions of documents

### Keep Active
- ✅ Current architecture docs
- ✅ Active API documentation
- ✅ Implementation guides
- ✅ Current feature documentation
- ✅ Active planning documents

### Remove (Delete)
- ❌ Duplicate documents
- ❌ Empty or broken files
- ❌ Test files (`test-api.html` - move to appropriate location)
- ❌ Truly obsolete documents with no historical value

---

## Next Steps

1. **Review this plan** - Confirm categories and approach
2. **Create document inventory** - List all documents with proposed categories
3. **Identify outdated documents** - Flag documents for archiving/removal
4. **Implement folder structure** - Create category folders (if approved)
5. **Move documents** - Organize documents into categories
6. **Update indexes** - Update `DOCUMENTATION-INDEX.md` and `README.md`
7. **Create archive** - Move outdated documents to archive folder

---

## Questions to Answer

1. **Folder Structure:** Option A (categorized folders) or Option B (flat with metadata)?
2. **Archive Location:** `docs/archive/` or separate `docs-history/` folder?
3. **Date Threshold:** How old should a status report be before archiving? (Suggested: 3 months)
4. **Review Schedule:** How often should we review documents? (Suggested: Quarterly)
5. **Automation:** Should we create a script to help with categorization?

---

## Notes

- Some documents may belong to multiple categories - use primary category
- Cross-references between documents should be updated when moving files
- Consider creating a `docs/CHANGELOG.md` to track document organization changes
- Archive doesn't mean delete - keep for historical reference

