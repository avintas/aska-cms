# Process Builders: Scalable Architecture (1-Year Vision)

## Vision

**Process Builders** are reusable, isolated workflows that automate complex CMS tasks. Each process builder:

- Takes Goals and Rules as input
- Executes a series of Tasks
- Produces Results
- Can be deleted/replaced without affecting others

---

## Architecture Overview

```
process-builders/                    # 🎯 ROOT: Delete this = removes ALL process builders
├── core/                            # Shared infrastructure (all process builders use)
│   ├── types.ts                     # Common types/interfaces
│   ├── registry.ts                  # Process builder registry/discovery
│   ├── executor.ts                  # Task execution engine
│   ├── validation.ts                # Common validation utilities
│   └── errors.ts                    # Error handling
│
├── shared/                          # Shared utilities (optional use)
│   ├── helpers/                     # Common helper functions
│   │   ├── database.ts              # Database utilities
│   │   ├── caching.ts               # Caching utilities
│   │   └── logging.ts               # Logging utilities
│   └── components/                  # Shared UI components
│       ├── process-builder-form.tsx # Generic form component
│       ├── task-progress.tsx         # Progress indicator
│       └── result-preview.tsx       # Result preview
│
├── build-trivia-set/                # 🎯 Process Builder #1 (isolated)
│   ├── lib/
│   │   ├── index.ts                 # Public API
│   │   ├── build-trivia-set.ts      # Main function
│   │   ├── actions.ts               # Server actions
│   │   ├── tasks/                   # Task implementations
│   │   │   ├── query-questions.ts
│   │   │   ├── select-balance.ts
│   │   │   ├── generate-metadata.ts
│   │   │   ├── assemble-data.ts
│   │   │   ├── create-record.ts
│   │   │   └── validate-finalize.ts
│   │   ├── helpers/                 # Process-specific helpers
│   │   │   ├── theme-matching.ts
│   │   │   └── relevance-scoring.ts
│   │   └── types.ts                 # Process-specific types
│   │
│   ├── components/                  # Process-specific UI
│   │   ├── trivia-set-form.tsx
│   │   └── trivia-set-preview.tsx
│   │
│   └── README.md                    # Process documentation
│
├── generate-content-batch/          # 🎯 Process Builder #2 (future)
│   ├── lib/
│   │   ├── index.ts
│   │   ├── generate-batch.ts
│   │   ├── actions.ts
│   │   ├── tasks/
│   │   └── types.ts
│   ├── components/
│   └── README.md
│
├── build-hero-collection/            # 🎯 Process Builder #3 (future)
│   ├── lib/
│   ├── components/
│   └── README.md
│
└── README.md                         # Architecture documentation
```

---

## Core Infrastructure

### 1. Common Types (`core/types.ts`)

```typescript
// Base interfaces that ALL process builders implement

export interface ProcessBuilderGoal {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessBuilderRule {
  key: string;
  value: unknown;
  type: "string" | "number" | "boolean" | "array" | "object";
}

export interface ProcessBuilderRules {
  [key: string]: ProcessBuilderRule;
}

export interface ProcessBuilderTask {
  id: string;
  name: string;
  description: string;
  execute: (context: TaskContext) => Promise<TaskResult>;
  validate?: (context: TaskContext) => Promise<ValidationResult>;
}

export interface TaskContext {
  goal: ProcessBuilderGoal;
  rules: ProcessBuilderRules;
  options?: ProcessBuilderOptions;
  previousResults?: TaskResult[];
  metadata?: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  errors?: ProcessBuilderError[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface ProcessBuilderOptions {
  allowPartialResults?: boolean;
  useCache?: boolean;
  dryRun?: boolean;
  [key: string]: unknown;
}

export interface ProcessBuilderResult {
  status: "success" | "error" | "partial";
  processId: string;
  processName: string;
  results: TaskResult[];
  finalResult?: unknown;
  errors?: ProcessBuilderError[];
  warnings?: string[];
  executionTime: number;
  metadata?: Record<string, unknown>;
}

export interface ProcessBuilderError {
  code: string;
  message: string;
  taskId?: string;
  details?: unknown;
}

export interface ProcessBuilderMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  tasks: string[]; // Task IDs
  requiredRules: string[];
  optionalRules: string[];
}
```

