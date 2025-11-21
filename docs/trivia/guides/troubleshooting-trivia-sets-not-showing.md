# Troubleshooting Trivia Sets Not Showing

## Issue

User reports that `trivia_sets_multiple_choice` table has records, but the library page is not showing them.

## Possible Causes

### 1. API Query Issue

Check if API is querying correctly:

- Table name: `trivia_sets_multiple_choice`
- Status filter: `draft`
- Order: `created_at DESC`

### 2. Table Name Mismatch

We created these tables:

- `trivia_sets_who_am_i`
- `trivia_sets_multiple_choice`
- `trivia_sets_true_false`

But user might have data in the old `trivia_sets` table.

### 3. Status Filter

Default filter is 'draft'. If sets are in another status, they won't show.

## Debugging Steps

### Step 1: Check Browser Console

Open browser dev tools (F12) and check:

1. Network tab - Is API call happening?
2. Response - What data is returned?
3. Console - Any errors?

### Step 2: Check Supabase Directly

Run in Supabase SQL Editor:

```sql
-- Check if table exists and has data
SELECT * FROM trivia_sets_multiple_choice;

-- Check status values
SELECT id, title, status FROM trivia_sets_multiple_choice;

-- Check if any drafts exist
SELECT COUNT(*) FROM trivia_sets_multiple_choice WHERE status = 'draft';
```

### Step 3: Check API Response

In browser console:

```javascript
fetch("/api/trivia-sets/multiple-choice?status=draft")
  .then((r) => r.json())
  .then((d) => console.log(d));
```

## Quick Fix Options

### Option A: Show All Statuses

Temporarily remove status filter to see all records.

### Option B: Check Old Table

Maybe data is still in old `trivia_sets` table instead of new split tables.

### Option C: Re-create Set

Try creating a new Multiple Choice set to verify flow works.

---

**User: Can you check browser console and tell me what the API returns?**
