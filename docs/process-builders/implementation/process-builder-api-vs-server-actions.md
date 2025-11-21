# Process Builder: API Routes vs Server Actions vs Direct Calls

## The Question

**Why do we need API routes for Process Builder? Can't we just call a function directly?**

## Answer: It Depends on How You Use It

### Option 1: API Route (Current CMS Pattern)

**When:** Client component needs to call server-side function

**Pattern:**

```typescript
// Client Component
"use client";
const handleBuild = async () => {
  const response = await fetch("/api/process-builder/build-trivia-set", {
    method: "POST",
    body: JSON.stringify({ goal, rules }),
  });
};

// API Route
// app/api/process-builder/build-trivia-set/route.ts
export async function POST(req: Request) {
  const result = await buildTriviaSet(goal, rules);
  return NextResponse.json(result);
}
```

**Why CMS uses this:**

- CMS pages are client components (`"use client"`)
- Client components can't directly import server-side functions
- Need HTTP endpoint to call from browser

---

### Option 2: Server Action (Next.js 14+ Pattern)

**When:** Client component needs to call server-side function (better than API route)

**Pattern:**

```typescript
// Server Action (can be in same file or separate)
// process-builder/lib/actions.ts
"use server";

export async function buildTriviaSetAction(goal: string, rules: Rules) {
  return await buildTriviaSet(goal, rules);
}

// Client Component
("use client");
import { buildTriviaSetAction } from "@/process-builder/lib/actions";

const handleBuild = async () => {
  const result = await buildTriviaSetAction(goal, rules);
};
```

**Benefits:**

- ✅ No API route needed
- ✅ Type-safe (TypeScript)
- ✅ Simpler (no fetch, no JSON parsing)
- ✅ Next.js handles serialization automatically

---

### Option 3: Server Component Direct Call

**When:** Server component can call function directly

**Pattern:**

```typescript
// Server Component (no "use client")
import { buildTriviaSet } from '@/process-builder/lib/build-trivia-set';

export default async function ProcessBuilderPage() {
  // Can call directly - runs on server
  const result = await buildTriviaSet(goal, rules);

  return <div>{result.trivia_set_id}</div>;
}
```

**Benefits:**

- ✅ Simplest - no API route, no server action
- ✅ Direct function call
- ✅ Runs on server (secure, fast)

**Limitation:**

- ❌ Can't be called from client-side interactions (form submissions, buttons)
- ❌ Only works for initial page load

---

## Recommendation for Process Builder

### **Use Server Actions** (Option 2)

**Why:**

1. **Simpler than API routes** - No fetch, no JSON parsing
2. **Type-safe** - Full TypeScript support
3. **Modern Next.js pattern** - Recommended approach
4. **Works with client components** - Can be called from forms/buttons
5. **No API route needed** - One less thing to maintain

### Structure:

```
process-builder/
├── lib/
│   ├── build-trivia-set.ts          # Core function (server-side)
│   ├── actions.ts                    # Server actions (wrappers)
│   │   └── 'use server'
│   │   └── export async function buildTriviaSetAction()
│   └── types.ts
│
└── components/
    └── process-builder-form.tsx      # Client component
        └── Calls buildTriviaSetAction()
```

**No API routes needed!**

---

## When You DO Need API Routes

### External Access

- ✅ External systems need to call Process Builder
- ✅ Mobile apps need to call Process Builder
- ✅ Webhooks from other services

### Public API

- ✅ OnlyHockey.com needs to call Process Builder
- ✅ Third-party integrations

### If Process Builder is ONLY used in CMS:

- ❌ **No API route needed** - Use Server Actions instead

---

## Updated Isolation Strategy

### Simplified Structure (No API Routes)

```
process-builder/
├── lib/
│   ├── build-trivia-set.ts          # Core function
│   ├── actions.ts                    # Server actions ('use server')
│   ├── tasks/
│   ├── helpers/
│   └── types.ts
│
└── components/
    └── process-builder-form.tsx     # Client component
```

**To delete Process Builder:**

```bash
rm -rf process-builder/
```

**No API routes to delete!**

---

## Comparison Table

| Approach          | Complexity | Type Safety | Client Callable | External Access | Recommended?                   |
| ----------------- | ---------- | ----------- | --------------- | --------------- | ------------------------------ |
| **API Route**     | Medium     | Manual      | ✅              | ✅              | Only if external access needed |
| **Server Action** | Low        | ✅ Full     | ✅              | ❌              | ✅ **Yes - Use this**          |
| **Direct Call**   | Lowest     | ✅ Full     | ❌              | ❌              | Only for server components     |

---

## Implementation Example

### Server Action Approach

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

**File:** `process-builder/components/process-builder-form.tsx`

```typescript
'use client';

import { buildTriviaSetAction } from '../lib/actions';

export default function ProcessBuilderForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Direct function call - no fetch, no API route!
    const result = await buildTriviaSetAction(goal, rules);

    if (result.status === 'success') {
      // Handle success
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Conclusion

**For Process Builder: Use Server Actions, NOT API Routes**

- ✅ Simpler
- ✅ Type-safe
- ✅ Modern Next.js pattern
- ✅ No API routes to maintain
- ✅ Still isolated (can delete `process-builder/` folder)

**Only create API routes if:**

- External systems need to call Process Builder
- You need public API access
- You're building a microservice architecture

**For internal CMS use: Server Actions are the way to go.**