### 2. Process Builder Registry (`core/registry.ts`)

```typescript
import type { ProcessBuilderMetadata } from "./types";

// Registry of all available process builders
export const PROCESS_BUILDERS: Record<string, ProcessBuilderMetadata> = {
  "build-trivia-set": {
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
    optionalRules: ["distributionStrategy", "theme"],
  },

  // Future process builders register here
  "generate-content-batch": {
    id: "generate-content-batch",
    name: "Generate Content Batch",
    description: "Generates multiple content items in batch",
    version: "1.0.0",
    tasks: ["validate-input", "generate-content", "save-results"],
    requiredRules: ["contentType", "count"],
    optionalRules: ["sourceContent", "prompt"],
  },
};

export function getProcessBuilder(id: string): ProcessBuilderMetadata | null {
  return PROCESS_BUILDERS[id] || null;
}

export function getAllProcessBuilders(): ProcessBuilderMetadata[] {
  return Object.values(PROCESS_BUILDERS);
}

export function registerProcessBuilder(metadata: ProcessBuilderMetadata): void {
  PROCESS_BUILDERS[metadata.id] = metadata;
}
```

### 3. Task Executor (`core/executor.ts`)

```typescript
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderTask,
  TaskContext,
  TaskResult,
  ProcessBuilderResult,
} from "./types";

export class ProcessBuilderExecutor {
  private tasks: ProcessBuilderTask[] = [];
  private results: TaskResult[] = [];

  constructor(tasks: ProcessBuilderTask[]) {
    this.tasks = tasks;
  }

  async execute(
    goal: ProcessBuilderGoal,
    rules: ProcessBuilderRules,
    options?: ProcessBuilderOptions,
  ): Promise<ProcessBuilderResult> {
    const startTime = Date.now();
    this.results = [];

    const context: TaskContext = {
      goal,
      rules,
      options,
      previousResults: [],
      metadata: {},
    };

    try {
      // Execute each task in sequence
      for (const task of this.tasks) {
        // Validate task if validator exists
        if (task.validate) {
          const validation = await task.validate(context);
          if (!validation.valid) {
            throw new Error(
              `Task ${task.id} validation failed: ${validation.error}`,
            );
          }
        }

        // Execute task
        const result = await task.execute(context);
        this.results.push(result);

        // Update context with result
        context.previousResults.push(result);
        if (result.data) {
          context.metadata = { ...context.metadata, ...result.metadata };
        }

        // Stop on error (unless partial results allowed)
        if (!result.success && !options?.allowPartialResults) {
          break;
        }
      }

      // Determine final status
      const hasErrors = this.results.some((r) => !r.success);
      const allSuccess = this.results.every((r) => r.success);

      const status = allSuccess
        ? "success"
        : hasErrors && options?.allowPartialResults
          ? "partial"
          : "error";

      return {
        status,
        processId: "unknown", // Set by process builder
        processName: "unknown", // Set by process builder
        results: this.results,
        finalResult: this.results[this.results.length - 1]?.data,
        errors: this.results.flatMap((r) => r.errors || []),
        warnings: this.results.flatMap((r) => r.warnings || []),
        executionTime: Date.now() - startTime,
        metadata: context.metadata,
      };
    } catch (error) {
      return {
        status: "error",
        processId: "unknown",
        processName: "unknown",
        results: this.results,
        errors: [
          {
            code: "EXECUTION_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            details: error,
          },
        ],
        executionTime: Date.now() - startTime,
      };
    }
  }
}
```

---

## Process Builder Implementation Pattern

### Example: Build Trivia Set

**File:** `process-builders/build-trivia-set/lib/index.ts`

```typescript
import { buildTriviaSet } from "./build-trivia-set";
import { buildTriviaSetAction } from "./actions";
import type { ProcessBuilderMetadata } from "../../core/types";

// Export main function
export { buildTriviaSet, buildTriviaSetAction };

// Export metadata for registry
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
};
```

**File:** `process-builders/build-trivia-set/lib/build-trivia-set.ts`

