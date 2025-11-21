# Document Organization Recommendations v2

**Date:** January 2025  
**Purpose:** Organize documents by **functional area** for AI-assisted development context

---

## 🎯 Core Principle

**Organize by functional area/domain, not document type.**

When you point me to a folder, I should find:
- ✅ All relevant documentation for that feature/system
- ✅ Implementation guides and patterns
- ✅ API documentation
- ✅ Architecture decisions
- ✅ Historical context and decisions
- ✅ Related planning documents

**Goal:** One folder = complete context for working on that area.

---

## 📁 Recommended Structure: Domain-Based Organization

```
docs/
├── trivia/                      # Everything about trivia system
│   ├── README.md               # Overview and quick links
│   ├── api/                    # Trivia API documentation
│   │   ├── PUBLIC-MULTIPLE-CHOICE-TRIVIA-API.md
│   │   ├── PUBLIC-TRUE-FALSE-TRIVIA-API.md
│   │   ├── PUBLIC-WHO-AM-I-TRIVIA-API.md
│   │   └── API_TRIVIA_SETS.md
│   ├── implementation/         # Implementation guides
│   │   ├── trivia-sets-strategy.md
│   │   ├── trivia-sets-architecture-decision.md
│   │   ├── trivia-sets-actual-structure.md
│   │   └── trivia-sets-complete-implementation.md
│   ├── guides/                # How-to guides
│   │   ├── trivia-sets-library-buttons-check.md
│   │   └── troubleshooting-trivia-sets-not-showing.md
│   └── history/               # Historical context
│       ├── TRIVIA_BUILD_PROGRESS.md
│       └── STEP_4_COMPLETE.md
│
├── process-builders/           # Everything about process builders
│   ├── README.md              # Overview and quick links
│   ├── architecture/         # Architecture decisions
│   │   ├── process-builders-final-architecture.md
│   │   ├── process-builders-scalable-architecture.md
│   │   ├── process-builders-enhanced-architecture.md
│   │   └── process-builders-isolation-confirmation.md
│   ├── implementation/        # Implementation guides
│   │   ├── PROCESS_BUILDER_IMPLEMENTATION_PLAN.md
│   │   ├── process-builder-isolation-strategy.md
│   │   └── process-builder-trivia-set-workflow.md
│   ├── guides/               # How-to guides
│   │   ├── testing-process-builder-guide.md
│   │   ├── testing-process-builders-quick.md
│   │   └── testing-process-builders.md
│   ├── planning/             # Planning documents
│   │   ├── process-builder-adoption-review.md
│   │   ├── process-builders-next-steps.md
│   │   └── multiple-choice-builder-improvement-plan.md
│   └── history/              # Historical context
│       ├── process-builder-progress.md
│       ├── process-builder-tasks-implemented.md
│       ├── process-builder-three-tables-updated.md
│       └── process-builder-implementation-complete.md
│
├── content-sourcing/          # Everything about content sourcing
│   ├── README.md             # Overview and quick links
│   ├── database/             # Database structure
│   │   ├── source-content-ingested-table-schema.md
│   │   ├── source-content-metadata-definitions.md
│   │   └── sourcing-workflow-database-structure.md
│   ├── implementation/       # Implementation guides
│   │   ├── sourcing-workflow-envisioning.md
│   │   └── sourcing-workflow-naming-ui-patterns.md
│   ├── ai/                  # AI integration
│   │   ├── updated-metadata-extraction-prompt.md
│   │   ├── updated-content-enrichment-prompt.md
│   │   ├── prompt-tables-comparison.md
│   │   └── preventive-updates-checklist.md
│   ├── guides/             # How-to guides
│   │   ├── ingestion-logging-enhancements.md
│   │   └── ingestion-logging-future-enhancements.md
│   └── planning/           # Planning documents
│       ├── category-normalization-plan.md
│       ├── category-population-strategy.md
│       └── automated-metadata-refresh-plan.md
│
├── collections/              # Everything about content collections
│   ├── README.md            # Overview and quick links
│   ├── api/                 # Collections API docs
│   │   ├── PUBLIC-WISDOM-API.md
│   │   ├── PUBLIC-GREETINGS-API.md
│   │   ├── PUBLIC-STATS-API.md
│   │   ├── PUBLIC-MOTIVATIONAL-API.md
│   │   └── PUBLIC-HERO-COLLECTIONS-API.md
│   ├── implementation/      # Implementation guides
│   │   ├── WISDOM-CONTENT-STRUCTURE.md
│   │   ├── HERO-COLLECTIONS-INTEGRATION.md
│   │   ├── CONTENT-LIBRARY-TABLE-PATTERN.md
│   │   └── CONTENT-LIBRARY-API-PATTERN.md
│   └── history/            # Historical context
│       ├── COLLECTIONS_PROGRESS.md
│       ├── COLLECTIONS_COMPLETE_SUMMARY.md
│       └── STEP_2_COMPLETE.md (Wisdom)
│
├── ai-integration/          # AI/Gemini integration (cross-cutting)
│   ├── README.md           # Overview
│   ├── prompts/           # AI prompts
│   │   ├── Gemini Prompts.txt
│   │   ├── updated-metadata-extraction-prompt.md
│   │   └── updated-content-enrichment-prompt.md
│   └── guides/            # AI integration guides
│       └── prompt-tables-comparison.md
│
├── system/                 # System-wide architecture & design
│   ├── README.md          # Overview
│   ├── architecture/      # Architecture docs
│   │   ├── ARCHITECTURE.md
│   │   ├── SYSTEM_DESIGN.md
│   │   ├── PROJECT_ORGANIZATION.md
│   │   ├── tango-cms-architecture.md
│   │   └── scoring-user-system-architecture.md
│   ├── api/              # API design patterns
│   │   ├── API_DESIGN.md
│   │   └── ONLYHOCKEY-API-HANDOFF.md
│   ├── guides/           # General implementation guides
│   │   ├── DEVELOPER-HANDOFF-SUMMARY.md
│   │   ├── server-actions-explained.md
│   │   └── working-with-supabase-table-safely.md
│   └── database/         # General database patterns
│       └── correct-answer-storage-clarification.md
│
├── setup/                  # Setup & onboarding
│   ├── README.md         # Overview
│   ├── ONLYHOCKEY-SETUP-CHECKLIST.md
│   ├── ONLYHOCKEY-HANDOFF-PACKAGE.md
│   ├── onlyhockey-implementation-guide.md
│   └── onlyhockey-marketing-positioning.md
│
├── planning/              # Cross-cutting planning documents
│   ├── README.md         # Overview
│   ├── theme-expansion-plan.md
│   ├── theme-expansion-testing-plan.md
│   ├── PLATFORM-CONSOLIDATION-PLAN.md
│   └── trivia-statistics-system.md
│
├── testing/              # General testing & troubleshooting
│   ├── README.md        # Overview
│   └── generator-schema-debugging-checklist.md
│
├── archive/              # Archived documents
│   ├── README.md       # Archive index
│   ├── completed/     # Historical milestones
│   ├── status/        # Old status reports
│   └── resolved/      # Resolved issues
│
└── [Root Files]        # Essential indexes
    ├── README.md       # Main documentation index
    ├── DOCUMENTATION-INDEX.md
    ├── MEMORY_NOTES.md
    ├── CURRENT_STATUS.md
    └── document-inventory.json
```

