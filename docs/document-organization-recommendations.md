# Document Organization Recommendations

**Date:** January 2025  
**Purpose:** Recommended approach for organizing and archiving documents

---

## 🎯 Recommendation Summary

### Folder Structure: **Hybrid Category Folders** ✅
- Create category folders for active documents
- Keep essential index files in root
- Archive outdated documents in structured archive folder

### Archiving Approach: **Structured Archive Folder** ✅
- Use `docs/archive/` with subfolders by reason
- Create archive index for discoverability
- Preserve all historical documents

---

## 📁 Recommended Folder Structure

```
docs/
├── architecture/              # System architecture & design
│   ├── ARCHITECTURE.md
│   ├── SYSTEM_DESIGN.md
│   ├── PROJECT_ORGANIZATION.md
│   ├── tango-cms-architecture.md
│   └── scoring-user-system-architecture.md
│
├── api/                        # API documentation
│   ├── API_DESIGN.md
│   ├── API_TRIVIA_SETS.md
│   ├── PUBLIC-*-API.md (all public API docs)
│   ├── ONLYHOCKEY-API-HANDOFF.md
│   └── onlyhockey-api-types.ts
│
├── guides/                     # Implementation guides & patterns
│   ├── CONTENT-LIBRARY-TABLE-PATTERN.md
│   ├── CONTENT-LIBRARY-API-PATTERN.md
│   ├── DEVELOPER-HANDOFF-SUMMARY.md
│   ├── server-actions-explained.md
│   └── working-with-supabase-table-safely.md
│
├── features/                   # Feature-specific documentation
│   ├── WISDOM-CONTENT-STRUCTURE.md
│   ├── HERO-COLLECTIONS-INTEGRATION.md
│   ├── trivia-sets-*.md (active trivia docs)
│   ├── process-builder-*.md (active process builder docs)
│   └── sourcing-workflow-*.md (active sourcing docs)
│
├── database/                   # Database & schema documentation
│   ├── source-content-ingested-table-schema.md
│   ├── source-content-metadata-definitions.md
│   ├── sourcing-workflow-database-structure.md
│   └── correct-answer-storage-clarification.md
│
├── ai/                         # AI prompts & integration
│   ├── Gemini Prompts.txt
│   ├── updated-metadata-extraction-prompt.md
│   ├── updated-content-enrichment-prompt.md
│   ├── prompt-tables-comparison.md
│   └── preventive-updates-checklist.md
│
├── setup/                      # Setup & handoff documentation
│   ├── ONLYHOCKEY-SETUP-CHECKLIST.md
│   ├── ONLYHOCKEY-HANDOFF-PACKAGE.md
│   ├── onlyhockey-implementation-guide.md
│   └── onlyhockey-marketing-positioning.md
│
├── planning/                   # Planning & strategy documents
│   ├── theme-expansion-plan.md
│   ├── theme-expansion-testing-plan.md
│   ├── category-normalization-plan.md
│   ├── category-population-strategy.md
│   ├── PLATFORM-CONSOLIDATION-PLAN.md
│   ├── multiple-choice-builder-improvement-plan.md
│   └── trivia-statistics-system.md
│
├── testing/                    # Testing & troubleshooting
│   ├── testing-process-builder-guide.md
│   ├── testing-process-builders-quick.md
│   ├── testing-process-builders.md
│   ├── troubleshooting-trivia-sets-not-showing.md
│   └── generator-schema-debugging-checklist.md
│
├── archive/                    # Archived documents
│   ├── README.md              # Archive index
│   ├── completed/             # Historical milestones
│   ├── status/                # Old status reports
│   └── resolved/              # Resolved issues
│
├── [Root Files]               # Essential index files
│   ├── README.md              # Main documentation index
│   ├── DOCUMENTATION-INDEX.md  # Detailed index
│   ├── MEMORY_NOTES.md        # Important notes
│   ├── CURRENT_STATUS.md      # Current project status
│   ├── document-inventory.json # Generated inventory
│   └── document-categorization-plan.md
│
└── images/                     # Documentation images (keep as-is)
```

---

## 🗄️ Archive Structure Details

### Archive Organization

