# Trivia Sets: Embedded vs Referenced Questions - Architecture Decision

## The Question

When creating trivia sets, should questions be:

- **Option A:** Embedded in JSONB within the `trivia_sets` table (`question_data` field)
- **Option B:** Referenced from existing question tables via a join table (`trivia_set_questions`)

## Current State

**Existing Infrastructure:**

- `trivia_multiple_choice` table (individual questions)
- `trivia_true_false` table (individual questions)
- `trivia_who_am_i` table (individual questions)
- `trivia_sets` table exists with `question_data JSONB` field

## Option A: Embedded Questions (JSONB)

**How it works:**

- Questions stored directly in `trivia_sets.question_data` as JSON array
- Each set is self-contained with all question data

**Pros:**

- ✅ **Single query** - Get complete set with all questions in one fetch
- ✅ **Atomic updates** - Set is complete unit, no join complexity
- ✅ **Simpler API** - One endpoint returns everything
- ✅ **Performance** - No joins needed, faster reads
- ✅ **Versioning** - Set snapshots naturally (questions frozen at set creation time)

**Cons:**

- ❌ **Data duplication** - Same question in multiple sets = stored multiple times
- ❌ **Updates difficult** - Fix typo in question? Must update every set that contains it
- ❌ **No reuse** - Can't query "all sets using question X"
- ❌ **Storage bloat** - Large sets = large JSONB fields
- ❌ **Query limitations** - Hard to filter sets by question content

## Option B: Referenced Questions (Join Table)

**How it works:**

- New table: `trivia_set_questions` with `set_id`, `question_id`, `question_type`, `display_order`
- Questions remain in their original tables
- Sets reference questions via foreign keys

**Pros:**

- ✅ **Single source of truth** - Question exists once, referenced many times
- ✅ **Easy updates** - Fix question once, affects all sets using it
- ✅ **Question reuse** - Same question in multiple sets without duplication
- ✅ **Query flexibility** - "Find all sets with question X", "Update question Y everywhere"
- ✅ **Data integrity** - Foreign key constraints ensure valid references
- ✅ **Analytics** - Track which questions are most used

**Cons:**

- ❌ **Join complexity** - Need joins across multiple tables (one per question type)
- ❌ **Multiple queries** - Fetch set + fetch questions separately OR complex join query
- ❌ **More complex API** - Either multiple endpoints or complex query logic
- ❌ **Versioning harder** - If question changes, should old sets use old version?

## Option C: Hybrid Approach

**How it works:**

- Questions referenced via join table
- `question_data` JSONB used as **cached snapshot** for performance
- When set is published, snapshot the question data into JSONB
- Questions remain editable in source tables, but published sets are frozen

**Pros:**

- ✅ **Best of both worlds** - Flexibility + performance
- ✅ **Versioning** - Published sets are snapshots, editable questions don't break old sets
- ✅ **Query performance** - Use JSONB for reads, join table for management
- ✅ **Update workflow** - Edit question → republish sets → new snapshot

**Cons:**

- ❌ **Complexity** - Most complex solution, two sources of truth
- ❌ **Sync overhead** - Must maintain consistency between references and snapshots
- ❌ **Storage** - Still duplicate data (but intentionally)

## Questions to Consider

1. **How often will questions be updated?**
   - If rarely: Embedded is fine
   - If often: Referenced is better

2. **Will the same question appear in multiple sets?**
   - If no: Embedded is simpler
   - If yes: Referenced avoids duplication

3. **Will OnlyHockey need live updates?**
   - If published sets should reflect question edits: Referenced
   - If published sets are frozen snapshots: Embedded

4. **What's the primary use case?**
   - Content management (editing): Referenced
   - Game delivery (playing): Embedded

5. **How large are sets?**
   - Small sets (5-10 questions): Either works
   - Large sets (50+ questions): Embedded might be heavy

## Recommendation

**For OnlyHockey's use case:**

**Option A (Embedded)** if:

- Sets are final snapshots that don't change after publishing
- Questions are set-specific and rarely reused
- Simplicity and performance are priorities

**Option B (Referenced)** if:

- Questions will be reused across multiple sets
- You need to update questions and have changes reflect everywhere
- You want analytics on question usage

**Option C (Hybrid)** if:

- You need both: the flexibility of references AND the performance of embedded
- Published sets are snapshots, but you want to reuse questions in new sets
- You're willing to maintain the complexity

## Current Schema Analysis

The existing `trivia_sets` table has `question_data JSONB`, suggesting **Option A was the original plan**. But we have well-structured question tables already, making **Option B** attractive.

**Consider:**

- Do we need to migrate existing embedded approach?
- Or can we support both (embedded for delivery, referenced for management)?
