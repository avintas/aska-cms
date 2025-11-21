# Process Builders: Enhanced Architecture (With Improvements)

## Assessment of Suggested Enhancements

### ✅ **High Value, Implement Now**

1. **Schema Validation** - Essential for type safety and error prevention
2. **Progress Tracking** - Critical for UX (users need to see what's happening)
3. **Testing Utilities** - Essential for maintainability
4. **Lifecycle Hooks** - Useful for cleanup, logging, notifications

### 🟡 **Medium Value, Add Soon**

5. **Configuration Files** - Reduces code, easier to modify without code changes
6. **Monitoring & Analytics** - Important for production, but can start simple
7. **Versioning Support** - Important for long-term, but can start basic

### 🔴 **Lower Priority, Add When Needed**

8. **Dependency Management** - Only needed if process builders depend on each other
9. **Execution Scheduling** - Nice feature, but not critical for MVP

---

## Updated Architecture (With High-Value Enhancements)

```
process-builders/
├── core/
│   ├── types.ts                    # Core types (enhanced)
│   ├── registry.ts                 # Process registry
│   ├── executor.ts                 # Task executor (with progress)
│   ├── validation.ts               # ✅ Schema validation (NEW)
│   ├── monitoring.ts               # ✅ Basic monitoring (NEW)
│   ├── testing.ts                   # ✅ Testing utilities (NEW)
│   └── errors.ts                   # Error handling
│
├── shared/
│   ├── helpers/
│   │   ├── database.ts
│   │   ├── caching.ts
│   │   ├── logging.ts
│   │   └── retry.ts                # ✅ Retry logic (NEW)
│   ├── components/
│   │   ├── process-builder-form.tsx
│   │   ├── task-progress.tsx       # ✅ Progress UI (NEW)
│   │   └── result-preview.tsx
│   └── hooks/                      # ✅ React hooks (NEW)
│       ├── use-process-builder.ts
│       └── use-task-progress.ts
│
├── build-trivia-set/
│   ├── config.json                 # ✅ Configuration (NEW)
│   ├── lib/
│   │   ├── index.ts
│   │   ├── build-trivia-set.ts
│   │   ├── actions.ts
│   │   ├── types.ts
│   │   ├── tasks/
│   │   ├── helpers/
│   │   └── __tests__/              # ✅ Tests (NEW)
│   │       ├── tasks/
│   │       └── integration.test.ts
│   ├── components/
│   └── README.md
│
└── docs/                           # ✅ Centralized docs (NEW)
    ├── architecture.md
    ├── creating-process-builder.md
    └── examples/
```

---

## Enhanced Core Types

**File:** `process-builders/core/types.ts`

```typescript
// Enhanced with progress tracking and lifecycle hooks

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

  // Lifecycle hooks
  onStart?: (context: TaskContext) => Promise<void>;
  execute: (context: TaskContext) => Promise<TaskResult>;
  onSuccess?: (result: TaskResult, context: TaskContext) => Promise<void>;
  onError?: (error: Error, context: TaskContext) => Promise<void>;
  onComplete?: (result: TaskResult, context: TaskContext) => Promise<void>;

  validate?: (context: TaskContext) => Promise<ValidationResult>;

  // Retry configuration
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;

  // Timeout
  timeout?: number; // milliseconds
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

// ✅ NEW: Progress tracking
export interface TaskProgress {
  taskId: string;
  taskName: string;
  status: "pending" | "running" | "completed" | "failed" | "retrying";
  progress: number; // 0-100
  message?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: ProcessBuilderError;
}

export interface ProcessBuilderOptions {
  allowPartialResults?: boolean;
  useCache?: boolean;
  dryRun?: boolean;
  onProgress?: (progress: TaskProgress) => void; // ✅ Progress callback
  [key: string]: unknown;
}

export interface ProcessBuilderResult {
  status: "success" | "error" | "partial";
  processId: string;
  processName: string;
  results: TaskResult[];
  taskProgress: TaskProgress[]; // ✅ Progress tracking
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
  retryable?: boolean;
}

export interface ProcessBuilderMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  tasks: string[]; // Task IDs
  requiredRules: string[];
  optionalRules: string[];

  // ✅ NEW: Versioning support
  deprecatedVersions?: string[];
  migrationGuide?: string;

  // ✅ NEW: Configuration defaults
  defaults?: Record<string, unknown>;
  limits?: Record<string, { min?: number; max?: number }>;
}
```

---

## Enhanced Executor with Progress Tracking

**File:** `process-builders/core/executor.ts`

```typescript
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderTask,
  TaskContext,
  TaskResult,
  ProcessBuilderResult,
  TaskProgress,
} from "./types";
import { retryTask } from "../shared/helpers/retry";

export class ProcessBuilderExecutor {
  private tasks: ProcessBuilderTask[] = [];
  private results: TaskResult[] = [];
  private progress: TaskProgress[] = [];
  private onProgress?: (progress: TaskProgress) => void;

  constructor(
    tasks: ProcessBuilderTask[],
    onProgress?: (progress: TaskProgress) => void,
  ) {
    this.tasks = tasks;
    this.onProgress = onProgress;
  }

  private emitProgress(progressUpdate: TaskProgress): void {
    this.progress.push(progressUpdate);
    this.onProgress?.(progressUpdate);
  }

  async execute(
    goal: ProcessBuilderGoal,
    rules: ProcessBuilderRules,
    options?: ProcessBuilderOptions,
  ): Promise<ProcessBuilderResult> {
    const startTime = Date.now();
    this.results = [];
    this.progress = [];

    const context: TaskContext = {
      goal,
      rules,
      options,
      previousResults: [],
      metadata: {},
    };

    try {
      // Execute each task in sequence
      for (let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i];

        // Emit pending status
        this.emitProgress({
          taskId: task.id,
          taskName: task.name,
          status: "pending",
          progress: 0,
        });

        // Validate task if validator exists
        if (task.validate) {
          const validation = await task.validate(context);
          if (!validation.valid) {
            const error: ProcessBuilderError = {
              code: "VALIDATION_FAILED",
              message: `Task ${task.id} validation failed: ${validation.error}`,
              taskId: task.id,
            };

            this.emitProgress({
              taskId: task.id,
              taskName: task.name,
              status: "failed",
              progress: 0,
              error,
            });

            throw new Error(validation.error);
          }
        }

        // Call onStart hook
        if (task.onStart) {
          await task.onStart(context);
        }

        // Emit running status
        this.emitProgress({
          taskId: task.id,
          taskName: task.name,
          status: "running",
          progress: 0,
          startedAt: new Date(),
        });

        // Execute task (with retry if configured)
        let result: TaskResult;

        if (task.retryable && task.maxRetries) {
          result = await retryTask(
            () => task.execute(context),
            task.maxRetries,
            task.retryDelay || 1000,
          );
        } else {
          result = await this.executeWithTimeout(task, context);
        }

        this.results.push(result);

        // Update context with result
        context.previousResults.push(result);
        if (result.data) {
          context.metadata = { ...context.metadata, ...result.metadata };
        }

        // Call lifecycle hooks
        if (result.success && task.onSuccess) {
          await task.onSuccess(result, context);
        } else if (!result.success && task.onError) {
          await task.onError(
            new Error(result.errors?.[0]?.message || "Task failed"),
            context,
          );
        }

        if (task.onComplete) {
          await task.onComplete(result, context);
        }

        // Emit completed status
        this.emitProgress({
          taskId: task.id,
          taskName: task.name,
          status: result.success ? "completed" : "failed",
          progress: 100,
          completedAt: new Date(),
          error: result.errors?.[0],
        });

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
        taskProgress: this.progress,
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
        taskProgress: this.progress,
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

  private async executeWithTimeout(
    task: ProcessBuilderTask,
    context: TaskContext,
  ): Promise<TaskResult> {
    if (!task.timeout) {
      return await task.execute(context);
    }

    return Promise.race([
      task.execute(context),
      new Promise<TaskResult>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Task ${task.id} timed out after ${task.timeout}ms`),
            ),
          task.timeout,
        ),
      ),
    ]);
  }
}
```

---

## Schema Validation

**File:** `process-builders/core/validation.ts`

```typescript
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderMetadata,
} from "./types";