```
docs/archive/
├── README.md                  # Archive index and explanation
│
├── completed/                 # Historical milestone records
│   ├── STEP_1_COMPLETE.md
│   ├── STEP_2_COMPLETE.md
│   ├── STEP_3_COMPLETE.md
│   ├── STEP_4_COMPLETE.md
│   ├── COLLECTIONS_COMPLETE_SUMMARY.md
│   ├── process-builder-implementation-complete.md
│   ├── trivia-sets-complete-implementation.md
│   └── trivia-sets-three-tables-complete.md
│
├── status/                    # Old status/progress reports
│   ├── MIGRATION_STATUS_UPDATE.md (if superseded)
│   ├── COLLECTIONS_PROGRESS.md (if superseded)
│   ├── TRIVIA_BUILD_PROGRESS.md (if superseded)
│   ├── process-builder-progress.md
│   ├── process-builder-three-tables-updated.md
│   ├── updated-content-enrichment-prompt.md (if superseded)
│   └── updated-metadata-extraction-prompt.md (if superseded)
│
└── resolved/                  # Resolved issues and fixes
    ├── LAYOUT_FIX.md
    ├── HYDRATION_ERROR_FIX.md
    ├── CURSOR-CHAT-RECOVERY.md
    └── PROJECT-AUDIT-FOLDER-RENAME-ISSUES.md
```

### Archive README Template

```markdown
# Documentation Archive

This folder contains archived documentation that is no longer actively maintained but preserved for historical reference.

## Structure

- **completed/**: Historical milestone records marking completed steps/phases
- **status/**: Old status and progress reports that have been superseded
- **resolved/**: Documentation of resolved issues and fixes

## When to Archive

Documents are archived when:
- They mark completed milestones (STEP_*_COMPLETE.md)
- They are status reports superseded by newer versions
- They document issues that have been resolved
- They are planning documents for completed work

## Finding Archived Documents

Use the main `DOCUMENTATION-INDEX.md` for current documentation.  
Check this archive for historical context or completed work records.

## Archive Date

Last updated: [Date]
```

---

## ✅ Benefits of This Approach

### Category Folders
1. **Easy Navigation**: Find documents by topic quickly
2. **Scalable**: Can add more categories as needed
3. **Clear Ownership**: Each category has a clear purpose
4. **Better Discovery**: New team members can explore by category

### Structured Archive
1. **Preserves History**: Nothing is lost, just organized
2. **Clear Purpose**: Archive subfolders explain why documents are archived
3. **Easy Reference**: Can still find historical context when needed
4. **Clean Active Docs**: Active documentation stays uncluttered

---

## 📋 Migration Plan

### Phase 1: Create Structure
1. Create category folders
2. Create archive structure
3. Create archive README

### Phase 2: Categorize Active Documents
1. Move documents to appropriate category folders
2. Update cross-references in documents
3. Verify all documents are accounted for

### Phase 3: Archive Outdated Documents
1. Move historical milestones to `archive/completed/`
2. Move old status reports to `archive/status/`
3. Move resolved issues to `archive/resolved/`
4. Create archive index

### Phase 4: Update Indexes
1. Update `DOCUMENTATION-INDEX.md` with new structure
2. Update `README.md` with category overview
3. Update any cross-references

### Phase 5: Establish Process
1. Document process for new documents
2. Set up quarterly review schedule
3. Create template for new document placement

---

## 🎯 Decision Points

### Category Assignment
**Rule:** Assign to primary category, even if document touches multiple areas.

**Examples:**
- `process-builder-implementation-plan.md` → `features/` (not `planning/`)
- `PUBLIC-WISDOM-API.md` → `api/` (not `features/`)
- `theme-expansion-plan.md` → `planning/` (planning document)

### Archive Threshold
**Rule:** Archive when document is:
- Historical milestone (completed step)
- Status report superseded by newer version
- Issue documentation for resolved problems
- Planning document for completed work

**Don't Archive:**
- Current reference documentation
- Active planning documents
- Current status reports
- Implementation guides still in use

---

## 📊 Expected Results

### Before
- 107 documents in flat structure
- Hard to find specific documents
- Mix of current and historical docs
- No clear organization

### After
- ~84 active documents in category folders
- ~23 archived documents in structured archive
- Easy navigation by category
- Clear separation of current vs. historical
- Better discoverability

---

## 🚀 Next Steps

1. **Review Recommendations**: Confirm this approach works for your needs
2. **Approve Structure**: Give go-ahead to create folder structure
3. **Execute Migration**: Move documents to new structure
4. **Update Indexes**: Update documentation indexes
5. **Test Navigation**: Verify documents are easy to find

---

## 💡 Alternative Considerations

### If You Prefer Simpler Structure
- Keep flat structure
- Use `docs/archive/` only
- Rely on `DOCUMENTATION-INDEX.md` for navigation
- **Trade-off**: Less organization, but simpler migration

### If You Want More Granular Categories
- Split `features/` into `features/trivia/`, `features/process-builders/`, etc.
- Split `guides/` into `guides/patterns/`, `guides/how-to/`, etc.
- **Trade-off**: More folders, but more specific organization

---

**Recommendation:** Proceed with the hybrid category folders + structured archive approach. It provides the best balance of organization and simplicity.

