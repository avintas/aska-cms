# Process Builder System - Implementation Plan

**Date Created:** January 2025  
**Status:** Ready to Begin  
**Estimated Total Time:** 25-35 hours (3.5-5 days)

---

## Overview

This plan follows the documented architecture patterns to build a scalable, isolated process builder system. The system will support multiple process builders with auto-discovery, task-based execution, and complete isolation from CMS code.

---

## Architecture Principles

1. **Isolation** - Each process builder is self-contained, can be deleted safely
2. **Auto-Discovery** - Build script discovers builders automatically (no manual registration)
3. **Task-Based** - Composable tasks for flexibility
4. **Server Actions** - Use Server Actions (not API routes) for CMS integration
5. **Type Safety** - Full TypeScript throughout

---

## Phase 1: Core Infrastructure (8-10 hours)

### Step 1.1: Create Folder Structure (30 min)

**Tasks:**

- Create `apps/cms/src/lib/process-builders/` directory
- Create subdirectories:
  - `core/` - Shared infrastructure
  - `shared/` - Shared utilities (only if used by 3+ builders)
  - `build-trivia-set/` - First process builder

**Structure:**

```
apps/cms/src/lib/process-builders/
├── core/
│   ├── types.ts
│   ├── registry.ts
│   ├── executor.ts
│   ├── validation.ts
│   └── errors.ts
├── shared/
│   └── README.md (documentation on when to add here)
└── build-trivia-set/
    └── (will be created in Phase 2)
```

**Files to Create:**

- `apps/cms/src/lib/process-builders/core/types.ts`
- `apps/cms/src/lib/process-builders/core/registry.ts`
- `apps/cms/src/lib/process-builders/core/executor.ts`
- `apps/cms/src/lib/process-builders/core/validation.ts`
- `apps/cms/src/lib/process-builders/core/errors.ts`
- `apps/cms/src/lib/process-builders/shared/README.md`

---

### Step 1.2: Define Core Types (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/core/types.ts`

**Types to Define:**

```typescript
// Base interfaces that ALL process builders implement
export interface ProcessBuilderGoal {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessBuilderRule {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
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
  status: 'success' | 'error' | 'partial';
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
  defaults?: Record<string, unknown>;
  limits?: Record<string, { min?: number; max?: number }>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: unknown;
}
```

**Checklist:**

- [ ] All types defined
- [ ] TypeScript strict mode compliant
- [ ] Exported properly
- [ ] Documented with JSDoc comments

---

### Step 1.3: Build Auto-Discovery Registry (2-3 hours)

**Part A: Build Script (1-1.5 hours)**

**File:** `scripts/discover-process-builders.ts`

**Functionality:**

- Scan `apps/cms/src/lib/process-builders/` directory
- Find all folders (except `core` and `shared`)
- Check each folder for `lib/index.ts`
- Dynamically import module to extract `metadata` export
- Generate `process-builders-registry.json` file

**Implementation Notes:**