// Simple validation (can use Zod later if needed)
export function validateGoal(goal: unknown): ProcessBuilderGoal {
  if (!goal || typeof goal !== "object") {
    throw new Error("Goal must be an object");
  }

  const goalObj = goal as Record<string, unknown>;

  if (
    !goalObj.text ||
    typeof goalObj.text !== "string" ||
    goalObj.text.trim() === ""
  ) {
    throw new Error("Goal.text is required and must be a non-empty string");
  }

  return {
    text: goalObj.text as string,
    metadata: goalObj.metadata as Record<string, unknown> | undefined,
  };
}

export function validateRules(
  rules: unknown,
  processMetadata: ProcessBuilderMetadata,
): ProcessBuilderRules {
  if (!rules || typeof rules !== "object") {
    throw new Error("Rules must be an object");
  }

  const rulesObj = rules as Record<string, unknown>;
  const validatedRules: ProcessBuilderRules = {};

  // Validate each rule
  for (const [key, value] of Object.entries(rulesObj)) {
    if (value && typeof value === "object" && "value" in value) {
      validatedRules[key] = value as ProcessBuilderRule;
    } else {
      // Auto-wrap simple values
      validatedRules[key] = {
        key,
        value,
        type: inferType(value),
      };
    }
  }

  // Check required rules
  for (const requiredRule of processMetadata.requiredRules) {
    if (!validatedRules[requiredRule]) {
      throw new Error(`Missing required rule: ${requiredRule}`);
    }
  }

  return validatedRules;
}

function inferType(
  value: unknown,
): "string" | "number" | "boolean" | "array" | "object" {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  return "string"; // Default
}
```

---

## Testing Utilities

**File:** `process-builders/core/testing.ts`

```typescript
import type {
  ProcessBuilderTask,
  TaskContext,
  TaskResult,
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
} from "./types";