```typescript
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderResult,
} from "../../core/types";
import { ProcessBuilderExecutor } from "../../core/executor";
import { queryQuestionsTask } from "./tasks/query-questions";
import { selectBalanceTask } from "./tasks/select-balance";
import { generateMetadataTask } from "./tasks/generate-metadata";
import { assembleDataTask } from "./tasks/assemble-data";
import { createRecordTask } from "./tasks/create-record";
import { validateFinalizeTask } from "./tasks/validate-finalize";

export async function buildTriviaSet(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult> {
  // Create executor with tasks
  const executor = new ProcessBuilderExecutor([
    queryQuestionsTask,
    selectBalanceTask,
    generateMetadataTask,
    assembleDataTask,
    createRecordTask,
    validateFinalizeTask,
  ]);

  // Execute process
  const result = await executor.execute(goal, rules, options);

  // Add process-specific metadata
  return {
    ...result,
    processId: "build-trivia-set",
    processName: "Build Trivia Set",
  };
}
```

**File:** `process-builders/build-trivia-set/lib/tasks/query-questions.ts`

```typescript
import type {
  ProcessBuilderTask,
  TaskContext,
  TaskResult,
} from "../../../core/types";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const queryQuestionsTask: ProcessBuilderTask = {
  id: "query-questions",
  name: "Query Source Questions",
  description: "Fetches questions from database matching theme and types",

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      const theme = context.goal.text; // Extract from goal
      const questionTypes = context.rules.questionTypes?.value as string[];

      // Query database
      const candidates = [];

      if (questionTypes.includes("TMC")) {
        const { data } = await supabaseAdmin
          .from("trivia_multiple_choice")
          .select("*")
          .eq("status", "published")
          .ilike("theme", `%${theme}%`);

        candidates.push(...(data || []));
      }

      // Similar for TFT, etc.

      return {
        success: true,
        data: { candidates },
        metadata: { candidateCount: candidates.length },
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: "QUERY_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
            taskId: "query-questions",
          },
        ],
      };
    }
  },
};
```

---

## Shared Components

### Generic Process Builder Form (`shared/components/process-builder-form.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { getAllProcessBuilders } from '../../core/registry';
import type { ProcessBuilderMetadata } from '../../core/types';

interface ProcessBuilderFormProps {
  processId: string;
  onSubmit: (goal: string, rules: Record<string, unknown>) => Promise<void>;
}

export default function ProcessBuilderForm({
  processId,
  onSubmit
}: ProcessBuilderFormProps) {
  const process = getAllProcessBuilders().find(p => p.id === processId);

  if (!process) {
    return <div>Process builder not found</div>;
  }

  const [goal, setGoal] = useState('');
  const [rules, setRules] = useState<Record<string, unknown>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(goal, rules);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{process.name}</h2>
      <p>{process.description}</p>

      <label>
        Goal:
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </label>

      {/* Render rule inputs based on process.requiredRules and process.optionalRules */}

      <button type="submit">Execute</button>
    </form>
  );
}
```

---

## Adding a New Process Builder

### Step 1: Create Folder Structure

```bash
mkdir -p process-builders/my-new-process/lib/tasks
mkdir -p process-builders/my-new-process/lib/helpers
mkdir -p process-builders/my-new-process/components
```

### Step 2: Implement Tasks

```typescript
// process-builders/my-new-process/lib/tasks/task1.ts
import type { ProcessBuilderTask } from "../../../core/types";

export const task1: ProcessBuilderTask = {
  id: "task1",
  name: "Task 1",
  description: "Does something",
  async execute(context) {
    // Implementation
    return { success: true, data: {} };
  },
};
```

### Step 3: Create Main Function

```typescript
// process-builders/my-new-process/lib/my-new-process.ts
import { ProcessBuilderExecutor } from "../../core/executor";
import { task1 } from "./tasks/task1";
import { task2 } from "./tasks/task2";

export async function myNewProcess(goal, rules, options) {
  const executor = new ProcessBuilderExecutor([task1, task2]);
  return await executor.execute(goal, rules, options);
}
```

### Step 4: Register in Registry

```typescript
// process-builders/core/registry.ts
export const PROCESS_BUILDERS: Record<string, ProcessBuilderMetadata> = {
  // ... existing

  "my-new-process": {
    id: "my-new-process",
    name: "My New Process",
    description: "Does something cool",
    version: "1.0.0",
    tasks: ["task1", "task2"],
    requiredRules: ["rule1"],
    optionalRules: ["rule2"],
  },
};
```

### Step 5: Create Server Action

```typescript
// process-builders/my-new-process/lib/actions.ts
"use server";

