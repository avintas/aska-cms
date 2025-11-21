# Trivia Sets: Should We Split by Question Type?

## Your Question

Should we have separate trivia set tables:

- `trivia_sets_who_am_i` - Only Who Am I questions
- `trivia_sets_multiple_choice` - Only Multiple Choice questions
- `trivia_sets_true_false` - Only True/False questions

Instead of one generic `trivia_sets` table?

---

## Current Design: Single Table with JSONB

**Table:** `trivia_sets`  
**Question storage:** `question_data` JSONB column

```json
{
  "question_text": "I scored 894 goals in my career...",
  "question_type": "who-am-i",
  "correct_answer": "Wayne Gretzky",
  "wrong_answers": [],
  "explanation": "The Great One holds the record..."
}
```

### ✅ Pros

1. **Flexibility** - Can mix question types in one set (if desired later)
2. **Simple API** - One endpoint for all trivia sets
3. **Easier queries** - SELECT \* FROM trivia_sets
4. **Less code** - One set of CRUD operations

### ❌ Cons

1. **Generic structure** - Doesn't enforce type-specific fields
2. **Validation complexity** - Must validate different types in JSONB
3. **Query efficiency** - Can't index specific question type fields
4. **Confusing for users** - "wrong_answers" is empty for Who Am I

---

## Alternative Design: Separate Tables

### Option 1: Three Separate Tables

**Tables:**

- `trivia_sets_who_am_i`
- `trivia_sets_multiple_choice`
- `trivia_sets_true_false`

**Structure for Who Am I:**

```sql
CREATE TABLE trivia_sets_who_am_i (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  -- ... standard fields ...
  question_data JSONB NOT NULL -- Pure Who Am I questions
);
```

### ✅ Pros

1. **Type-specific** - Each table optimized for its question type
2. **Clear separation** - Who Am I sets are clearly distinct from MC sets
3. **Easier to sell** - "Buy our Who Am I Trivia Pack" (clear product)
4. **Better validation** - Type-specific validation rules
5. **Cleaner data** - No confusing empty arrays

### ❌ Cons

1. **More tables** - 3 tables instead of 1
2. **More code** - 3 sets of CRUD operations
3. **More APIs** - 3 endpoints instead of 1
4. **No mixing** - Can't have mixed question types (but you said you don't want this anyway)

---

## My Recommendation

**Split into separate tables!** Here's why:

### Your Use Case Fits This Perfectly

You said:

> "I don't want to combine 'Who Am I?' with multiple choice. I just want to use this form to produce strictly 'Who Am I?' questions, which I can sell."

This confirms:

1. ✅ You're selling separate products (Who Am I vs MC vs TF)
2. ✅ You don't need mixed question types
3. ✅ Each type is a distinct product line

### Benefits for Your Business

1. **Clear Products:**
   - "Daily Who Am I? Trivia"
   - "Daily Multiple Choice Trivia"
   - "Daily True/False Trivia"

2. **Better Organization:**
   - Easy to find all Who Am I sets
   - Easy to manage each product separately

3. **Future-Proof:**
   - Can add type-specific features later
   - Can price differently
   - Can have type-specific metadata

---

## Implementation Options

### Option A: Migrate Now (Recommended if table is empty/new)

- Create three new tables
- Update Process Builder to use correct table
- Keep current `trivia_sets` for legacy/migration

### Option B: Keep Current, Document Pattern (Easier short-term)

- Keep single `trivia_sets` table
- Enforce "only one question type per set" in Process Builder
- Add validation to prevent mixing
- Consider splitting later if needed

---

## My Recommendation for You

**Option A: Split into separate tables**

Why:

1. Matches your business model (selling separate products)
2. Cleaner data structure
3. Easier to understand
4. Better for future growth

**Action Plan:**

1. Create: `trivia_sets_who_am_i`, `trivia_sets_multiple_choice`, `trivia_sets_true_false`
2. Update Process Builder to use correct table based on question type
3. Keep: `trivia_sets` table for legacy/backwards compatibility

---

## Question for You

**Do you want to:**

A) **Split into 3 tables** - Better architecture, more work upfront
B) **Keep 1 table** - Easier now, but may need to split later
C) **Discuss more** - Want to explore other options

What do you prefer?
