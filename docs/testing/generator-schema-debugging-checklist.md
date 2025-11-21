# Generator Schema Debugging Checklist

## Issue Summary
The Main Generator is failing to persist generated content for:
- ❌ **Wisdom** (`collection_wisdom`)
- ❌ **Greetings** (`collection_greetings`)
- ❌ **Motivational** (`collection_motivational`)
- ❌ **Stats** (`collection_stats`)
- ❌ **True/False** (`trivia_true_false`) - Error: `Could not find the 'correct_answer' column`
- ✅ **Multiple Choice** (`trivia_multiple_choice`) - Working
- ✅ **Who Am I** (`trivia_who_am_i`) - Working

## Root Cause Hypothesis
Schema mismatch between what the generator normalizes and what the database tables expect.

## Debugging Steps

### 1. Verify Database Schema
Check actual column names in each table:

```sql
-- Check collection_wisdom schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'collection_wisdom'
ORDER BY ordinal_position;

-- Check collection_greetings schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'collection_greetings'
ORDER BY ordinal_position;

-- Check collection_motivational schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'collection_motivational'
ORDER BY ordinal_position;

-- Check collection_stats schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'collection_stats'
ORDER BY ordinal_position;

-- Check trivia_true_false schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trivia_true_false'
ORDER BY ordinal_position;

-- Compare with working tables
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trivia_multiple_choice'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trivia_who_am_i'
ORDER BY ordinal_position;
```

### 2. Check Normalized Object Structure
Review what each normalization function creates:

**File**: `apps/cms/src/lib/generator/tracks.ts`

- **Wisdom** (line 99-131): Creates `WisdomCreateInput` with:
  - `title`, `musing`, `from_the_box`, `theme`, `category`, `attribution`, `status`
  
- **Greetings** (line 133-148): Creates `GreetingCreateInput` with:
  - `greeting_text`, `attribution`, `status`
  
- **Motivational** (line 150-169): Creates `MotivationalCreateInput` with:
  - `quote`, `author`, `context`, `theme`, `category`, `attribution`, `status`
  
- **Stats** (line 171-200): Creates `StatCreateInput` with:
  - `stat_text`, `stat_value`, `stat_category`, `year`, `theme`, `category`, `attribution`, `status`
  
- **True/False** (line 243-267): Creates `TrueFalseTriviaCreateInput` with:
  - `question_text`, `correct_answer` (boolean), `explanation`, `category`, `theme`, `difficulty`, `tags`, `attribution`, `status`, `source_content_id`

### 3. Compare with Shared Types
Check `@aska/shared` types to see expected structure:

**Files to check**:
- `packages/shared/src/types/collections.ts` - For Wisdom, Greetings, Motivational, Stats
- `packages/shared/src/types/trivia.ts` - For True/False

### 4. Common Issues to Check

#### A. Column Name Mismatches
- Database uses `snake_case` but code uses `camelCase` (or vice versa)
- Check if Supabase auto-converts or if we need explicit mapping

#### B. Missing Columns
- Required columns not present in database
- Optional columns that are being set but don't exist

#### C. Data Type Mismatches
- Boolean vs string for `correct_answer` in true_false
- Integer vs string for `year` in stats
- Array vs string for `tags`

#### D. Required vs Optional
- Columns marked as NOT NULL in DB but code sets them as optional
- Default values not set in database

### 5. Test Insert Statements
Try manual inserts to verify schema:

```sql
-- Test Wisdom insert
INSERT INTO collection_wisdom (title, musing, from_the_box, status)
VALUES ('Test', 'Test musing', 'Test quote', 'draft');

-- Test Greetings insert
INSERT INTO collection_greetings (greeting_text, status)
VALUES ('Test greeting', 'draft');

-- Test Motivational insert
INSERT INTO collection_motivational (quote, status)
VALUES ('Test quote', 'draft');

-- Test Stats insert
INSERT INTO collection_stats (stat_text, status)
VALUES ('Test stat', 'draft');

-- Test True/False insert
INSERT INTO trivia_true_false (question_text, correct_answer, status)
VALUES ('Test question', true, 'draft');
```

### 6. Check Migration Files
Look for recent migrations that might have changed schema:

```bash
# Find migration files
ls -la sql/migrations/ | grep -E "(wisdom|greeting|motivational|stats|true_false)"
```

### 7. Compare Working vs Broken
**Why do Multiple Choice and Who Am I work?**

Check:
- Do they use different insert methods?
- Do they have different column structures?
- Do they use shared validation functions?

**Key difference**: Multiple Choice uses `validateMultipleChoiceTriviaInput` from `@aska/shared`, while others use local validation functions.

### 8. Fix Strategy

Once we identify the mismatches:

1. **Option A**: Update database schema to match normalized objects
2. **Option B**: Update normalization functions to match database schema
3. **Option C**: Add column mapping layer between normalized objects and database inserts

### 9. Files to Review

- `apps/cms/src/lib/generator/tracks.ts` - Normalization functions
- `apps/cms/src/app/main-generator/actions.ts` - Insert logic (line 115)
- `packages/shared/src/types/collections.ts` - Type definitions
- `packages/shared/src/types/trivia.ts` - Type definitions
- SQL migration files for each table

### 10. Testing After Fix

1. Generate content for each broken track
2. Verify items are saved to database
3. Check that all expected columns are populated
4. Verify data types are correct
5. Test with different source content

## Notes

- The error message for True/False specifically mentions `correct_answer` column missing
- Multiple Choice and Who Am I work, so their schema is correct
- The generator successfully creates normalized objects (validation passes)
- The failure happens at the database insert step (line 115 in actions.ts)

