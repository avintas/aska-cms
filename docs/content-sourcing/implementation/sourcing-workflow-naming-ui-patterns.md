# Sourcing Workflow - Naming, UI & Patterns

## 1. Naming Conventions

### Directory & File Names

**Process Builder Structure:**

```
process-builders/
└── ingest-source-content/          # kebab-case, descriptive
    ├── lib/
    │   ├── actions.ts              # lowercase, plural
    │   ├── ingest-source-content.ts # kebab-case matches directory
    │   └── tasks/
    │       ├── validate-input.ts   # kebab-case, verb-noun
    │       ├── process-content.ts
    │       ├── extract-metadata.ts
    │       ├── enrich-content.ts
    │       ├── validate-completeness.ts
    │       └── create-record.ts
    └── config.json                 # lowercase
```

**Page Routes:**

```
app/cms/process-builders/
└── ingest-source-content/
    └── page.tsx                    # Next.js App Router convention
```

**Naming Rules:**

- **Directories**: `kebab-case` (e.g., `ingest-source-content`)
- **Files**: `kebab-case.ts` or `kebab-case.tsx`
- **Config files**: `config.json` (lowercase)
- **Type files**: `types/index.ts` or `types.ts`

### Function Names

**Server Actions:**

```typescript
// Pattern: [processName]Action
export async function ingestSourceContentAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
);
```

**Main Process Function:**

```typescript
// Pattern: [processName] (camelCase, matches directory name)
export async function ingestSourceContent(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult>;
```

**Task Functions:**

```typescript
// Pattern: [taskName]Task (camelCase + "Task" suffix)
export const validateInputTask: ProcessBuilderTask = {
  id: "validate-input", // kebab-case
  name: "Validate Input", // Title Case
  description: "...",
  async execute(context: TaskContext): Promise<TaskResult> {
    // Implementation
  },
};
```

**Helper Functions:**

```typescript
// Pattern: camelCase, descriptive verb-noun
function validateContentLength(content: string): boolean;
function extractMetadataFromContent(content: string): Metadata;
function normalizeText(text: string): string;
```

### Variable Names

**State Variables:**

```typescript
// Pattern: camelCase, descriptive
const [content, setContent] = useState<string>("");
const [isProcessing, setIsProcessing] = useState(false);
const [result, setResult] = useState<ProcessBuilderResult | null>(null);
const [error, setError] = useState<string | null>(null);
```

**Task Context:**

```typescript
// Pattern: camelCase, follows ProcessBuilderTask interface
const context: TaskContext = {
  goal,
  rules,
  options,
  previousResults,
  metadata,
};
```

**Task Results:**

```typescript
// Pattern: camelCase + "Result" suffix
const validationResult: TaskResult = { ... };
const metadataResult: TaskResult = { ... };
```

### Database Names

**Table Names:**

```sql
-- Pattern: snake_case, descriptive
content_source                    -- existing table
ai_extraction_prompts            -- new table
```

**Column Names:**

```sql
-- Pattern: snake_case
theme TEXT
tags TEXT[]
category TEXT
summary TEXT
title TEXT
key_phrases TEXT[]
metadata JSONB
ingestion_process_id TEXT
ingestion_status TEXT

-- For ai_extraction_prompts table:
prompt_name TEXT
prompt_type TEXT
prompt_content TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
created_by UUID
```

**Type Names:**

```typescript
// Pattern: PascalCase, descriptive
interface IngestSourceContentMetadata {
  theme: string;
  tags: string[];
  category: string;
  summary: string;
  title: string;
  keyPhrases: string[]; // camelCase in TypeScript
}

interface AIExtractionPrompt {
  id: number;
  promptName: string;
  promptType: "metadata_extraction" | "content_enrichment";
  promptContent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}
```

### Component Names

**Page Components:**

```typescript
// Pattern: PascalCase, descriptive + "Page" suffix
export default function IngestSourceContentPage() {
  // Implementation
}
```

**UI Components:**

```typescript
// Pattern: PascalCase, descriptive
export function MetadataEditor({ metadata, onChange }: MetadataEditorProps) {
  // Implementation
}

export function WorkflowProgress({ progress }: WorkflowProgressProps) {
  // Implementation
}
```

### Constants

**Process IDs:**

```typescript
// Pattern: kebab-case, matches directory name
const PROCESS_ID = "ingest-source-content";
const PROCESS_NAME = "Ingest Source Content";
```

**Task IDs:**

