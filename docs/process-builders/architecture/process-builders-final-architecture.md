# Process Builders: Final Architecture (With All Improvements)

## Assessment: These Suggestions Significantly Improve the Architecture

### ✅ **Improvement 1: Auto-Discovery Registry** - Excellent

**Problem:** Manual registration is error-prone and creates coupling
**Solution:** Dynamic discovery eliminates manual steps
**Benefit:** True plug-and-play architecture

### ✅ **Improvement 2: Strict shared/ Rules** - Excellent

**Problem:** shared/ can become a dumping ground
**Solution:** Only utilities used by 3+ builders
**Benefit:** Maintains isolation, prevents premature abstraction

### ✅ **Improvement 3: Separate Data Structures** - Excellent

**Problem:** Complex types in core/ creates coupling
**Solution:** Builder-specific types in builder folders
**Benefit:** Deleting builder removes all its types

---

## Final Architecture Structure

```
process-builders/
├── core/
│   ├── types.ts                    # Generic system types only
│   │   # IProcessGoal, ITaskResult, IProcessBuilderManifest
│   │   # NOT builder-specific types
│   │
│   ├── registry.ts                 # ✅ Auto-discovery (NEW)
│   │   # Dynamically scans process-builders/ folders
│   │   # No manual registration needed
│   │
│   ├── executor.ts                 # Task execution engine
│   ├── validation.ts                # Schema validation
│   ├── monitoring.ts                # Basic monitoring
│   ├── testing.ts                   # Testing utilities
│   └── errors.ts                   # Error handling
│
├── shared/                          # ✅ STRICT: Only 3+ builders use
│   ├── helpers/
│   │   ├── database.ts              # Used by all builders
│   │   ├── caching.ts               # Used by all builders
│   │   └── logging.ts               # Used by all builders
│   │
│   └── components/
│       ├── process-builder-form.tsx  # Generic form
│       ├── task-progress.tsx        # Progress UI
│       └── result-preview.tsx       # Result preview
│
├── build-trivia-set/                # 🎯 Isolated Module
│   ├── config.json                  # Configuration
│   │
│   ├── lib/
│   │   ├── index.ts                 # Public API + Manifest
│   │   ├── build-trivia-set.ts      # Main function
│   │   ├── actions.ts               # Server actions
│   │   │
│   │   ├── tasks/                    # Task implementations
│   │   │   ├── query-questions.ts
│   │   │   ├── select-balance.ts
│   │   │   ├── generate-metadata.ts
│   │   │   ├── assemble-data.ts
│   │   │   ├── create-record.ts
│   │   │   └── validate-finalize.ts
│   │   │
│   │   ├── types/                    # ✅ Builder-specific types (NEW)
│   │   │   ├── trivia-set.ts         # ITriviaSetRecord, etc.
│   │   │   ├── question-selection.ts # Selection types
│   │   │   └── metadata.ts           # Metadata types
│   │   │
│   │   ├── helpers/                  # Builder-specific helpers
│   │   │   ├── theme-matching.ts     # Only used by this builder
│   │   │   └── relevance-scoring.ts  # Only used by this builder
│   │   │
│   │   └── __tests__/                # Tests
│   │       ├── tasks/
│   │       └── integration.test.ts
│   │
│   ├── components/                   # Builder-specific UI
│   │   ├── trivia-set-form.tsx
│   │   └── trivia-set-preview.tsx
│   │
│   └── README.md                     # Documentation
│
├── generate-content-batch/           # 🎯 Future Process Builder
│   ├── lib/
│   │   ├── index.ts                  # Public API + Manifest
│   │   ├── types/                     # ✅ Builder-specific types
│   │   │   └── batch-generation.ts
│   │   └── helpers/                   # Builder-specific helpers
│   │
│   └── components/
│
└── README.md                         # Architecture docs
```

---

## Improvement 1: Auto-Discovery Registry

### Problem with Manual Registration

**Before (Manual):**

```typescript
// core/registry.ts
export const PROCESS_BUILDERS: Record<string, ProcessBuilderMetadata> = {
  'build-trivia-set': { ... },  // ❌ Manual registration
  'generate-batch': { ... },     // ❌ Easy to forget
};
```

**Issues:**

- ❌ Easy to forget to register
- ❌ Creates coupling (must edit core file)
- ❌ Not truly plug-and-play

