# Documentation Index

**Last Updated:** January 2025

---

## 📖 Documentation Overview

This index helps you find the right documentation quickly. Documents are organized by **functional domain** - each folder contains complete context for working on that area.

---

## 🎯 Domain-Based Organization

Documents are organized by **what you're working on**, not document type. When you need to work on a feature, point to its domain folder for complete context.

### Domain Folders

| Domain | Purpose | Quick Link |
|--------|---------|------------|
| **[Trivia](./trivia/)** | Trivia system (Multiple Choice, True/False, Who Am I) | [README](./trivia/README.md) |
| **[Process Builders](./process-builders/)** | Automated content generation workflows | [README](./process-builders/README.md) |
| **[Content Sourcing](./content-sourcing/)** | Content ingestion and metadata extraction | [README](./content-sourcing/README.md) |
| **[Collections](./collections/)** | Content collections (Wisdom, Greetings, Stats, etc.) | [README](./collections/README.md) |
| **[Generator](./generator/)** | Main Generator and batch processing patterns | [Batch Pattern](./generator/BATCH-GENERATION-PATTERN.md) |
| **[System](./system/)** | System-wide architecture and patterns | [README](./system/README.md) |
| **[AI Integration](./ai-integration/)** | AI/Gemini integration and prompts | [Prompts](./ai-integration/prompts/) |
| **[Setup](./setup/)** | Setup guides and onboarding | [Setup Checklist](./setup/ONLYHOCKEY-SETUP-CHECKLIST.md) |
| **[Planning](./planning/)** | Planning documents and strategies | [Planning Docs](./planning/) |
| **[Testing](./testing/)** | Testing guides and troubleshooting | [Testing](./testing/) |
| **[Archive](./archive/)** | Archived historical documents | [Archive Index](./archive/README.md) |

---

## 🚀 Quick Start by Task

### "I need to work on trivia sets"
→ Go to **[trivia/](./trivia/)** folder
- Contains: API docs, implementation guides, architecture decisions, historical context

### "I need to review process builders"
→ Go to **[process-builders/](./process-builders/)** folder
- Contains: Architecture, implementation, testing guides, planning docs

### "I need to fix content sourcing"
→ Go to **[content-sourcing/](./content-sourcing/)** folder
- Contains: Database schema, AI prompts, implementation guides, workflows

### "I need to update collections API"
→ Go to **[collections/api/](./collections/api/)** folder
- Contains: All collection API documentation

### "I need to create a batch generation panel"
→ Go to **[generator/BATCH-GENERATION-PATTERN.md](./generator/BATCH-GENERATION-PATTERN.md)**
- Contains: Step-by-step guide for creating batch generation functionality

### "I need to understand the system architecture"
→ Go to **[system/architecture/](./system/architecture/)** folder
- Contains: System architecture, design decisions, project organization

---

## 📁 Folder Structure

```
docs/
├── trivia/                    # Trivia system documentation
│   ├── api/                   # Trivia API endpoints
│   ├── implementation/        # Implementation guides
│   ├── guides/               # How-to guides
│   └── history/              # Historical context
│
├── process-builders/          # Process builder documentation
│   ├── architecture/         # Architecture decisions
│   ├── implementation/        # Implementation guides
│   ├── guides/               # Testing guides
│   ├── planning/             # Planning documents
│   └── history/              # Historical context
│
├── content-sourcing/         # Content sourcing documentation
│   ├── database/             # Database schema
│   ├── implementation/       # Workflow implementation
│   ├── ai/                  # AI prompts and extraction
│   ├── guides/              # Usage guides
│   └── planning/            # Planning documents
│
├── collections/              # Collections documentation
│   ├── api/                 # Collection APIs
│   ├── implementation/       # Implementation patterns
│   └── history/             # Historical context
│
├── generator/                # Generator documentation
│   └── BATCH-GENERATION-PATTERN.md  # Batch generation pattern guide
│
├── system/                   # System-wide documentation
│   ├── architecture/        # System architecture
│   ├── api/                 # API design patterns
│   ├── guides/              # General guides
│   └── database/            # Database patterns
│
├── ai-integration/           # AI integration
│   └── prompts/             # AI prompts
│
├── setup/                    # Setup and onboarding
├── planning/                 # Planning documents
├── testing/                  # Testing guides
└── archive/                  # Archived documents
```

---

## 📚 By Content Type

### Trivia

- **Domain Folder**: [trivia/](./trivia/)
- **API Docs**: [trivia/api/](./trivia/api/)
- **Implementation**: [trivia/implementation/](./trivia/implementation/)

### Process Builders

- **Domain Folder**: [process-builders/](./process-builders/)
- **Architecture**: [process-builders/architecture/](./process-builders/architecture/)
- **Implementation**: [process-builders/implementation/](./process-builders/implementation/)

### Content Sourcing

- **Domain Folder**: [content-sourcing/](./content-sourcing/)
- **Database**: [content-sourcing/database/](./content-sourcing/database/)
- **AI Integration**: [content-sourcing/ai/](./content-sourcing/ai/)

### Collections

- **Domain Folder**: [collections/](./collections/)
- **API Docs**: [collections/api/](./collections/api/)
- **Implementation**: [collections/implementation/](./collections/implementation/)

---

## 🎓 Learning Path

### For New Developers

1. **Start Here**: [system/guides/DEVELOPER-HANDOFF-SUMMARY.md](./system/guides/DEVELOPER-HANDOFF-SUMMARY.md)
2. **Architecture**: [system/architecture/ARCHITECTURE.md](./system/architecture/ARCHITECTURE.md)
3. **Patterns**: [collections/implementation/CONTENT-LIBRARY-TABLE-PATTERN.md](./collections/implementation/CONTENT-LIBRARY-TABLE-PATTERN.md)

### For Feature Development

1. Navigate to the relevant domain folder
2. Read the domain README.md
3. Explore the subfolders (api/, implementation/, guides/)
4. Check history/ for context

---

## 🔍 Search Tips

### Find by Feature
- **Trivia** → [trivia/](./trivia/)
- **Process Builders** → [process-builders/](./process-builders/)
- **Content Sourcing** → [content-sourcing/](./content-sourcing/)
- **Collections** → [collections/](./collections/)
- **Generator/Batch Processing** → [generator/BATCH-GENERATION-PATTERN.md](./generator/BATCH-GENERATION-PATTERN.md)

### Find by Type
- **API Documentation** → Check `*/api/` folders
- **Architecture** → Check `*/architecture/` folders
- **Implementation Guides** → Check `*/implementation/` folders
- **How-To Guides** → Check `*/guides/` folders

---

## 📊 Documentation Status

| Domain | Status | Last Updated |
|--------|--------|---------------|
| Trivia | ✅ Complete | Current |
| Process Builders | ✅ Complete | Current |
| Content Sourcing | ✅ Complete | Current |
| Collections | ✅ Complete | Current |
| System | ✅ Complete | Current |

---

## 🆘 Troubleshooting

### "I can't find a document"
1. Check the relevant domain folder README.md
2. Search by feature name in domain folders
3. Check [archive/](./archive/) for historical documents

### "I need context for a feature"
1. Navigate to the domain folder
2. Read the domain README.md
3. Explore subfolders for complete context

---

## 💡 Pro Tips

1. **Start with domain README** - Each domain has a README.md with overview and quick links
2. **Use domain folders** - Point to a domain folder for complete context
3. **Check history** - Domain folders include `history/` subfolders for context
4. **Archive is searchable** - Historical docs are preserved in [archive/](./archive/)

---

**Need help?** Start with the domain folder README.md files - they provide complete context for each area!