```typescript
// Pattern: kebab-case, matches file name
const TASK_IDS = {
  VALIDATE_INPUT: "validate-input",
  PROCESS_CONTENT: "process-content",
  EXTRACT_METADATA: "extract-metadata",
  ENRICH_CONTENT: "enrich-content",
  VALIDATE_COMPLETENESS: "validate-completeness",
  CREATE_RECORD: "create-record",
} as const;
```

## 2. UI Design

### Page Structure

**Route:** `/cms/process-builders/ingest-source-content`

**Layout Pattern (Following build-trivia-set):**

```tsx
"use client";

import { useState } from "react";
import { ingestSourceContentAction } from "@/process-builders/ingest-source-content/lib/actions";
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
} from "@/process-builders/core/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heading } from "@/components/ui/heading";
import { Alert } from "@/components/ui/alert";
import type { ProcessBuilderResult } from "@/process-builders/core/types";

export default function IngestSourceContentPage() {
  // State management
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessBuilderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    // Implementation
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Heading level={1}>Ingest Source Content</Heading>
      <p className="text-gray-600">
        Process and enrich source content with AI-powered metadata extraction.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Input */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Source Content *
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type your source content here..."
            rows={12}
            required
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !content.trim()}
          >
            {loading ? "Processing..." : "Ingest Content"}
          </Button>
        </div>
      </form>

      {/* Error Display */}
      {error && <Alert type="error" message={error} />}

      {/* Result Display */}
      {result && <WorkflowResultDisplay result={result} />}
    </div>
  );
}
```

### UI Components

**1. Content Input Section**

```tsx
<div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Source Content</h3>
    <Button variant="ghost" onClick={handlePaste}>
      <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
      Paste from Clipboard
    </Button>
  </div>
  <Textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="Paste or type your source content here..."
    className="min-h-[300px] font-mono text-sm"
    disabled={loading}
  />
</div>
```

**2. Workflow Progress Display**

