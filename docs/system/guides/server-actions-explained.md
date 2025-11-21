# Server Actions Explained

## What Are Server Actions?

**Server Actions** are Next.js 13+ functions that run on the server but can be called directly from client components (React components in the browser).

Think of them as: **"Server functions you can call from the browser without writing API routes"**

---

## The Problem They Solve

### Before Server Actions (Old Way)

**Option 1: API Routes**

```typescript
// 1. Create API route
// app/api/create-trivia-set/route.ts
export async function POST(req: Request) {
  const data = await req.json();
  // Do server stuff
  return NextResponse.json({ success: true });
}

// 2. Call from client component
("use client");
const handleSubmit = async () => {
  const response = await fetch("/api/create-trivia-set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, rules }),
  });
  const result = await response.json();
};
```

**Problems:**

- ❌ Need to create API route file
- ❌ Need to manually serialize/deserialize JSON
- ❌ No TypeScript type safety across the boundary
- ❌ More boilerplate code

### With Server Actions (New Way)

```typescript
// 1. Create server action
// lib/actions.ts
"use server";

export async function createTriviaSet(goal: string, rules: Rules) {
  // Do server stuff - runs on server
  return { success: true };
}

// 2. Call directly from client component
("use client");
import { createTriviaSet } from "@/lib/actions";

const handleSubmit = async () => {
  const result = await createTriviaSet(goal, rules);
  // TypeScript knows the return type!
};
```

**Benefits:**

- ✅ No API route needed
- ✅ Automatic serialization (Next.js handles it)
- ✅ Full TypeScript type safety
- ✅ Less boilerplate

---

## How Server Actions Work

### 1. The `'use server'` Directive

This tells Next.js: **"This function runs on the server"**

```typescript
"use server";

export async function myServerAction(param: string) {
  // This code runs on the SERVER
  // Can access database, file system, environment variables, etc.
  return { result: "done" };
}
```

### 2. Calling from Client Components

```typescript
'use client';  // Client component

import { myServerAction } from '@/lib/actions';

export default function MyComponent() {
  const handleClick = async () => {
    // This call happens from the BROWSER
    // But the function executes on the SERVER
    const result = await myServerAction('hello');
    console.log(result); // { result: 'done' }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### 3. What Happens Behind the Scenes

```
Browser (Client Component)
  ↓
  Calls: myServerAction('hello')
  ↓
Next.js automatically:
  1. Serializes parameters to JSON
  2. Sends HTTP POST request to server
  3. Server executes function
  4. Serializes return value to JSON
  5. Sends response back to browser
  6. Deserializes and returns result
  ↓
Browser receives result
```

**You don't see any of this** - Next.js handles it automatically!

---

## Real-World Example: Process Builder

### Server Action File

**File:** `process-builder/lib/actions.ts`

```typescript
"use server";

import { buildTriviaSet } from "./build-trivia-set";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ProcessBuilderGoal, ProcessBuilderRules } from "./types";

export async function buildTriviaSetAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
) {
  // ✅ Can use database (runs on server)
  const { data } = await supabaseAdmin
    .from("trivia_multiple_choice")
    .select("*");

  // ✅ Can access environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  // ✅ Can do heavy computation
  const result = await buildTriviaSet(goal, rules);

  // ✅ Return value is automatically serialized
  return {
    status: "success",
    trivia_set_id: result.id,
    trivia_set: result,
  };
}
```

### Client Component Using It

**File:** `process-builder/components/process-builder-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { buildTriviaSetAction } from '../lib/actions';
import { Button } from '@/components/ui/button';