- Use Node.js `fs` and `path` modules
- Handle errors gracefully (warn, don't fail)
- Output progress to console
- Generate JSON with proper formatting

**Add to `package.json`:**

```json
{
  "scripts": {
    "discover-builders": "tsx scripts/discover-process-builders.ts",
    "build": "npm run discover-builders && next build"
  }
}
```

**Part B: Runtime Registry (1-1.5 hours)**

**File:** `apps/cms/src/lib/process-builders/core/registry.ts`

**Functions to Implement:**

- `discoverProcessBuilders()` - Load from generated JSON
- `getProcessBuilder(id)` - Get specific builder by ID
- `getAllProcessBuilders()` - Get all builders
- `registerProcessBuilder(metadata)` - Runtime registration (optional)

**Implementation Notes:**

- Cache discovered builders (singleton pattern)
- Load from generated JSON file
- Handle missing registry gracefully
- Return typed results

**Checklist:**

- [ ] Build script scans directories correctly
- [ ] Extracts metadata from modules
- [ ] Generates JSON registry file
- [ ] Runtime registry loads from JSON
- [ ] Caching works correctly
- [ ] Error handling is robust

---

### Step 1.4: Create Task Executor Engine (2-3 hours)

**File:** `apps/cms/src/lib/process-builders/core/executor.ts`

**Class to Implement:** `ProcessBuilderExecutor`

**Key Methods:**

- `constructor(tasks: ProcessBuilderTask[])` - Initialize with tasks
- `execute(goal, rules, options)` - Main execution method

**Execution Flow:**

1. Initialize context with goal, rules, options
2. For each task:
   - Validate task (if validator exists)
   - Execute task
   - Store result
   - Update context with result data
   - Stop on error (unless partial results allowed)
3. Determine final status (success/error/partial)
4. Return ProcessBuilderResult

**Error Handling:**

- Catch task execution errors
- Collect all errors from tasks
- Return structured error information
- Track execution time

**Checklist:**

- [ ] Executor runs tasks in sequence
- [ ] Context passed correctly between tasks
- [ ] Error handling works
- [ ] Partial results option works
- [ ] Execution time tracked
- [ ] Status determination logic correct

---

### Step 1.5: Add Validation Utilities (1 hour)

**File:** `apps/cms/src/lib/process-builders/core/validation.ts`

**Functions to Implement:**

- `validateRules(metadata, rules)` - Validate rules against metadata
- `validateRequiredRules(metadata, rules)` - Check required rules present
- `validateRuleTypes(metadata, rules)` - Check rule types match
- `validateLimits(metadata, rules)` - Check numeric limits

**Checklist:**

- [ ] Required rules validation
- [ ] Optional rules validation
- [ ] Type checking
- [ ] Limit checking (min/max)
- [ ] Clear error messages

---

### Step 1.6: Error Handling (30 min)

**File:** `apps/cms/src/lib/process-builders/core/errors.ts`

**Functions to Implement:**

- `createError(code, message, taskId?, details?)` - Create ProcessBuilderError
- `createValidationError(message, details?)` - Create validation error
- Common error codes (constants)

**Checklist:**

- [ ] Error creation helpers
- [ ] Common error codes defined
- [ ] Error formatting for display

---

## Phase 2: First Process Builder - Build Trivia Set (10-14 hours)

### Step 2.1: Create Builder Structure (1 hour)

**Folder Structure:**

```
apps/cms/src/lib/process-builders/build-trivia-set/
├── lib/
│   ├── index.ts              # Public API + Metadata export
│   ├── build-trivia-set.ts   # Main function
│   ├── actions.ts            # Server actions
│   ├── tasks/
│   │   ├── query-questions.ts
│   │   ├── select-balance.ts
│   │   ├── generate-metadata.ts
│   │   ├── assemble-data.ts
│   │   ├── create-record.ts
│   │   └── validate-finalize.ts
│   ├── types/
│   │   ├── trivia-set.ts
│   │   ├── question-selection.ts
│   │   └── metadata.ts
│   └── helpers/
│       ├── theme-matching.ts
│       └── relevance-scoring.ts
└── components/
    ├── trivia-set-form.tsx
    └── trivia-set-preview.tsx
```

**Files to Create:**

- All structure files (empty initially)
- `lib/index.ts` with metadata export

**Metadata Export:**

```typescript
export const metadata: ProcessBuilderMetadata = {
  id: 'build-trivia-set',
  name: 'Build Trivia Set',
  description: 'Creates a curated trivia set from existing questions',
  version: '1.0.0',
  tasks: [
    'query-questions',
    'select-balance',
    'generate-metadata',
    'assemble-data',
    'create-record',
    'validate-finalize',
  ],
  requiredRules: ['questionTypes', 'questionCount'],
  optionalRules: ['distributionStrategy', 'theme', 'cooldownDays'],
  defaults: {
    distributionStrategy: 'weighted',
    cooldownDays: 30,
  },
  limits: {
    questionCount: { min: 1, max: 100 },
  },
};
```

**Checklist:**

- [ ] Folder structure created
- [ ] Metadata exported correctly
- [ ] Types folder structure ready

---

### Step 2.2: Define Builder-Specific Types (1 hour)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/types/trivia-set.ts`

**Types to Define:**

- `TriviaSet` - Database record structure
- `TriviaQuestionData` - Question data format
- `QuestionSelectionResult` - Selection result structure
- `TriviaSetMetadata` - Generated metadata

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/types/question-selection.ts`

**Types to Define:**

- `DistributionStrategy` - "even" | "weighted" | "custom"
- `QuestionSelection` - Selection criteria
- `BalanceResult` - Balance calculation result

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/types/metadata.ts`

**Types to Define:**

- `GeneratedMetadata` - All generated metadata fields

**Checklist:**

- [ ] All types match database schema
- [ ] Types exported properly
- [ ] TypeScript strict mode compliant

---

### Step 2.3: Implement Task 1 - Query Source Questions (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/tasks/query-questions.ts`

**Functionality:**

- Extract theme from goal
- Extract question types from rules
- Query `trivia_multiple_choice` table (if TMC selected)
- Query `trivia_true_false` table (if TFT selected)
- Query `trivia_who_am_i` table (if WAI selected)
- Filter by theme (keyword matching)
- Filter by status = "published"
- Return candidates array

**Implementation Notes:**

- Use `supabaseAdmin` from `@/utils/supabase`
- Handle empty results gracefully
- Return structured TaskResult

**Checklist:**

- [ ] Queries all selected question types
- [ ] Theme matching works
- [ ] Status filtering works
- [ ] Returns proper TaskResult format
- [ ] Error handling implemented

---

### Step 2.4: Implement Task 2 - Select & Balance (2-3 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/tasks/select-balance.ts`

**Functionality:**

- Get candidates from Task 1 result
- Get question count from rules
- Determine distribution strategy (even, weighted, custom)
- Calculate split between question types
- Select questions with diversity (avoid duplicates)
- Balance difficulty levels
- Shuffle final selection
- Return selected questions

**Distribution Strategies:**

- **Even:** Equal split (50/50 if 2 types)
- **Weighted:** Based on availability
- **Custom:** Use custom distribution from rules

**Implementation Notes:**

- Handle insufficient questions (warn or error)
- Implement diversity selection
- Shuffle for randomness

**Checklist:**

- [ ] Distribution strategies work
- [ ] Question selection is diverse
- [ ] Difficulty balancing works
- [ ] Handles edge cases (insufficient questions)
- [ ] Returns proper TaskResult format

---

### Step 2.5: Implement Task 3 - Generate Metadata (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/tasks/generate-metadata.ts`

**Functionality:**

- Generate title from theme ("Theme Trivia")
- Generate slug (URL-friendly)
- Generate description
- Determine category
- Extract tags from questions
- Calculate average difficulty
- Extract sub-themes
- Estimate duration

**Implementation Notes:**

- Use text processing utilities
- Slug generation (lowercase, hyphens)
- Tag extraction from question tags
- Difficulty calculation (average of selected questions)

**Checklist:**

- [ ] Title generation works
- [ ] Slug generation is URL-safe
- [ ] Description generation works
- [ ] Category determination works
- [ ] Tag extraction works
- [ ] Difficulty calculation works

---

### Step 2.6: Implement Task 4 - Assemble Question Data (1 hour)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/tasks/assemble-data.ts`

**Functionality:**

- Transform selected questions to `TriviaQuestionData` format
- Add metadata (question_id, source_id, points, time_limit)
- Shuffle answer options for multiple choice
- Shuffle question order
- Return assembled data array

**Implementation Notes:**

- Map database records to TriviaQuestionData format
- Shuffle wrong_answers array for multiple choice
- Add scoring metadata

**Checklist:**

- [ ] Data transformation correct
- [ ] Answer shuffling works
- [ ] Question shuffling works
- [ ] Metadata added correctly
- [ ] Returns proper format

---

### Step 2.7: Implement Task 5 - Create Record (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/tasks/create-record.ts`

**Functionality:**

- Get metadata from Task 3
- Get question data from Task 4
- Get question count from rules
- Build trivia set record
- Insert into `trivia_sets` table
- Set status to "draft"
- Set visibility to "Private"
- Return created record with ID

**Implementation Notes:**

- Use `supabaseAdmin` for database insert
- Handle database errors
- Return created record

**Checklist:**

- [ ] Record structure matches schema
- [ ] Database insert works
- [ ] Status set correctly
- [ ] Visibility set correctly
- [ ] Returns created record
- [ ] Error handling works

---

### Step 2.8: Implement Task 6 - Validate & Finalize (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/tasks/validate-finalize.ts`

**Functionality:**

- Validate question count matches rules
- Validate required fields present
- Validate question structure
- Type-specific validation (TMC, TFT, WAI)
- Duplicate detection
- Return validation result

**Validation Checks:**

- Question count = expected count
- All questions have required fields
- Multiple choice has 3 wrong answers
- True/False has boolean answer
- Who Am I has clues
- No duplicate questions

**Checklist:**

- [ ] Question count validation
- [ ] Required fields validation
- [ ] Type-specific validation
- [ ] Duplicate detection
- [ ] Returns validation result
- [ ] Clear error messages

---

### Step 2.9: Create Main Function & Server Actions (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/build-trivia-set.ts`

**Functionality:**

- Import all tasks
- Create ProcessBuilderExecutor with tasks
- Execute process
- Add process-specific metadata to result
- Return ProcessBuilderResult

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/lib/actions.ts`

**Functionality:**

- Mark as "use server"
- Export `buildTriviaSetAction` function
- Call main `buildTriviaSet` function
- Return result

**Checklist:**

- [ ] Main function orchestrates all tasks
- [ ] Server action marked correctly
- [ ] Type safety maintained
- [ ] Error handling works
- [ ] Returns proper result format

---

## Phase 3: UI Components (3-4 hours)

### Step 3.1: Create Generic Process Builder Form (2 hours)

**File:** `apps/cms/src/lib/process-builders/shared/components/process-builder-form.tsx`

**Functionality:**

- Accept processId prop
- Load process metadata from registry
- Render form based on required/optional rules
- Handle form submission
- Show progress indicator
- Display results/errors

**Features:**

- Dynamic form generation from metadata
- Rule input fields (text, number, select, checkbox)
- Validation
- Loading states
- Error display

**Checklist:**

- [ ] Loads metadata from registry
- [ ] Dynamic form generation
- [ ] All input types supported
- [ ] Validation works
- [ ] Progress indicator works
- [ ] Results display works

---

### Step 3.2: Create Build-Trivia-Set Specific Form (1-2 hours)

**File:** `apps/cms/src/lib/process-builders/build-trivia-set/components/trivia-set-form.tsx`

**Functionality:**

- Specialized form for trivia set creation
- Theme input
- Question type checkboxes (TMC, TFT, WAI)
- Question count input
- Distribution strategy selector
- Cooldown days input
- Allow partial sets checkbox
- Call `buildTriviaSetAction`
- Display results

**Checklist:**

- [ ] All form fields present
- [ ] Validation works
- [ ] Calls server action correctly
- [ ] Displays results
- [ ] Error handling works
- [ ] Loading states work

---

### Step 3.3: Create CMS Page Integration (1 hour)

**File:** `apps/cms/src/app/process-builders/build-trivia-set/page.tsx`

**Functionality:**

- Server component page
- Import and render TriviaSetForm
- Add to CMS navigation

**Navigation Update:**

- Add to `apps/cms/src/components/layout/HeaderWrapper.tsx`
- Add "Process Builders" section
- Link to `/process-builders/build-trivia-set`

**Checklist:**

- [ ] Page created
- [ ] Form component imported
- [ ] Navigation link added
- [ ] Page accessible
- [ ] Metadata (title, description) set

---

## Phase 4: Testing & Polish (2-3 hours)

### Step 4.1: Unit Tests for Core (1 hour)

**Files to Test:**

- `core/registry.ts` - Discovery, loading
- `core/executor.ts` - Task execution
- `core/validation.ts` - Rule validation

**Test Cases:**

- Registry discovers builders correctly
- Executor runs tasks in sequence
- Context passed correctly
- Validation catches errors
- Error handling works

**Checklist:**

- [ ] Registry tests written
- [ ] Executor tests written
- [ ] Validation tests written
- [ ] All tests pass

---

### Step 4.2: Unit Tests for Build-Trivia-Set (1 hour)

**Files to Test:**

- All 6 tasks
- Main function
- Helpers

**Test Cases:**

- Each task works independently
- Task integration works
- Edge cases handled
- Error cases handled

**Checklist:**

- [ ] Task tests written
- [ ] Integration tests written
- [ ] Edge case tests written
- [ ] All tests pass

---

### Step 4.3: End-to-End Testing (1 hour)

**Test Scenarios:**

1. Create trivia set with exact theme match
2. Create trivia set with no matches (test fallback)
3. Create trivia set with insufficient questions (test partial)
4. Create trivia set with all TMC questions
5. Create trivia set with mixed types
6. Validate error handling for invalid inputs

**Checklist:**

- [ ] All scenarios tested
- [ ] Database records created correctly
- [ ] UI displays results correctly
- [ ] Error messages are clear
- [ ] Performance acceptable

---

## Phase 5: Documentation (1 hour)

### Step 5.1: Create README Files

**Files to Create:**

- `apps/cms/src/lib/process-builders/README.md` - Architecture overview
- `apps/cms/src/lib/process-builders/build-trivia-set/README.md` - Builder documentation
- `apps/cms/src/lib/process-builders/shared/README.md` - Shared utilities guidelines

**Content:**

- Architecture explanation
- How to add new process builder
- How to use existing builders
- Examples
- Troubleshooting

**Checklist:**

- [ ] Architecture README complete
- [ ] Builder README complete
- [ ] Shared README complete
- [ ] Examples included

---

## Implementation Checklist Summary

### Phase 1: Core Infrastructure

- [ ] Folder structure created
- [ ] Core types defined
- [ ] Auto-discovery registry built
- [ ] Task executor created
- [ ] Validation utilities added
- [ ] Error handling implemented

### Phase 2: First Process Builder

- [ ] Builder structure created
- [ ] Builder-specific types defined
- [ ] All 6 tasks implemented
- [ ] Main function created
- [ ] Server actions created

### Phase 3: UI Components

- [ ] Generic form component created
- [ ] Builder-specific form created
- [ ] CMS page integration complete
- [ ] Navigation updated

### Phase 4: Testing

- [ ] Core unit tests written
- [ ] Builder unit tests written
- [ ] End-to-end tests complete
- [ ] All tests passing

### Phase 5: Documentation

- [ ] README files created
- [ ] Examples documented
- [ ] Architecture explained

---

## Time Estimates Summary

| Phase                          | Estimated Time  | Cumulative       |
| ------------------------------ | --------------- | ---------------- |
| Phase 1: Core Infrastructure   | 8-10 hours      | 8-10 hours       |
| Phase 2: First Process Builder | 10-14 hours     | 18-24 hours      |
| Phase 3: UI Components         | 3-4 hours       | 21-28 hours      |
| Phase 4: Testing & Polish      | 2-3 hours       | 23-31 hours      |
| Phase 5: Documentation         | 1 hour          | 24-32 hours      |
| **Total**                      | **24-32 hours** | **3.5-4.5 days** |

---

## Dependencies

### External Dependencies

- Next.js 15 (Server Actions support)
- TypeScript 5+
- Supabase client (already in project)
- Tailwind CSS (for UI components)

### Internal Dependencies

- `@/utils/supabase` - Supabase client
- `@/components/ui/*` - Shared UI components
- Database tables: `trivia_multiple_choice`, `trivia_true_false`, `trivia_who_am_i`, `trivia_sets`

---

## Success Criteria

### MVP Ready When:

- ✅ Core infrastructure complete
- ✅ Build-trivia-set process builder functional
- ✅ Can create trivia sets from UI
- ✅ All 6 tasks working
- ✅ Basic error handling works
- ✅ UI displays results

### Production Ready When:

- ✅ All tests passing
- ✅ Error handling comprehensive
- ✅ Documentation complete
- ✅ Performance acceptable (< 2s for set creation)
- ✅ Edge cases handled
- ✅ Code follows patterns

---

## Next Steps After MVP

1. **Add More Process Builders**
   - Generate Content Batch
   - Build Hero Collection
   - Process Source Content

2. **Enhancements**
   - Caching layer
   - Performance optimization
   - Advanced distribution strategies
   - AI enhancement integration

3. **Monitoring**
   - Execution time tracking
   - Error logging
   - Usage analytics

---

## Notes

- Follow isolation principles strictly
- Keep builder-specific code in builder folders
- Only add to `shared/` if used by 3+ builders
- Use Server Actions (not API routes)
- Maintain type safety throughout
- Test as you build (don't wait until end)

---

**Ready to begin implementation!** 🚀
