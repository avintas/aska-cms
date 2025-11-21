# Testing Process Builders Setup

## Quick Test Guide

### Prerequisites

1. **Install tsx** (if not already installed):

   ```bash
   npm install -D tsx
   ```

2. **Generate Registry** (first time):
   ```bash
   npm run discover-builders
   ```

---

## Test Methods

### Method 1: Run Automated Test Suite (Recommended)

```bash
npm run test-process-builders
```

This will test:

- ✅ Registry discovery
- ✅ Validation logic
- ✅ Executor functionality
- ✅ Build Trivia Set process builder

---

### Method 2: Manual Testing Steps

#### Step 1: Test TypeScript Compilation

```bash
npm run build
```

**Expected:** Should compile without errors (may warn about placeholder TODOs, that's OK)

---

#### Step 2: Test Registry Discovery

```bash
npm run discover-builders
```

**Expected Output:**

```
✓ Discovered: Build Trivia Set (build-trivia-set)

✓ Generated registry with 1 process builder(s)
  Registry file: C:\WebFarm\tango\process-builders-registry.json
```

---

#### Step 3: Test Type Imports

Create a test file: `test-imports.ts`

```typescript
// Test that imports work
import { getAllProcessBuilders } from "./process-builders/core/registry";
import { ProcessBuilderExecutor } from "./process-builders/core/executor";
import { buildTriviaSet } from "./process-builders/build-trivia-set/lib/build-trivia-set";

console.log("✓ All imports successful");
```

Run: `tsx test-imports.ts`

**Expected:** Should run without errors

---

#### Step 4: Test Registry Loading

```typescript
import { getAllProcessBuilders } from "./process-builders/core/registry";

async function test() {
  const builders = await getAllProcessBuilders();
  console.log(`Found ${builders.length} process builder(s)`);
  builders.forEach((b) => console.log(`  - ${b.name}`));
}

test();
```

**Expected:** Should list "Build Trivia Set"

---

#### Step 5: Test Process Builder Execution (Dry Run)

```typescript
import { buildTriviaSet } from "./process-builders/build-trivia-set/lib/build-trivia-set";

async function test() {
  const result = await buildTriviaSet(
    { text: "December Hockey" },
    {
      questionTypes: {
        key: "questionTypes",
        value: ["TMC", "TFT"],
        type: "array",
      },
      questionCount: { key: "questionCount", value: 10, type: "number" },
    },
    { dryRun: true }, // Avoids database calls
  );

  console.log(`Status: ${result.status}`);
  console.log(`Tasks executed: ${result.results.length}`);
}

test();
```

**Expected:** Should execute (may have warnings about placeholder implementations, that's OK)

---

## What to Look For

### ✅ Success Indicators

- Registry discovers process builders
- TypeScript compiles without errors
- Imports work correctly
- Executor can run tasks
- Process builder executes (even with placeholder logic)

### ⚠️ Expected Warnings (OK)

- "Selection logic not yet implemented" - Expected, placeholder code
- "Validation logic not yet fully implemented" - Expected, placeholder code
- "Record creation not yet fully implemented" - Expected, placeholder code

### ❌ Real Errors to Fix

- TypeScript compilation errors
- Import errors
- Registry not finding builders
- Executor failing to run

---

## Troubleshooting

### Issue: "Cannot find module 'tsx'"

**Solution:**

```bash
npm install -D tsx
```

### Issue: Registry not finding builders

**Solution:**

1. Check that `process-builders/build-trivia-set/lib/index.ts` exists
2. Check that it exports `metadata`
3. Run `npm run discover-builders` again

### Issue: TypeScript errors

**Solution:**

1. Check that all imports are correct
2. Verify `process-builders-registry.json` exists
3. Run `npm run lint` to see detailed errors

---

## Next Steps After Testing

Once tests pass:

1. ✅ **Isolation Verified** - Process Builders are isolated
2. ✅ **Architecture Working** - Core infrastructure is functional
3. ✅ **Ready to Implement** - Can now fill in placeholder task logic

If tests fail, you can safely delete:

```bash
rm -rf process-builders/
rm -f process-builders-registry.json
```

CMS will continue working normally.
