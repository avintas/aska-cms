# Process Builder: Isolation Strategy

## Goal

Keep Process Builder completely isolated from CMS codebase so it can be deleted/replaced without affecting CMS functionality.

---

## Proposed Folder Structure

```
tango/
├── app/
│   └── cms/                          # CMS pages (untouched)
│
├── process-builder/                  # 🎯 ISOLATED MODULE - DELETE THIS FOLDER TO REMOVE
│   ├── lib/                          # Process Builder logic only
│   │   ├── build-trivia-set.ts       # Main function (server-side)
│   │   ├── actions.ts                 # Server actions ('use server')
│   │   ├── tasks/                     # Task implementations
│   │   │   ├── query-questions.ts
│   │   │   ├── select-balance.ts
│   │   │   ├── generate-metadata.ts
│   │   │   ├── assemble-data.ts
│   │   │   ├── create-record.ts
│   │   │   └── validate-finalize.ts
│   │   ├── helpers/                  # Helper functions
│   │   │   ├── theme-matching.ts
│   │   │   ├── relevance-scoring.ts
│   │   │   ├── diversity-selection.ts
│   │   │   └── quality-metrics.ts
│   │   └── types.ts                  # Process Builder types only
│   │
│   ├── components/                   # Process Builder UI components
│   │   ├── process-builder-form.tsx
│   │   ├── trivia-set-preview.tsx
│   │   └── process-status.tsx
│   │
│   └── README.md                     # Process Builder documentation
│
├── lib/                              # Shared infrastructure (CMS uses this)
│   ├── supabase.ts                   # ✅ Process Builder can use
│   ├── supabase-admin.ts             # ✅ Process Builder can use
│   └── auth-context.tsx              # ✅ Process Builder can use
│
├── components/                       # Shared UI components (CMS uses this)
│   └── ui/                           # ✅ Process Builder can use
│
└── app/
    └── cms/                          # CMS pages (untouched by Process Builder)
```

---

## Isolation Rules

### ✅ **Process Builder CAN Use:**

1. **Shared Infrastructure:**
   - `lib/supabase.ts` - Database client
   - `lib/supabase-admin.ts` - Admin database client
   - `lib/auth-context.tsx` - Authentication (if needed)

2. **Shared UI Components:**
   - `components/ui/*` - Button, Input, Textarea, Heading, Alert

3. **Database Tables:**
   - `trivia_multiple_choice`
   - `trivia_true_false`
   - `trivia_who_am_i`
   - `trivia_sets`
   - `trivia_set_question_usage` (new table)

### ❌ **Process Builder CANNOT Use:**

1. **CMS-Specific Code:**
   - `app/cms/*` - Any CMS pages
   - `components/content-library/*` - CMS-specific components
   - `lib/gemini-*.ts` - CMS content generation logic
   - `lib/content-helpers.ts` - CMS helpers

2. **CMS API Routes:**
   - `app/api/content/*`
   - `app/api/gemini/*`
   - `app/api/greetings/*`
   - etc. (all CMS routes)

### 🔄 **Process Builder Creates Its Own:**

1. **Server Actions:** `process-builder/lib/actions.ts` (not API routes!)
2. **Components:** `process-builder/components/*`
3. **Logic:** `process-builder/lib/*`
4. **Types:** `process-builder/lib/types.ts`

---

## Implementation Strategy

### Step 1: Create Isolated Folder Structure

```bash
# Create Process Builder module
mkdir -p process-builder/lib/tasks
mkdir -p process-builder/lib/helpers
mkdir -p process-builder/components
# No API routes needed - using Server Actions instead!
```

### Step 2: Create Server Action (Isolated)

**File:** `process-builder/lib/actions.ts`

```typescript
"use server";

import { buildTriviaSet } from "./build-trivia-set";
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
} from "./types";

export async function buildTriviaSetAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
) {
  // Server-side function - can use database, etc.
  return await buildTriviaSet(goal, rules, options);
}
```

**Note:** No API route needed! Server Actions are called directly from client components.

### Step 3: Create Main Function (Isolated)

**File:** `process-builder/lib/build-trivia-set.ts`

```typescript
import { supabaseAdmin } from "@/lib/supabase-admin"; // ✅ Only shared dependency
import { querySourceQuestions } from "./tasks/query-questions";
import { selectAndBalance } from "./tasks/select-balance";
import { generateMetadata } from "./tasks/generate-metadata";
import { assembleQuestionData } from "./tasks/assemble-data";
import { createTriviaSetRecord } from "./tasks/create-record";
import { validateAndFinalize } from "./tasks/validate-finalize";
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
} from "./types";

export async function buildTriviaSet(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
) {
  // Implementation here - completely isolated
  // Only imports from process-builder/lib/* and shared infrastructure
}
```

### Step 4: Create Types (Isolated)

**File:** `process-builder/lib/types.ts`

