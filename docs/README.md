# Documentation

This directory contains all documentation for the Aska Monorepo project, organized by **functional domain** for easy context gathering.

## 🎯 Domain-Based Organization

Documents are organized by **what you're working on**, not document type. Each domain folder contains complete context for that area.

### Domain Folders

- **[trivia/](./trivia/)** - Trivia system (Multiple Choice, True/False, Who Am I)
- **[process-builders/](./process-builders/)** - Automated content generation workflows
- **[content-sourcing/](./content-sourcing/)** - Content ingestion and metadata extraction
- **[content-browser/](./content-browser/)** - Content Browser: browsing, filtering, and exploring content by themes
- **[collections/](./collections/)** - Content collections (Wisdom, Greetings, Stats, etc.)
- **[system/](./system/)** - System-wide architecture and patterns
- **[ai-integration/](./ai-integration/)** - AI/Gemini integration
- **[setup/](./setup/)** - Setup guides and onboarding
- **[planning/](./planning/)** - Planning documents
- **[testing/](./testing/)** - Testing guides
- **[archive/](./archive/)** - Archived historical documents

## 📖 Quick Start

### For New Developers

1. **Start Here**: [system/guides/DEVELOPER-HANDOFF-SUMMARY.md](./system/guides/DEVELOPER-HANDOFF-SUMMARY.md)
2. **Architecture**: [system/architecture/ARCHITECTURE.md](./system/architecture/ARCHITECTURE.md)
3. **Patterns**: [collections/implementation/CONTENT-LIBRARY-TABLE-PATTERN.md](./collections/implementation/CONTENT-LIBRARY-TABLE-PATTERN.md)

### For Feature Work

Navigate to the relevant domain folder and read its README.md for complete context:
- Working on trivia? → [trivia/README.md](./trivia/README.md)
- Working on process builders? → [process-builders/README.md](./process-builders/README.md)
- Working on content sourcing? → [content-sourcing/README.md](./content-sourcing/README.md)
- Working on content browser? → [content-browser/README.md](./content-browser/README.md)

## 📚 Documentation Index

See [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) for complete documentation index and search tips.

## 🗄️ SQL Scripts

SQL scripts and database migrations are located in the `../sql/` directory at the project root.

## 📝 Key Documents

### System Architecture
- [System Architecture](./system/architecture/ARCHITECTURE.md) - Overall system architecture
- [System Design](./system/architecture/SYSTEM_DESIGN.md) - Design decisions
- [Project Organization](./system/architecture/PROJECT_ORGANIZATION.md) - Project structure

### Implementation Patterns
- [Content Library Table Pattern](./collections/implementation/CONTENT-LIBRARY-TABLE-PATTERN.md) - Database pattern
- [Content Library API Pattern](./collections/implementation/CONTENT-LIBRARY-API-PATTERN.md) - API pattern
- [Developer Handoff Summary](./system/guides/DEVELOPER-HANDOFF-SUMMARY.md) - Complete developer guide

### Current Status
- [Current Status](./CURRENT_STATUS.md) - Current project status
- [Memory Notes](./MEMORY_NOTES.md) - Important notes and decisions

## 💡 How to Use

**For AI-assisted development:**
- Point to a domain folder (e.g., `docs/trivia/`) for complete context
- Each domain folder contains all related documentation in one place

**For human developers:**
- Navigate to the domain folder for the feature you're working on
- Read the domain README.md for overview and quick links
- Explore subfolders (api/, implementation/, guides/) as needed

## 🔍 Finding Documents

- **By Feature**: Navigate to the domain folder
- **By Type**: Check `*/api/`, `*/implementation/`, `*/guides/` subfolders
- **Historical**: Check `*/history/` subfolders or `archive/` folder
- **Search**: Use [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) for search tips
