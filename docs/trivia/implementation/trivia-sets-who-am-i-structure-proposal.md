# Trivia Sets Who Am I - Table Structure Proposal

## Table: `trivia_sets_who_am_i`

### Purpose

Stores curated "Who Am I?" trivia sets - complete playable games containing only Who Am I questions.

---

## Proposed Structure

```sql
CREATE TABLE IF NOT EXISTS public.trivia_sets_who_am_i (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Basic Information
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,

  -- Organization & Categorization
  category VARCHAR(100),        -- e.g., "Players", "Teams", "History"
  theme VARCHAR(100),            -- e.g., "December Hockey", "NHL Legends"
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',

  -- Question Data (Embedded JSON) - WHO AM I SPECIFIC
  question_data JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  question_count INTEGER NOT NULL CHECK (question_count > 0),
  estimated_duration INTEGER,    -- Minutes to complete

  -- Workflow & Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published')),
  visibility VARCHAR(20) DEFAULT 'Private'
    CHECK (visibility IN ('Public', 'Unlisted', 'Private')),

  -- Publishing & Scheduling
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraint: If scheduled, must have scheduled_for date
  CONSTRAINT scheduled_date_required CHECK (
    (status = 'scheduled' AND scheduled_for IS NOT NULL) OR
    (status != 'scheduled')
  )
);
```

---

## Question Data Structure (JSONB)

**For Who Am I questions, the `question_data` JSONB contains:**

```typescript
interface WhoAmIQuestionData {
  question_id: string; // Unique ID for this instance (e.g., "q-123-0")
  source_id: number; // Reference to source question in trivia_who_am_i table
  question_text: string; // The "Who Am I?" question/clues
  correct_answer: string; // The answer (e.g., "Wayne Gretzky")
  explanation?: string; // Why this is the answer
  tags?: string[]; // Keywords for this question
  difficulty?: number; // 1-3 (easy/medium/hard)
  points?: number; // Points awarded (e.g., 10, 20, 30)
  time_limit?: number; // Seconds to answer (e.g., 30)
}
```

**Example JSONB:**

```json
[
  {
    "question_id": "q-42-0",
    "source_id": 42,
    "question_text": "I scored 894 goals in my NHL career. I played for the Edmonton Oilers and retired in 1999. Who am I?",
    "correct_answer": "Wayne Gretzky",
    "explanation": "Wayne Gretzky, 'The Great One', holds the NHL record for most goals.",
    "tags": ["NHL", "Goals", "Legends"],
    "difficulty": 1,
    "points": 10,
    "time_limit": 30
  },
  {
    "question_id": "q-87-1",
    "source_id": 87,
    "question_text": "I won the Stanley Cup 11 times as a player. I played for Montreal Canadiens. Who am I?",
    "correct_answer": "Henri Richard",
    "tags": ["Stanley Cup", "Montreal", "Legends"],
    "difficulty": 3,
    "points": 30,
    "time_limit": 30
  }
]
```

**Note:** No `wrong_answers` field - Who Am I questions don't need them!

---

## Indexes

```sql
-- Status filtering (draft/published/archived)
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_status
  ON public.trivia_sets_who_am_i(status);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_category
  ON public.trivia_sets_who_am_i(category);

-- Difficulty filtering
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_difficulty
  ON public.trivia_sets_who_am_i(difficulty);

-- Theme filtering
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_theme
  ON public.trivia_sets_who_am_i(theme);

-- Slug lookup (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trivia_sets_wai_slug
  ON public.trivia_sets_who_am_i(slug);

-- Recent items
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_created_at
  ON public.trivia_sets_who_am_i(created_at DESC);

-- Published items
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_published_at
  ON public.trivia_sets_who_am_i(published_at DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_question_data_gin
  ON public.trivia_sets_who_am_i USING GIN (question_data);

-- Visibility filtering
CREATE INDEX IF NOT EXISTS idx_trivia_sets_wai_visibility
  ON public.trivia_sets_who_am_i(visibility);
```

---

## Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trivia_sets_wai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trivia_sets_wai_updated_at_trigger
  BEFORE UPDATE ON public.trivia_sets_who_am_i
  FOR EACH ROW
  EXECUTE FUNCTION update_trivia_sets_wai_updated_at();
```

---

## Comments

```sql
COMMENT ON TABLE public.trivia_sets_who_am_i IS
  'Curated Who Am I trivia sets - complete playable games with only Who Am I questions';

COMMENT ON COLUMN public.trivia_sets_who_am_i.question_data IS
  'JSONB array of Who Am I questions. Each contains: question_text, correct_answer, explanation, tags, difficulty, points';

COMMENT ON COLUMN public.trivia_sets_who_am_i.status IS
  'Workflow status: draft (being created), scheduled (will publish at scheduled_for), published (live)';

COMMENT ON COLUMN public.trivia_sets_who_am_i.visibility IS
  'Access level: Public (everyone), Unlisted (link only), Private (admin only)';
```

---

## Key Differences from Generic `trivia_sets`

1. **question_data** - Optimized for Who Am I (no wrong_answers field)
2. **Table name** - Clearly indicates question type
3. **Validation** - Can enforce Who Am I specific rules at DB level
4. **API endpoints** - Separate endpoint for Who Am I trivia sets

---

## Questions for Discussion

### 1. Question Data Fields

**Do you want to include:**

- ✅ `question_text` - The Who Am I clues/question
- ✅ `correct_answer` - The answer
- ✅ `explanation` - Why this is the answer
- ✅ `tags` - Keywords
- ✅ `difficulty` - 1-3 numeric scale
- ✅ `points` - Points awarded
- ✅ `time_limit` - Seconds to answer

**Anything else? Like:**

- Clue difficulty progression? (multiple clues, easier → harder)
- Hints system?
- Media/images?

### 2. Set-Level Metadata

**Current proposed fields:**

- ✅ Title, slug, description
- ✅ Category, theme, difficulty
- ✅ Tags
- ✅ Question count
- ✅ Estimated duration
- ✅ Status, visibility

**Do you need:**

- Target audience? (kids, adults, experts)
- Price/pricing tier?
- Featured/promoted flag?
- Play count tracking?
- Rating/reviews?

### 3. Constraints

**Proposed:**

- ✅ Slug must be unique
- ✅ Question count > 0
- ✅ Status must be valid
- ✅ Difficulty must be easy/medium/hard
- ✅ If scheduled, must have scheduled_for date

**Any other rules?**

---

## Next Steps

1. **Confirm structure** - Is this what you need?
2. **Add/remove fields** - Any adjustments?
3. **Create migration script** - Build the table
4. **Update Process Builder** - Use correct table based on question type
5. **Repeat for MC and TF tables** - Same process

---

## My Questions for You

1. **Is this structure good for Who Am I sets?**
2. **Any fields missing or not needed?**
3. **Do you want any Who Am I specific features?** (like clue progression, hints, etc.)
4. **Should we proceed with this structure?**

Let me know your thoughts and we'll create the perfect structure for your Who Am I trivia product!