```typescript
// Process Builder types - completely isolated
export interface ProcessBuilderGoal {
  text: string;
}

export interface ProcessBuilderRules {
  questionTypes: string[];
  questionCount: number;
  distributionStrategy?: "even" | "weighted" | "difficulty_balanced" | "custom";
  // ... other rules
}

export interface ProcessBuilderOptions {
  allowPartialSets?: boolean;
  useCache?: boolean;
  aiEnhancement?: boolean;
}

export interface TriviaSetResult {
  status: "success" | "error";
  trivia_set_id?: string;
  trivia_set?: any;
  errors?: any[];
  warnings?: any[];
}
```

---

## Dependency Management

### Import Rules in Process Builder Files

**✅ CORRECT - Shared Infrastructure:**

```typescript
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Button } from "@/components/ui/button";
```

**❌ WRONG - CMS-Specific:**

```typescript
import { generateGreetings } from "@/lib/gemini-greetings"; // ❌ CMS code
import { ContentCard } from "@/components/content-library/content-card"; // ❌ CMS component
```

### Barrel Exports (Optional)

**File:** `process-builder/lib/index.ts`

```typescript
// Barrel export for Process Builder
export { buildTriviaSet } from "./build-trivia-set";
export * from "./types";
```

---

## CMS Integration Points

### Minimal Integration Required

1. **Add Process Builder Link to CMS Navigation** (Optional)

**File:** `components/app-shell.tsx` (CMS file - minimal change)

```typescript
const processingActions = [
  {
    id: 0,
    name: "The Main Generator",
    href: "/cms/processing/main-generator",
    initial: "⚡",
  },
  {
    id: 1,
    name: "Process Builder", // ✅ Optional: Add Process Builder link
    href: "/process-builder",
    initial: "🔧",
  },
];
```

2. **Process Builder Page** (Optional - can be standalone)

**File:** `app/process-builder/page.tsx` (or `process-builder/app/process-builder/page.tsx`)

```typescript
import ProcessBuilderForm from '@/process-builder/components/process-builder-form';

export default function ProcessBuilderPage() {
  return <ProcessBuilderForm />;
}
```

---

## Deletion Safety

### To Remove Process Builder Completely:

```bash
# Delete Process Builder folder (that's it!)
rm -rf process-builder/

# Optional: Remove from CMS navigation (if added)
# Edit components/app-shell.tsx and remove Process Builder link
```

**Result:** CMS continues to work normally. No broken imports, no missing dependencies, no API routes to clean up.

---

## Testing Isolation

### Test Checklist:

1. ✅ Process Builder code only imports from:
   - `@/process-builder/lib/*`
   - `@/lib/supabase*` (shared)
   - `@/components/ui/*` (shared)

2. ✅ CMS code doesn't import from:
   - `@/process-builder/*`

3. ✅ Delete `process-builder/` folder:
   - CMS still compiles
   - CMS still runs
   - No TypeScript errors

4. ✅ Process Builder can be developed independently:
   - Can be in separate branch
   - Can be tested in isolation
   - Can be deployed separately (if needed)

---

## File Structure Example

```
process-builder/
├── README.md
├── lib/
│   ├── index.ts                      # Barrel export
│   ├── build-trivia-set.ts           # Main function (server-side)
│   ├── actions.ts                    # Server actions ('use server')
│   ├── types.ts                      # Process Builder types
│   ├── tasks/
│   │   ├── index.ts
│   │   ├── query-questions.ts
│   │   ├── select-balance.ts
│   │   ├── generate-metadata.ts
│   │   ├── assemble-data.ts
│   │   ├── create-record.ts
│   │   └── validate-finalize.ts
│   └── helpers/
│       ├── index.ts
│       ├── theme-matching.ts
│       ├── relevance-scoring.ts
│       ├── diversity-selection.ts
│       └── quality-metrics.ts
└── components/
    ├── process-builder-form.tsx       # Client component (calls actions)
    ├── trivia-set-preview.tsx
    └── process-status.tsx
```

---

## Benefits of This Approach

1. **Complete Isolation:** Process Builder is self-contained
2. **Easy Deletion:** Delete one folder to remove everything
3. **Independent Development:** Can be developed/tested separately
4. **Clear Boundaries:** Explicit rules about what can/can't be used
5. **Minimal CMS Impact:** CMS code remains untouched
6. **Reusability:** Can be extracted to separate package later if needed

---

## Migration Path

If you want to move Process Builder to a separate package later:

1. Copy `process-builder/` folder
2. Create new `package.json` with dependencies
3. Update imports to use package name
4. Publish as npm package
5. Install in CMS as dependency

The isolation makes this migration straightforward.

---

## Next Steps

1. Create `process-builder/` folder structure
2. Set up TypeScript path alias (if needed): `@/process-builder/*`
3. Create isolated API route
4. Implement Process Builder logic in isolated folder
5. Test that deletion doesn't break CMS