### Solution: Auto-Discovery

**File:** `process-builders/core/registry.ts`

```typescript
import type { ProcessBuilderMetadata } from "./types";

// Cache for discovered process builders
let discoveredBuilders: Map<string, ProcessBuilderMetadata> | null = null;

/**
 * Auto-discover process builders by scanning process-builders/ directory
 * Looks for lib/index.ts or lib/process-definition.ts in each folder
 */
export async function discoverProcessBuilders(): Promise<
  Map<string, ProcessBuilderMetadata>
> {
  if (discoveredBuilders) {
    return discoveredBuilders;
  }

  discoveredBuilders = new Map();

  // In Next.js, we can use dynamic imports with glob patterns
  // For build-time discovery, we'll use a convention-based approach

  try {
    // Pattern: Import all process builders that export a 'metadata' export
    // This works at build time with Next.js

    // Option 1: Use a manifest file that lists all builders
    // Option 2: Use dynamic imports with known folder structure
    // Option 3: Use a build script to generate registry

    // For now, we'll use a hybrid approach:
    // - Build script generates a registry index
    // - Runtime loads from that index

    const registryIndex = await import("../../process-builders-registry.json");

    for (const [id, metadata] of Object.entries(registryIndex.default)) {
      discoveredBuilders.set(id, metadata as ProcessBuilderMetadata);
    }
  } catch (error) {
    console.warn("Failed to auto-discover process builders:", error);
    // Fallback to empty registry
  }

  return discoveredBuilders;
}

/**
 * Get a specific process builder by ID
 */
export async function getProcessBuilder(
  id: string,
): Promise<ProcessBuilderMetadata | null> {
  const builders = await discoverProcessBuilders();
  return builders.get(id) || null;
}

/**
 * Get all discovered process builders
 */
export async function getAllProcessBuilders(): Promise<
  ProcessBuilderMetadata[]
> {
  const builders = await discoverProcessBuilders();
  return Array.from(builders.values());
}

/**
 * Register a process builder (for runtime registration if needed)
 */
export function registerProcessBuilder(metadata: ProcessBuilderMetadata): void {
  if (!discoveredBuilders) {
    discoveredBuilders = new Map();
  }
  discoveredBuilders.set(metadata.id, metadata);
}
```

### Build Script for Auto-Discovery

**File:** `scripts/discover-process-builders.ts`

```typescript
import fs from "fs";
import path from "path";
import { glob } from "glob";

interface ProcessBuilderManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  tasks: string[];
  requiredRules: string[];
  optionalRules: string[];
  defaults?: Record<string, unknown>;
  limits?: Record<string, { min?: number; max?: number }>;
}

async function discoverProcessBuilders(): Promise<
  Record<string, ProcessBuilderManifest>
> {
  const processBuildersDir = path.join(process.cwd(), "process-builders");
  const builders: Record<string, ProcessBuilderManifest> = {};

  // Find all process builder folders
  const builderFolders = fs
    .readdirSync(processBuildersDir, { withFileTypes: true })
    .filter(
      (dirent) =>
        dirent.isDirectory() &&
        dirent.name !== "core" &&
        dirent.name !== "shared",
    )
    .map((dirent) => dirent.name);

  for (const folderName of builderFolders) {
    const indexPath = path.join(
      processBuildersDir,
      folderName,
      "lib",
      "index.ts",
    );

    if (fs.existsSync(indexPath)) {
      try {
        // Dynamically import the index file to get metadata
        const module = await import(path.resolve(indexPath));

        if (module.metadata) {
          builders[module.metadata.id] = module.metadata;
          console.log(
            `✓ Discovered: ${module.metadata.name} (${module.metadata.id})`,
          );
        } else {
          console.warn(`⚠ No metadata found in ${folderName}/lib/index.ts`);
        }
      } catch (error) {
        console.error(`✗ Failed to load ${folderName}:`, error);
      }
    } else {
      console.warn(`⚠ No lib/index.ts found in ${folderName}`);
    }
  }

  return builders;
}

// Generate registry JSON file
async function generateRegistry() {
  const builders = await discoverProcessBuilders();
  const registryPath = path.join(
    process.cwd(),
    "process-builders-registry.json",
  );

  fs.writeFileSync(registryPath, JSON.stringify(builders, null, 2), "utf-8");

  console.log(
    `\n✓ Generated registry with ${Object.keys(builders).length} process builders`,
  );
  console.log(`  Registry file: ${registryPath}`);
}

generateRegistry().catch(console.error);
```