export default function ProcessBuilderForm() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Direct function call - no fetch, no JSON!
      const result = await buildTriviaSetAction(
        { text: goal },
        { questionTypes: ['TMC', 'TFT'], questionCount: 10 }
      );

      // ✅ TypeScript knows result structure
      if (result.status === 'success') {
        alert(`Created trivia set: ${result.trivia_set_id}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        Build Trivia Set
      </Button>
    </form>
  );
}
```

---

## Key Characteristics

### ✅ What Server Actions CAN Do

1. **Access Server Resources:**
   - Database queries
   - File system
   - Environment variables
   - External APIs
   - Server-only libraries

2. **Security:**
   - Code never sent to browser
   - Can validate authentication
   - Can check permissions

3. **Performance:**
   - Runs on server (faster than client)
   - Can do heavy computation
   - Can cache results

### ❌ Limitations

1. **Serializable Data Only:**
   - Parameters must be JSON-serializable
   - Can't pass functions, classes, or complex objects
   - Can't pass React components

2. **Async Only:**
   - Must be `async` functions
   - Always returns a Promise

3. **No Streaming:**
   - Can't stream responses
   - Must return complete result

---

## Comparison Table

| Feature                        | API Routes       | Server Actions | Direct Import |
| ------------------------------ | ---------------- | -------------- | ------------- |
| **Client callable**            | ✅ Yes           | ✅ Yes         | ❌ No         |
| **Type safety**                | Manual           | ✅ Automatic   | ✅ Automatic  |
| **Boilerplate**                | High             | Low            | None          |
| **File needed**                | Yes (`route.ts`) | No             | No            |
| **Serialization**              | Manual           | Automatic      | N/A           |
| **Works in Server Components** | ❌ No            | ✅ Yes         | ✅ Yes        |

---

## When to Use Server Actions

### ✅ Use Server Actions When:

- Client component needs to call server function
- You want type safety
- You want less boilerplate
- Function is only used internally (not external API)

### ❌ Use API Routes When:

- External systems need to call your function
- You need public API endpoints
- You need custom HTTP headers/status codes
- You need streaming responses
- You need webhooks

### ✅ Use Direct Import When:

- Server component calling server function
- No client interaction needed
- Simplest approach

---

## Common Patterns

### Pattern 1: Form Submission

```typescript
'use server';

export async function submitForm(formData: FormData) {
  const name = formData.get('name');
  // Process form
  return { success: true };
}

// In component:
<form action={submitForm}>
  <input name="name" />
  <button type="submit">Submit</button>
</form>
```

### Pattern 2: Button Click

```typescript
'use server';

export async function deleteItem(id: string) {
  await db.delete(id);
  return { success: true };
}

// In component:
<button onClick={() => deleteItem(itemId)}>
  Delete
</button>
```

### Pattern 3: With Loading States

```typescript
'use client';

import { useState, useTransition } from 'react';
import { buildTriviaSet } from './actions';

export default function MyComponent() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await buildTriviaSet(goal, rules);
      // Handle result
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Loading...' : 'Build'}
    </button>
  );
}
```

---

## Security Considerations

### ✅ Server Actions Are Secure Because:

1. **Code Never Sent to Browser:**

   ```typescript
   "use server";

   export async function adminAction() {
     // This code is NEVER sent to browser
     // Only the function name/reference is sent
   }
   ```

2. **Can Validate Authentication:**

   ```typescript
   "use server";

   export async function protectedAction() {
     const user = await getCurrentUser();
     if (!user) {
       throw new Error("Unauthorized");
     }
     // Proceed...
   }
   ```

3. **Can Check Permissions:**

   ```typescript
   "use server";

   export async function adminOnlyAction() {
     const user = await getCurrentUser();
     if (user.role !== "admin") {
       throw new Error("Forbidden");
     }
     // Admin-only code...
   }
   ```

---

## Summary

**Server Actions = Server functions you can call from client components**

**Key Points:**

1. Mark with `'use server'` directive
2. Can access server resources (database, files, env vars)
3. Called directly from client components (no fetch needed)
4. Automatic serialization/deserialization
5. Full TypeScript type safety
6. Less boilerplate than API routes

**Think of them as:** "API routes, but simpler and type-safe"

**For Process Builder:** Perfect fit - internal CMS tool, needs type safety, wants simplicity.
