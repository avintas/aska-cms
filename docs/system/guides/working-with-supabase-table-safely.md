# Working with Supabase trivia_sets Table - Safe Approach

## 🎯 Important: The Table Already Exists

The `trivia_sets` table **already exists in your Supabase database** (created by `sql/29-create-trivia-sets-table.sql`).

**We are NOT creating a new table** - we're just verifying it has the structure we need.

---

## ✅ Safe Approach: Verify First, Modify Only If Needed

### Step 1: Check Current Structure (READ-ONLY)

Run this query in Supabase SQL Editor to see the current structure:

```sql
-- Check current table structure (READ-ONLY)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trivia_sets'
ORDER BY ordinal_position;

-- Check current constraints
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'trivia_sets';

-- Check current indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'trivia_sets';
```

**This is safe** - it only reads, doesn't modify anything.

---

### Step 2: Compare with What We Need

**Required Structure for Process Builder:**

| Column           | Type        | Required? | Notes            |
| ---------------- | ----------- | --------- | ---------------- |
| `id`             | BIGSERIAL   | ✅        | Primary key      |
| `title`          | VARCHAR     | ✅        | NOT NULL         |
| `slug`           | VARCHAR     | ✅        | Should be UNIQUE |
| `description`    | TEXT        | Optional  |                  |
| `category`       | VARCHAR     | Optional  |                  |
| `theme`          | VARCHAR     | Optional  |                  |
| `difficulty`     | VARCHAR     | Optional  |                  |
| `tags`           | TEXT[]      | Optional  |                  |
| `question_data`  | JSONB       | ✅        | NOT NULL         |
| `question_count` | INTEGER     | Optional  |                  |
| `status`         | VARCHAR     | ✅        | NOT NULL         |
| `visibility`     | VARCHAR     | Optional  |                  |
| `published_at`   | TIMESTAMPTZ | Optional  |                  |
| `scheduled_for`  | TIMESTAMPTZ | Optional  |                  |
| `created_at`     | TIMESTAMPTZ | ✅        | DEFAULT NOW()    |
| `updated_at`     | TIMESTAMPTZ | ✅        | DEFAULT NOW()    |

---

### Step 3: Safe Migration (Only Adds If Missing)

The migration script (`sql/30-verify-trivia-sets-for-process-builder.sql`) is **safe** because:

1. **Uses `IF NOT EXISTS`** - Only creates if missing
2. **Uses `DO $$` block** - Checks before adding constraints
3. **No data modification** - Only adds constraints/indexes
4. **Idempotent** - Can run multiple times safely

**What it does:**

- ✅ Adds unique constraint on `slug` (only if not exists)
- ✅ Creates indexes (only if not exists)
- ✅ Verifies structure (read-only)

**What it does NOT do:**

- ❌ Does NOT modify existing data
- ❌ Does NOT drop columns
- ❌ Does NOT change column types
- ❌ Does NOT delete anything

---

## 🔍 How to Verify Your Current Table

### Option 1: Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Find `trivia_sets` table
4. Check columns and structure

### Option 2: SQL Query (Recommended)

Run this in Supabase SQL Editor:

```sql
-- Get full table structure
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  CASE
    WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
    WHEN uq.column_name IS NOT NULL THEN 'UNIQUE'
    ELSE ''
  END as constraints
FROM information_schema.columns c
LEFT JOIN (
  SELECT ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
  WHERE tc.table_name = 'trivia_sets'
    AND tc.constraint_type = 'PRIMARY KEY'
) pk ON c.column_name = pk.column_name
LEFT JOIN (
  SELECT ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
  WHERE tc.table_name = 'trivia_sets'
    AND tc.constraint_type = 'UNIQUE'
) uq ON c.column_name = uq.column_name
WHERE c.table_schema = 'public'
  AND c.table_name = 'trivia_sets'
ORDER BY c.ordinal_position;
```

---

## 🛡️ Safe Migration Strategy

### Before Running Migration:

1. **Backup** (if you have important data):

   ```sql
   -- Export current data (optional)
   SELECT * FROM trivia_sets;
   ```

2. **Verify current structure** (see queries above)

3. **Check if migration is needed**:
   - Does `slug` have unique constraint? (Check constraints query)
   - Do all indexes exist? (Check indexes query)

### Running Migration:

**The migration script is safe**, but if you want extra caution:

```sql
-- Run in Supabase SQL Editor
-- This will only add what's missing
\i sql/30-verify-trivia-sets-for-process-builder.sql
```

Or copy/paste the contents of `sql/30-verify-trivia-sets-for-process-builder.sql` into Supabase SQL Editor.

---

## 📋 What Process Builder Needs

**Minimum Requirements:**

- ✅ Table exists (already does)
- ✅ `id`, `title`, `slug`, `question_data`, `status` columns exist (already do)
- ✅ `slug` should be unique (may need to add)
- ✅ Indexes for performance (may need to add)

**The table structure from `sql/29-create-trivia-sets-table.sql` already matches what we need!**

The migration script just ensures:

- Slug uniqueness (for data integrity)
- Proper indexes (for performance)

---

## ✅ Recommendation

1. **First**: Run the verification query (read-only) to see current structure
2. **Then**: Compare with what Process Builder needs
3. **Finally**: Run migration only if something is missing

**The migration is safe** - it only adds missing constraints/indexes, never modifies data or structure.

---

## 🎯 Next Steps

1. **Check your current table structure** in Supabase
2. **Compare** with what Process Builder needs
3. **Run migration** only if needed (it's safe, but verify first)

Would you like me to create a simple verification script you can run in Supabase to check the current structure?