**Add to package.json:**

```json
{
  "scripts": {
    "discover-builders": "tsx scripts/discover-process-builders.ts",
    "build": "npm run discover-builders && next build"
  }
}
```

### Process Builder Entry Point

**File:** `process-builders/build-trivia-set/lib/index.ts`

```typescript
import { buildTriviaSet } from "./build-trivia-set";
import { buildTriviaSetAction } from "./actions";
import type { ProcessBuilderMetadata } from "../../core/types";

// Export main function
export { buildTriviaSet, buildTriviaSetAction };

// ✅ Export metadata for auto-discovery
export const metadata: ProcessBuilderMetadata = {
  id: "build-trivia-set",
  name: "Build Trivia Set",
  description: "Creates a curated trivia set from existing questions",
  version: "1.0.0",
  tasks: [
    "query-questions",
    "select-balance",
    "generate-metadata",
    "assemble-data",
    "create-record",
    "validate-finalize",
  ],
  requiredRules: ["questionTypes", "questionCount"],
  optionalRules: ["distributionStrategy", "theme", "cooldownDays"],
  defaults: {
    distributionStrategy: "weighted",
    cooldownDays: 30,
  },
  limits: {
    questionCount: { min: 1, max: 100 },
  },
};
```

**Result:** Just create the folder and export metadata - auto-discovered!

---

## Improvement 2: Strict shared/ Rules

### Rule: Only utilities used by 3+ builders

**Decision Tree:**

```
Is this utility used by 3+ process builders?
├─ YES → Put in shared/
└─ NO → Put in builder's lib/helpers/
    └─ If 2 builders need it → Copy to both (DRY later)
```

### Examples

**✅ Belongs in shared/:**

- `database.ts` - All builders query database
- `caching.ts` - All builders use caching
- `logging.ts` - All builders need logging
- `retry.ts` - All builders benefit from retry logic

**❌ Does NOT belong in shared/:**

- `theme-matching.ts` - Only build-trivia-set uses it
- `calculate-split.ts` - Only build-trivia-set uses it
- `slugify.ts` - Only 2 builders use it (copy to both)

### Enforcement

**File:** `process-builders/shared/README.md`

```markdown
# Shared Utilities

## Rules

**Only add utilities here if:**

1. Used by 3+ process builders
2. Generic enough to be reusable
3. Not builder-specific logic

## Before Adding

Ask yourself:

- Is this used by 3+ builders? → YES: Add here
- Is this builder-specific? → NO: Add here
- Is this only used by 1-2 builders? → NO: Keep in builder folders

## Examples

✅ **Good additions:**

- Database query helpers
- Caching utilities
- Logging utilities
- Retry logic

❌ **Bad additions:**

- Theme matching (only trivia sets)
- Question selection (only trivia sets)
- Content formatting (only 2 builders)
```

---

## Improvement 3: Separate Data Structures

### Problem: Types in core/ create coupling

**Before:**

```typescript
// core/types.ts
export interface TriviaSet {
  // ❌ Builder-specific type in core
  id: string;
  title: string;
  // ...
}
```

**Issue:** Deleting `build-trivia-set/` doesn't remove `TriviaSet` type from core.

### Solution: Builder-specific types in builder folders

**File:** `process-builders/core/types.ts` (Generic only)

```typescript
// ✅ Generic system types only
export interface ProcessBuilderGoal {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessBuilderTask {
  id: string;
  name: string;
  execute: (context: TaskContext) => Promise<TaskResult>;
}

export interface TaskResult {
  success: boolean;
  data?: unknown; // Generic - builder-specific types elsewhere
  errors?: ProcessBuilderError[];
}

export interface ProcessBuilderMetadata {
  id: string;
  name: string;
  // ... generic metadata
}

// ❌ NO builder-specific types here!
```

**File:** `process-builders/build-trivia-set/lib/types/trivia-set.ts`