```tsx
{
  loading && (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Processing...
      </h3>
      <div className="space-y-3">
        {taskProgress.map((progress, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                progress.status === "completed"
                  ? "bg-green-500"
                  : progress.status === "running"
                    ? "bg-indigo-500 animate-pulse"
                    : "bg-gray-300"
              }`}
            >
              {progress.status === "completed" && "✓"}
              {progress.status === "running" && "⟳"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {progress.taskName}
              </p>
              {progress.message && (
                <p className="text-xs text-gray-500">{progress.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**3. Manual Editing Interface (Post-Processing)**

```tsx
{
  result && result.status === "success" && (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Review & Edit Metadata
      </h3>

      <div className="space-y-4">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme *
          </label>
          <Input
            value={editedMetadata.theme}
            onChange={(e) =>
              setEditedMetadata({ ...editedMetadata, theme: e.target.value })
            }
            placeholder="Enter theme..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editedMetadata.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(idx)}
                  className="hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Input
            value={editedMetadata.category || ""}
            onChange={(e) =>
              setEditedMetadata({ ...editedMetadata, category: e.target.value })
            }
            placeholder="Enter category..."
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <Input
            value={editedMetadata.title || ""}
            onChange={(e) =>
              setEditedMetadata({ ...editedMetadata, title: e.target.value })
            }
            placeholder="Enter title..."
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary
          </label>
          <Textarea
            value={editedMetadata.summary || ""}
            onChange={(e) =>
              setEditedMetadata({ ...editedMetadata, summary: e.target.value })
            }
            placeholder="Enter summary..."
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button variant="primary" onClick={handleSave}>
            Save Content
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**4. Execution Summary Display**

```tsx
{
  result && (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Execution Summary
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium text-gray-900">
              {result.status.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Execution Time</p>
            <p className="font-medium text-gray-900">
              {result.executionTime}ms
            </p>
          </div>
        </div>

        {/* Task Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Task Execution Log</h4>
          <div className="space-y-3">
            {result.results.map((taskResult, idx) => {
              const taskProgress = result.taskProgress[idx];
              const isSuccess = taskResult.success;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    isSuccess
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {isSuccess ? "✓" : "✗"} Task {idx + 1}:{" "}
                        {taskProgress?.taskName}
                      </p>
                      {taskResult.errors && taskResult.errors.length > 0 && (
                        <div className="mt-2">
                          {taskResult.errors.map((err, errIdx) => (
                            <p key={errIdx} className="text-sm text-red-600">
                              {err.code}: {err.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### UI Patterns

**Color Scheme:**

- Primary: `indigo-600` (buttons, links)
- Success: `green-50/500/600` (success states)
- Error: `red-50/500/600` (error states)
- Warning: `yellow-50/500/600` (warnings)
- Neutral: `gray-50/100/200/300/500/700/900` (borders, text)

**Spacing:**

- Container: `max-w-4xl mx-auto p-6`
- Section spacing: `space-y-6`
- Form spacing: `space-y-4`
- Button groups: `flex gap-4`

**Typography:**

- Headings: Use `<Heading>` component with appropriate level
- Body: `text-sm` or `text-base`
- Labels: `text-sm font-medium text-gray-700`
- Help text: `text-xs text-gray-500`

## 3. Patterns

### Process Builder Pattern

**Main Process Function (`lib/ingest-source-content.ts`):**

```typescript
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderResult,
} from "../../core/types";
import { ProcessBuilderExecutor } from "../../core/executor";
import { validateInputTask } from "./tasks/validate-input";
import { processContentTask } from "./tasks/process-content";
import { extractMetadataTask } from "./tasks/extract-metadata";
import { enrichContentTask } from "./tasks/enrich-content";
import { validateCompletenessTask } from "./tasks/validate-completeness";
import { createRecordTask } from "./tasks/create-record";

/**
 * Ingest Source Content - Main function
 * Processes and enriches source content with AI-powered metadata extraction
 */
export async function ingestSourceContent(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult> {
  // Create executor with tasks
  const executor = new ProcessBuilderExecutor(
    [
      validateInputTask,
      processContentTask,
      extractMetadataTask,
      enrichContentTask,
      validateCompletenessTask,
      createRecordTask,
    ],
    options?.onProgress,
  );

  // Execute process
  const result = await executor.execute(goal, rules, options);

  // Add process-specific metadata
  return {
    ...result,
    processId: "ingest-source-content",
    processName: "Ingest Source Content",
  };
}
```

**Server Action (`lib/actions.ts`):**

```typescript
"use server";

import { ingestSourceContent } from "./ingest-source-content";
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
} from "../../core/types";

/**
 * Server Action for ingesting source content
 * Called from client components
 */
export async function ingestSourceContentAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
) {
  return await ingestSourceContent(goal, rules, options);
}
```

### Task Pattern

**Standard Task Structure:**

```typescript
import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';

/**
 * Task [N]: [Task Name]
 * [Brief description of what this task does]
 */
export const [taskName]Task: ProcessBuilderTask = {
  id: '[task-id]',                    // kebab-case, matches file name
  name: '[Task Name]',                 // Title Case, human-readable
  description: '[Detailed description]',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // 1. Validate context/preconditions
      if (!context.previousResults || context.previousResults.length < N) {
        return {
          success: false,
          errors: [{
            code: 'MISSING_PREVIOUS_RESULTS',
            message: 'Missing results from previous tasks',
            taskId: '[task-id]'
          }]
        };
      }

      // 2. Extract data from previous results
      const previousResult = context.previousResults[N];
      if (!previousResult?.data) {
        return {
          success: false,
          errors: [{
            code: 'NO_DATA',
            message: 'No data from previous task',
            taskId: '[task-id]'
          }]
        };
      }

      // 3. Perform task logic
      const result = await performTaskLogic(previousResult.data);

      // 4. Return success result
      return {
        success: true,
        data: result,
        metadata: {
          // Task-specific metadata
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'TASK_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          taskId: '[task-id]'
        }]
      };
    }
  }
};
```

**Example: Extract Metadata Task**

```typescript
import type {
  ProcessBuilderTask,
  TaskContext,
  TaskResult,
} from "../../../core/types";
import { getAIExtractionPrompt } from "../helpers/prompt-helpers";
import { callGeminiAPI } from "../helpers/ai-helpers";

/**
 * Task 3: Extract Metadata
 * Uses AI to extract theme, tags, category, and summary from content
 */
export const extractMetadataTask: ProcessBuilderTask = {
  id: "extract-metadata",
  name: "Extract Metadata",
  description:
    "Uses AI to extract theme, tags, category, and summary from content",

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // Get processed content from previous task
      const processResult = context.previousResults[1];
      if (!processResult?.data || typeof processResult.data !== "string") {
        return {
          success: false,
          errors: [
            {
              code: "NO_PROCESSED_CONTENT",
              message: "No processed content from previous task",
              taskId: "extract-metadata",
            },
          ],
        };
      }

      const processedContent = processResult.data as string;

      // Get AI prompt from database
      const prompt = await getAIExtractionPrompt("metadata_extraction");
      if (!prompt) {
        return {
          success: false,
          errors: [
            {
              code: "NO_PROMPT",
              message: "No active metadata extraction prompt found",
              taskId: "extract-metadata",
            },
          ],
        };
      }

      // Call AI API
      const metadata = await callGeminiAPI(
        prompt.promptContent,
        processedContent,
      );

      // Parse and validate metadata
      const parsedMetadata = parseMetadataResponse(metadata);

      return {
        success: true,
        data: parsedMetadata,
        metadata: {
          promptId: prompt.id,
          promptName: prompt.promptName,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: "EXTRACTION_FAILED",
            message: error instanceof Error ? error.message : "Unknown error",
            taskId: "extract-metadata",
          },
        ],
      };
    }
  },
};
```

### Error Handling Pattern

**Error Structure:**

```typescript
interface ProcessBuilderError {
  code: string; // UPPER_SNAKE_CASE, specific error code
  message: string; // Human-readable message
  taskId?: string; // Which task failed
  details?: unknown; // Additional error details
  retryable?: boolean; // Can this be retried?
}
```

**Error Codes:**

```typescript
// Validation errors
"MISSING_PREVIOUS_RESULTS";
"NO_DATA";
"INVALID_INPUT";
"VALIDATION_FAILED";

// Processing errors
"PROCESSING_FAILED";
"EXTRACTION_FAILED";
"ENRICHMENT_FAILED";

// Database errors
"DATABASE_ERROR";
"NO_RECORD_CREATED";

// AI errors
"AI_API_ERROR";
"NO_PROMPT";
"PROMPT_INVALID";
```

### Type Definitions Pattern

**Process-Specific Types (`lib/types/index.ts`):**

```typescript
/**
 * Types specific to ingest-source-content process
 * Keep generic types in core/types.ts
 */

export interface SourceContentMetadata {
  theme: string;
  tags: string[];
  category: string | null;
  summary: string | null;
  title: string | null;
  keyPhrases: string[];
}

export interface ProcessedContent {
  originalContent: string;
  processedContent: string;
  wordCount: number;
  charCount: number;
}

export interface EnrichedContent extends ProcessedContent {
  metadata: SourceContentMetadata;
  readingTime: number;
}
```

### Helper Functions Pattern

**Helper Structure (`lib/helpers/`):**

```typescript
// lib/helpers/prompt-helpers.ts
export async function getAIExtractionPrompt(
  type: "metadata_extraction" | "content_enrichment",
): Promise<AIExtractionPrompt | null> {
  // Implementation
}

// lib/helpers/ai-helpers.ts
export async function callGeminiAPI(
  prompt: string,
  content: string,
): Promise<string> {
  // Implementation
}

// lib/helpers/validation-helpers.ts
export function validateContentLength(content: string): boolean {
  // Implementation
}

export function validateMetadata(metadata: SourceContentMetadata): boolean {
  // Implementation
}
```

### Configuration Pattern

**Config File (`config.json`):**

```json
{
  "processId": "ingest-source-content",
  "processName": "Ingest Source Content",
  "version": "1.0.0",
  "tasks": [
    {
      "id": "validate-input",
      "name": "Validate Input",
      "order": 1
    },
    {
      "id": "process-content",
      "name": "Process Content",
      "order": 2
    },
    {
      "id": "extract-metadata",
      "name": "Extract Metadata",
      "order": 3
    },
    {
      "id": "enrich-content",
      "name": "Enrich Content",
      "order": 4
    },
    {
      "id": "validate-completeness",
      "name": "Validate Completeness",
      "order": 5
    },
    {
      "id": "create-record",
      "name": "Create Record",
      "order": 6
    }
  ],
  "settings": {
    "minContentLength": 10,
    "maxContentLength": 100000,
    "requireTheme": true,
    "requireTags": false
  }
}
```

## Summary

### Naming Checklist

- ✅ Directories: `kebab-case`
- ✅ Files: `kebab-case.ts` or `kebab-case.tsx`
- ✅ Functions: `camelCase`
- ✅ Components: `PascalCase`
- ✅ Types/Interfaces: `PascalCase`
- ✅ Constants: `UPPER_SNAKE_CASE` or `camelCase`
- ✅ Database: `snake_case`

### UI Checklist

- ✅ Use existing UI components (`Button`, `Input`, `Textarea`, `Heading`, `Alert`)
- ✅ Follow Tailwind color scheme (indigo primary, gray neutrals)
- ✅ Consistent spacing (`space-y-6`, `gap-4`)
- ✅ Responsive design (`max-w-4xl mx-auto`)
- ✅ Loading states and error handling
- ✅ Execution summary display

### Pattern Checklist

- ✅ Follow process builder structure (executor pattern)
- ✅ Use server actions for client-server communication
- ✅ Standard task structure with error handling
- ✅ Type definitions in separate file
- ✅ Helper functions organized by concern
- ✅ Configuration file for process metadata
