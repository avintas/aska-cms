# Where is correct_answer Stored? - Clarification

## Table Structure

The `trivia_sets_who_am_i` table has these **columns**:

```
id, title, slug, description, category, theme, difficulty, tags,
question_data,  ← THIS IS WHERE correct_answer LIVES
question_count, status, visibility, published_at, scheduled_for,
created_at, updated_at
```

---

## The correct_answer is INSIDE question_data (JSONB)

### Table Column (One JSONB Column)

```sql
question_data JSONB NOT NULL
```

### Inside That JSONB (Array of Question Objects)

```json
[
  {
    "question_id": "q-42-0",
    "source_id": 42,
    "question_text": "I scored 894 goals in my career. Who am I?",
    "correct_answer": "Wayne Gretzky",  ← HERE!
    "explanation": "The Great One holds the record...",
    "tags": ["NHL", "Goals"],
    "difficulty": 1,
    "points": 10
  },
  {
    "question_id": "q-87-1",
    "source_id": 87,
    "question_text": "I won 11 Stanley Cups. Who am I?",
    "correct_answer": "Henri Richard",  ← HERE!
    "difficulty": 3,
    "points": 30
  }
]
```

---

## Why Store It This Way?

### ✅ Pros

1. **Flexible** - Can add new fields without ALTER TABLE
2. **Complete** - Each question is self-contained
3. **Efficient** - One read gets all questions
4. **Scalable** - Works for 1 or 100 questions

### How It Works

**When you create a trivia set:**

```javascript
INSERT INTO trivia_sets_who_am_i (
  title,
  slug,
  question_count,
  question_data  // ← All questions in one JSONB column
) VALUES (
  'Hockey Legends Trivia',
  'hockey-legends-trivia',
  2,
  '[
    {"question_text": "...", "correct_answer": "Wayne Gretzky"},
    {"question_text": "...", "correct_answer": "Henri Richard"}
  ]'
);
```

**When you query it:**

```javascript
const set = await supabase
  .from("trivia_sets_who_am_i")
  .select("*")
  .eq("id", 1)
  .single();

// set.question_data is an array of questions
// Each question has correct_answer inside it
console.log(set.question_data[0].correct_answer); // "Wayne Gretzky"
```

---

## Is This the Right Approach?

### Option A: Current Design (JSONB)

```
question_data: [
  { question_text, correct_answer, ... },
  { question_text, correct_answer, ... }
]
```

✅ Flexible, scalable, one read  
❌ Can't index/search individual answers easily

### Option B: Separate Join Table

```
trivia_sets_who_am_i (id, title, slug, ...)
trivia_set_wai_questions (set_id, question_id, display_order)
```

✅ Can query individual questions  
❌ More complex, multiple reads

---

## Recommendation

**Keep the JSONB approach** because:

1. **Trivia sets are frozen/immutable** - Once published, questions don't change
2. **Read-heavy** - You read entire sets, not individual questions
3. **Performance** - One query gets everything
4. **Simplicity** - Less complex to manage

**The correct_answer IS stored** - it's inside the `question_data` JSONB column.

---

## Does This Make Sense?

The `correct_answer` is there, just nested inside the JSONB. Is this clear now, or do you prefer a different structure?