```typescript
// ✅ Builder-specific types in builder folder

export interface TriviaSet {
  id: string;
  title: string;
  slug: string;
  description?: string;
  theme: string;
  question_data: TriviaQuestionData[];
  question_count: number;
  status: "draft" | "published" | "archived";
  visibility: "Public" | "Unlisted" | "Private";
  created_at: string;
  updated_at: string;
}

export interface TriviaQuestionData {
  question_id: string;
  source_id: number;
  question_text: string;
  question_type: "multiple-choice" | "true-false" | "who-am-i";
  correct_answer: string;
  wrong_answers: string[];
  explanation?: string;
  tags?: string[];
  difficulty?: number;
}

export interface QuestionSelectionResult {
  candidates: TriviaQuestion[];
  selected: TriviaQuestion[];
  distribution: {
    tmc: number;
    tft: number;
  };
}

// ✅ All trivia-set-specific types here
// ✅ Deleting build-trivia-set/ removes all these types
```

**File:** `process-builders/build-trivia-set/lib/types/index.ts`

```typescript
// Barrel export for builder types
export * from "./trivia-set";
export * from "./question-selection";
export * from "./metadata";
```

**Usage in builder:**

```typescript
// process-builders/build-trivia-set/lib/build-trivia-set.ts
import type { TriviaSet, TriviaQuestionData } from './types';  // ✅ Local types
import type { ProcessBuilderResult } from '../../core/types';  // ✅ Generic types

export async function buildTriviaSet(...): Promise<ProcessBuilderResult> {
  // Use TriviaSet type - defined in this builder's folder
  const triviaSet: TriviaSet = {
    // ...
  };

  return {
    status: 'success',
    finalResult: triviaSet,  // Type-safe
    // ...
  };
}
```

---

## Updated Adding Process Builder Guide

### Step 1: Create Folder Structure

```bash
mkdir -p process-builders/my-new-process/lib/tasks
mkdir -p process-builders/my-new-process/lib/types
mkdir -p process-builders/my-new-process/lib/helpers
mkdir -p process-builders/my-new-process/components
```

### Step 2: Create Entry Point with Metadata

**File:** `process-builders/my-new-process/lib/index.ts`

```typescript
import { myNewProcess } from "./my-new-process";
import { myNewProcessAction } from "./actions";
import type { ProcessBuilderMetadata } from "../../core/types";

export { myNewProcess, myNewProcessAction };

// ✅ Export metadata - auto-discovered!
export const metadata: ProcessBuilderMetadata = {
  id: "my-new-process",
  name: "My New Process",
  description: "Does something cool",
  version: "1.0.0",
  tasks: ["task1", "task2"],
  requiredRules: ["rule1"],
  optionalRules: ["rule2"],
};
```

### Step 3: Implement Tasks

```typescript
// process-builders/my-new-process/lib/tasks/task1.ts
import type { ProcessBuilderTask } from "../../../core/types";

export const task1: ProcessBuilderTask = {
  id: "task1",
  name: "Task 1",
  description: "Does something",
  async execute(context) {
    return { success: true, data: {} };
  },
};
```

### Step 4: Create Builder-Specific Types

```typescript
// process-builders/my-new-process/lib/types/my-types.ts
export interface MyProcessResult {
  // Builder-specific types here
}
```

### Step 5: Run Discovery Script

```bash
npm run discover-builders
```

**That's it!** No manual registration needed.

---

## Benefits Summary

### ✅ **Auto-Discovery**

- No manual registration
- True plug-and-play
- Less error-prone
- Better developer experience

### ✅ **Strict shared/ Rules**

- Prevents premature abstraction
- Maintains isolation
- Clear boundaries
- Easier to understand

### ✅ **Separate Data Structures**

- Complete isolation
- Deleting builder removes all types
- No coupling through types
- Better organization

---

## Final Architecture Principles

1. **Auto-Discovery** - No manual registration
2. **Strict Isolation** - Builder-specific code stays in builder folder
3. **Shared Only When Needed** - 3+ builders rule
4. **Type Safety** - Generic types in core, specific types in builders
5. **Easy Deletion** - Delete folder = remove everything

---

## Conclusion

**Yes, these improvements significantly enhance the architecture!**

They address:

- ✅ **Coupling** - Auto-discovery eliminates manual registration
- ✅ **Isolation** - Strict shared/ rules and separate types
- ✅ **Maintainability** - Clear boundaries and conventions
- ✅ **Scalability** - True plug-and-play architecture

**The architecture is now production-ready and truly scalable.**