import { myNewProcess } from "./my-new-process";

export async function myNewProcessAction(goal, rules, options) {
  return await myNewProcess(goal, rules, options);
}
```

**That's it!** The process builder is now available.

---

## Deletion Strategy

### Delete Single Process Builder

```bash
# Delete just this process builder
rm -rf process-builders/build-trivia-set/

# Remove from registry
# Edit process-builders/core/registry.ts and remove entry
```

**Result:** Other process builders continue working.

### Delete All Process Builders

```bash
# Delete entire system
rm -rf process-builders/
```

**Result:** CMS continues working normally.

---

## Benefits of This Architecture

### ✅ **Scalability**

- Easy to add new process builders
- Consistent patterns
- Shared infrastructure reduces duplication

### ✅ **Isolation**

- Each process builder is self-contained
- Can delete any one without affecting others
- Clear boundaries

### ✅ **Reusability**

- Common types and utilities
- Shared components
- Task executor handles common patterns

### ✅ **Discoverability**

- Registry makes all process builders discoverable
- Metadata describes capabilities
- Easy to build UI that lists available processes

### ✅ **Testability**

- Each task is independently testable
- Process builder can be tested in isolation
- Mock executor for testing

### ✅ **Maintainability**

- Clear structure
- Consistent patterns
- Documentation in each process builder

---

## Future Process Builders (1-Year Vision)

### Potential Process Builders:

1. **Build Trivia Set** ✅ (current)
   - Creates curated trivia sets from questions

2. **Generate Content Batch**
   - Generates multiple content items in one go
   - Uses Main Generator logic

3. **Build Hero Collection**
   - Creates hero collections from content
   - Similar to trivia sets but for collections

4. **Process Source Content**
   - Automates content processing workflow
   - Uses text-processing logic

5. **Bulk Publish**
   - Publishes multiple items at once
   - With validation and scheduling

6. **Content Migration**
   - Migrates content between formats
   - Transforms data structures

7. **Quality Audit**
   - Audits content quality
   - Generates reports

8. **Auto-Tagging**
   - Automatically tags content
   - Uses AI/ML

---

## Integration with CMS

### CMS Navigation Integration

**File:** `components/app-shell.tsx`

```typescript
import { getAllProcessBuilders } from "@/process-builders/core/registry";

const processingActions = [
  {
    id: 0,
    name: "The Main Generator",
    href: "/cms/processing/main-generator",
    initial: "⚡",
  },
  // Dynamically add process builders
  ...getAllProcessBuilders().map((pb) => ({
    id: pb.id,
    name: pb.name,
    href: `/cms/process-builders/${pb.id}`,
    initial: "🔧",
  })),
];
```

### Process Builder Page Template

**File:** `app/cms/process-builders/[id]/page.tsx`

```typescript
import { getProcessBuilder } from '@/process-builders/core/registry';
import ProcessBuilderForm from '@/process-builders/shared/components/process-builder-form';

export default function ProcessBuilderPage({ params }: { params: { id: string } }) {
  const process = getProcessBuilder(params.id);

  if (!process) {
    return <div>Process builder not found</div>;
  }

  // Dynamically import process builder action
  const actionModule = await import(`@/process-builders/${params.id}/lib/actions`);
  const action = actionModule[`${params.id}Action`];

  return (
    <ProcessBuilderForm
      processId={params.id}
      onSubmit={async (goal, rules) => {
        const result = await action(goal, rules);
        // Handle result
      }}
    />
  );
}
```

---

## Summary

**Architecture Principles:**

1. **Isolated Modules** - Each process builder is self-contained
2. **Shared Core** - Common infrastructure in `core/`
3. **Consistent Pattern** - All process builders follow same structure
4. **Registry System** - Centralized discovery and metadata
5. **Task-Based** - Composable tasks for flexibility
6. **Easy Deletion** - Delete folder = remove process builder

**To Add New Process Builder:**

1. Create folder in `process-builders/`
2. Implement tasks
3. Create main function
4. Register in registry
5. Done!

**To Delete Process Builder:**

1. Delete folder
2. Remove from registry
3. Done!

This architecture scales to 10+ process builders while maintaining isolation and simplicity.