export class ProcessBuilderTestHarness {
  static createMockContext(overrides?: Partial<TaskContext>): TaskContext {
    return {
      goal: { text: "Test goal" },
      rules: {},
      options: {},
      previousResults: [],
      metadata: {},
      ...overrides,
    };
  }

  static async testTask(
    task: ProcessBuilderTask,
    context: TaskContext,
  ): Promise<TaskResult> {
    try {
      return await task.execute(context);
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: "TEST_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            taskId: task.id,
          },
        ],
      };
    }
  }

  static createMockTask(
    id: string,
    execute: (context: TaskContext) => Promise<TaskResult>,
  ): ProcessBuilderTask {
    return {
      id,
      name: `Mock Task ${id}`,
      description: "Mock task for testing",
      execute,
    };
  }
}
```

---

## Configuration File Support

**File:** `process-builders/build-trivia-set/config.json`

```json
{
  "id": "build-trivia-set",
  "name": "Build Trivia Set",
  "description": "Creates a curated trivia set from existing questions",
  "version": "1.0.0",
  "enabled": true,
  "tasks": [
    {
      "id": "query-questions",
      "timeout": 30000,
      "retryable": true,
      "maxRetries": 3,
      "retryDelay": 1000
    },
    {
      "id": "select-balance",
      "timeout": 10000,
      "retryable": false
    }
  ],
  "requiredRules": ["questionTypes", "questionCount"],
  "optionalRules": ["distributionStrategy", "theme", "cooldownDays"],
  "defaults": {
    "distributionStrategy": "weighted",
    "cooldownDays": 30,
    "allowPartialSets": false
  },
  "limits": {
    "maxQuestionCount": 100,
    "minQuestionCount": 1
  }
}
```

**Load configuration:**

```typescript
// process-builders/build-trivia-set/lib/build-trivia-set.ts
import config from "../config.json";
import type { ProcessBuilderMetadata } from "../../core/types";

export const metadata: ProcessBuilderMetadata = {
  id: config.id,
  name: config.name,
  description: config.description,
  version: config.version,
  tasks: config.tasks.map((t) => t.id),
  requiredRules: config.requiredRules,
  optionalRules: config.optionalRules,
  defaults: config.defaults,
  limits: config.limits,
};
```

---

## Progress Tracking Hook

**File:** `process-builders/shared/hooks/use-task-progress.ts`

```typescript
"use client";

import { useState, useCallback } from "react";
import type { TaskProgress } from "../../core/types";

export function useTaskProgress() {
  const [progress, setProgress] = useState<TaskProgress[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskProgress | null>(null);

  const onProgress = useCallback((update: TaskProgress) => {
    setProgress((prev) => {
      const existing = prev.findIndex((p) => p.taskId === update.taskId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = update;
        return updated;
      }
      return [...prev, update];
    });

    if (update.status === "running") {
      setCurrentTask(update);
    } else if (update.status === "completed" || update.status === "failed") {
      setCurrentTask(null);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress([]);
    setCurrentTask(null);
  }, []);

  return {
    progress,
    currentTask,
    onProgress,
    reset,
    isRunning: progress.some((p) => p.status === "running"),
    completedCount: progress.filter((p) => p.status === "completed").length,
    failedCount: progress.filter((p) => p.status === "failed").length,
  };
}
```

---

## Summary: What to Implement Now

### Phase 1: Essential (Implement Now)

1. ✅ **Progress Tracking** - Critical for UX
2. ✅ **Schema Validation** - Prevents errors
3. ✅ **Testing Utilities** - Enables testing
4. ✅ **Lifecycle Hooks** - Useful for logging/cleanup

### Phase 2: Soon (Next Sprint)

5. ✅ **Configuration Files** - Easier maintenance
6. ✅ **Basic Monitoring** - Track executions
7. ✅ **Retry Logic** - Handle transient failures

### Phase 3: Later (When Needed)

8. ⏳ **Dependency Management** - Only if process builders depend on each other
9. ⏳ **Execution Scheduling** - Nice feature, not critical
10. ⏳ **Advanced Versioning** - Start simple, enhance later

---

## Benefits of Enhanced Architecture

### ✅ **Better UX**

- Progress tracking shows users what's happening
- Real-time feedback improves perceived performance

### ✅ **Better Reliability**

- Retry logic handles transient failures
- Timeouts prevent hanging tasks
- Validation catches errors early

### ✅ **Better Maintainability**

- Testing utilities enable comprehensive tests
- Configuration files reduce code changes
- Lifecycle hooks enable logging/monitoring

### ✅ **Better Developer Experience**

- Clear patterns to follow
- Reusable utilities
- Type safety throughout

---

## Conclusion

**Yes, these enhancements significantly improve the architecture!**

The key improvements:

1. **Progress tracking** - Essential for user experience
2. **Schema validation** - Prevents runtime errors
3. **Testing utilities** - Enables quality assurance
4. **Lifecycle hooks** - Enables observability
5. **Configuration files** - Reduces code changes

**Recommendation:** Implement Phase 1 enhancements now, add Phase 2 soon, defer Phase 3 until actually needed.

This creates a production-ready, scalable architecture that will serve well for years.