---

## 🎯 How This Works for AI Context

### Example 1: "Work on trivia sets"

**You point me to:** `docs/trivia/`

**I read:**
- `trivia/README.md` - Overview and quick links
- `trivia/api/*` - All API documentation
- `trivia/implementation/*` - Architecture and implementation decisions
- `trivia/guides/*` - How-to guides and troubleshooting
- `trivia/history/*` - Historical context and decisions

**Result:** Complete context for trivia system in one folder.

---

### Example 2: "Review process builders"

**You point me to:** `docs/process-builders/`

**I read:**
- `process-builders/README.md` - Overview
- `process-builders/architecture/*` - All architecture decisions
- `process-builders/implementation/*` - Implementation guides
- `process-builders/guides/*` - Testing and how-to guides
- `process-builders/planning/*` - Planning documents
- `process-builders/history/*` - Historical context

**Result:** Complete context for process builders in one folder.

---

### Example 3: "Fix content sourcing"

**You point me to:** `docs/content-sourcing/`

**I read:**
- `content-sourcing/README.md` - Overview
- `content-sourcing/database/*` - Database structure and schema
- `content-sourcing/implementation/*` - Implementation details
- `content-sourcing/ai/*` - AI integration and prompts
- `content-sourcing/guides/*` - How-to guides
- `content-sourcing/planning/*` - Planning context

**Result:** Complete context for content sourcing in one folder.

---

## 📋 Folder Structure Pattern

Each domain folder follows this pattern:

```
domain-name/
├── README.md              # Overview, quick links, entry point
├── api/                   # API documentation (if applicable)
├── architecture/          # Architecture decisions (if applicable)
├── implementation/        # Implementation guides
├── guides/                # How-to guides, troubleshooting
├── planning/              # Planning documents (if applicable)
└── history/               # Historical context, completed milestones
```

**Benefits:**
- Consistent structure across domains
- Easy to find what you need
- Complete context in one place
- Clear separation of concerns

---

## 🗄️ Archive Strategy

### Archive Structure

```
docs/archive/
├── README.md              # Archive index
├── completed/             # Historical milestones
│   ├── STEP_1_COMPLETE.md
│   ├── STEP_2_COMPLETE.md
│   ├── STEP_3_COMPLETE.md
│   └── STEP_4_COMPLETE.md
├── status/                # Old status reports
│   └── [old status docs]
└── resolved/             # Resolved issues
    └── [resolved issue docs]
```

**Archive when:**
- Document is a completed milestone
- Status report is superseded
- Issue is resolved
- Planning document is for completed work

**Keep in domain folders:**
- Active implementation guides
- Current architecture decisions
- Active planning documents
- Current API documentation

---

## ✅ Benefits of Domain-Based Organization

### For AI Context Gathering
1. **Complete Context**: One folder = everything needed
2. **No Hunting**: Don't need to search across multiple folders
3. **Historical Context**: History included in domain folder
4. **Related Docs**: All related docs grouped together

### For Human Developers
1. **Logical Organization**: Find docs by what you're working on
2. **Complete Picture**: See all aspects of a feature together
3. **Easy Onboarding**: New developers can explore by domain
4. **Clear Boundaries**: Each domain is self-contained

---

## 📊 Migration Strategy

### Phase 1: Create Domain Folders
1. Create domain folders with subfolders
2. Create README.md for each domain
3. Create archive structure

### Phase 2: Move Documents by Domain
1. Move trivia-related docs to `trivia/`
2. Move process-builder docs to `process-builders/`
3. Move content-sourcing docs to `content-sourcing/`
4. Move collections docs to `collections/`
5. Move system-wide docs to `system/`

### Phase 3: Organize Within Domains
1. Organize docs into subfolders (api/, implementation/, etc.)
2. Create README.md files for each domain
3. Add quick links and overviews

### Phase 4: Archive Historical Docs
1. Move completed milestones to `archive/completed/`
2. Move old status reports to `archive/status/`
3. Move resolved issues to `archive/resolved/`

### Phase 5: Update Indexes
1. Update `DOCUMENTATION-INDEX.md` with new structure
2. Update `README.md` with domain overview
3. Update cross-references in documents

---

## 🎯 Domain Assignment Rules

### Primary Domain (Where document lives)
- **Trivia**: All trivia-related docs (API, implementation, guides)
- **Process Builders**: All process builder docs
- **Content Sourcing**: All sourcing workflow docs
- **Collections**: All content collection docs (Wisdom, Greetings, etc.)
- **System**: Cross-cutting architecture and patterns
- **AI Integration**: AI/Gemini integration (if not feature-specific)
- **Setup**: Setup and onboarding docs
- **Planning**: Cross-cutting planning documents

### Subfolder Assignment
- **api/**: Public API documentation
- **architecture/**: Architecture decisions and design
- **implementation/**: Implementation guides and patterns
- **guides/**: How-to guides and troubleshooting
- **planning/**: Planning documents and strategies
- **history/**: Historical context and completed milestones
- **database/**: Database structure and schema (if domain-specific)

---

## 📝 README Template for Domain Folders

```markdown
# [Domain Name] Documentation

Complete documentation for the [domain name] system.

## Quick Links

- [API Documentation](./api/)
- [Implementation Guides](./implementation/)
- [Architecture Decisions](./architecture/)
- [How-To Guides](./guides/)
- [Historical Context](./history/)

## Overview

[Brief overview of the domain]

## Key Documents

- **[Document Name](./path/to/doc.md)** - [Description]
- **[Document Name](./path/to/doc.md)** - [Description]

## Related Domains

- [Related Domain](../related-domain/) - [Why related]
```

---

## 🚀 Next Steps

1. **Review Structure**: Confirm domain-based organization works
2. **Approve Migration**: Give go-ahead to reorganize
3. **Execute Migration**: Move documents to domain folders
4. **Create READMEs**: Add overview files for each domain
5. **Update Indexes**: Update main documentation indexes

---

**Key Insight:** Organize by **what you're working on**, not by **document type**. This makes it easy to point me to a folder and get complete context.

