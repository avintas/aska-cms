# Process Builder: Updated for Three Tables

## ✅ What's Been Updated

### Task 5: Create Record (Updated)

**File:** `process-builders/build-trivia-set/lib/tasks/create-record.ts`

**Changes:**

- Now detects question type from first question
- Routes to correct table:
  - `who-am-i` → `trivia_sets_who_am_i`
  - `multiple-choice` → `trivia_sets_multiple_choice`
  - `true-false` → `trivia_sets_true_false`
- Includes table name in result metadata

---

## 📋 Migration Scripts Ready

### Three New Tables:

1. **`sql/31-create-trivia-sets-who-am-i-table.sql`** ✅
2. **`sql/32-create-trivia-sets-multiple-choice-table.sql`** ✅
3. **`sql/33-create-trivia-sets-true-false-table.sql`** ✅

All use:

- Same structure (title, slug, status, etc.)
- JSONB `question_data` column
- Type-specific question format
- All constraints and indexes
- Auto-update triggers

---

## 🎯 How It Works Now

### User Creates Who Am I Set:

1. Select **only WAI** checkbox
2. Enter theme: "Hockey Legends"
3. Click "Build Trivia Set"
4. Process Builder:
   - Queries `trivia_who_am_i` table
   - Selects 3 Who Am I questions
   - Creates record in `trivia_sets_who_am_i` table ← NEW!

### User Creates Multiple Choice Set:

1. Select **only TMC** checkbox
2. Process Builder uses `trivia_sets_multiple_choice` table ← NEW!

### User Creates True/False Set:

1. Select **only TFT** checkbox
2. Process Builder uses `trivia_sets_true_false` table ← NEW!

---

## Next Steps

### Step 1: Run Migration Scripts in Supabase

**Go to Supabase SQL Editor and run:**

```sql
-- 1. Create Who Am I sets table
\i sql/31-create-trivia-sets-who-am-i-table.sql

-- 2. Create Multiple Choice sets table
\i sql/32-create-trivia-sets-multiple-choice-table.sql

-- 3. Create True/False sets table
\i sql/33-create-trivia-sets-true-false-table.sql
```

Or copy/paste each file's contents into SQL Editor.

---

### Step 2: Update TypeScript Types (Optional)

Create type-specific interfaces in `lib/supabase.ts`:

```typescript
// Who Am I specific
export interface TriviaSetWhoAmI {
  id: number;
  title: string;
  slug: string;
  // ... same as TriviaSet
}

// Multiple Choice specific
export interface TriviaSetMultipleChoice {
  // ... same structure
}

// True/False specific
export interface TriviaSetTrueFalse {
  // ... same structure
}
```

---

### Step 3: Test Process Builder

**Test each question type:**

1. **Test Who Am I:**
   - Check only WAI
   - Theme: "hockey"
   - Count: 3
   - Should create in `trivia_sets_who_am_i`

2. **Test Multiple Choice:**
   - Check only TMC
   - Should create in `trivia_sets_multiple_choice`

3. **Test True/False:**
   - Check only TFT
   - Should create in `trivia_sets_true_false`

---

### Step 4: Verify in Supabase

After creating sets, check:

- `trivia_sets_who_am_i` table has records
- `trivia_sets_multiple_choice` table has records
- `trivia_sets_true_false` table has records
- Each has correct question_data format

---

## 🎉 Benefits of This Approach

1. **Clear Product Lines:**
   - Sell "Who Am I? Trivia Packs" separately
   - Sell "Multiple Choice Trivia" separately
   - Sell "True/False Trivia" separately

2. **Type-Specific Optimization:**
   - Who Am I: No wrong_answers clutter
   - Multiple Choice: Has wrong_answers array
   - True/False: Simple true/false answer

3. **Future Features:**
   - Add Who Am I specific features (clues, hints, images)
   - Add Multiple Choice specific features (answer shuffling options)
   - Add True/False specific features (factoid display)

4. **JSONB Flexibility:**
   - Add media fields when ready (no ALTER TABLE)
   - Add clues/hints when ready
   - Extensible without migrations

---

## Ready to Test!

1. Run the 3 SQL scripts in Supabase
2. Test the Process Builder with each question type
3. Verify records are created in correct tables

Let me know when you've run the SQL scripts and we'll test!
