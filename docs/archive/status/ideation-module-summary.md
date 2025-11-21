# Ideation Module - Implementation Summary

## Overview

The Ideation Module is a modular, detachable system for content planning, exploration, and structured plan generation. It provides tools for exploring themes, tags, and categories, analyzing content patterns using AI, and building executable plans for content generation.

## Architecture

### Folder Structure

```
ideation/
├── lib/
│   ├── types.ts           # Core type definitions
│   ├── exploration.ts     # Content exploration functions
│   ├── analysis.ts        # AI-powered analysis using Gemini
│   ├── plan-builder.ts    # Plan creation and validation
│   └── ideation.ts        # Core orchestration logic
├── components/
│   ├── theme-explorer.tsx      # Theme selection UI
│   ├── content-browser.tsx    # Content browsing and selection
│   ├── batch-analyzer.tsx     # AI analysis interface
│   └── plan-viewer.tsx        # Plan display component
├── index.ts               # Public API exports
└── config.json            # Module configuration
```

### Key Features

1. **Exploration Tools**
   - Theme browser with content counts
   - Category filtering by theme
   - Tag exploration
   - Content search with filters
   - Question count analytics

2. **AI-Powered Analysis**
   - Pattern discovery across multiple content records
   - Content synthesis recommendations
   - Quality assessment
   - Opportunity identification
   - Custom prompt support

3. **Plan Building**
   - Structured plan creation
   - Plan validation
   - Plan serialization/deserialization
   - Export for process builder execution

4. **UI Components**
   - Theme Explorer: Visual theme selection with counts
   - Content Browser: Filterable content list with selection
   - Batch Analyzer: AI analysis interface
   - Plan Viewer: Plan display and execution

## API Routes

### `/api/ideation/explore`

- `GET ?action=themes` - Get available themes
- `GET ?action=categories&theme=X` - Get categories for theme
- `GET ?action=tags` - Get all tags
- `GET ?action=content-counts` - Get content counts by theme
- `GET ?action=question-counts` - Get question counts by theme/category
- `GET ?action=search&themes=X&categories=Y` - Search content with filters

### `/api/ideation/analyze`

- `POST` - Analyze multiple content records using Gemini

## Usage

### Basic Exploration

```typescript
import { ideation } from "@/ideation";

// Get available themes
const themes = await ideation.getAvailableThemes();

// Get categories for a theme
const categories = await ideation.getCategoriesForTheme("Players");

// Search content
const results = await ideation.searchContent({
  themes: ["Players"],
  categories: ["Player Spotlight"],
});
```

### AI Analysis

```typescript
import { analyzeContent } from "@/ideation";

const result = await analyzeContent({
  contentIds: [1, 2, 3],
  analysisType: "pattern-discovery",
  prompt: "Find common themes and suggest content types",
});
```

### Plan Building

```typescript
import {
  createIdeationContext,
  addSelection,
  buildPlanFromContext,
} from "@/ideation";

const context = createIdeationContext();
const selection = {
  id: 1,
  type: "source-content",
  contentId: 123,
};

const updatedContext = addSelection(context, selection);
const plan = buildPlanFromContext(updatedContext, "content-selection", {
  theme: "Players",
});
```

## Integration Points

### Main Generator

Plans can be exported and passed to the Main Generator via sessionStorage:

```typescript
const exported = exportPlanForExecution(plan);
sessionStorage.setItem("ideationPlan", JSON.stringify(plan));
```

### Process Builders

Plans export to process builder format:

```typescript
const { goal, rules, selections, parameters } = exportPlanForExecution(plan);
```

## UI Page

The main ideation page (`/cms/ideation`) provides:

- Theme exploration and filtering
- Content browsing with multi-select
- Batch AI analysis
- Plan building and viewing
- Plan execution (navigates to Main Generator)

## Design Principles

1. **Modular & Detachable**: Can be removed without affecting other systems
2. **Type-Safe**: Full TypeScript support with strict types
3. **AI-Powered**: Uses Gemini for intelligent analysis
4. **Component-Based**: Reusable UI components
5. **Process Builder Compatible**: Exports plans in process builder format

## Future Enhancements

- [ ] Plan persistence (save/load plans)
- [ ] Plan templates
- [ ] Scheduled plan execution
- [ ] Multi-content type batch generation
- [ ] Integration with Build Trivia Set page
- [ ] Plan history and versioning
