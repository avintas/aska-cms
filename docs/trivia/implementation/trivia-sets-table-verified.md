# Trivia Sets Table Structure - Verified for Process Builder

## ✅ Table Structure

**Table:** `public.trivia_sets`

### Columns

| Column           | Type        | Nullable | Default | Description                     |
| ---------------- | ----------- | -------- | ------- | ------------------------------- |
| `id`             | BIGSERIAL   | NO       | auto    | Primary key                     |
| `title`          | VARCHAR     | NO       | -       | Trivia set title                |
| `slug`           | VARCHAR     | YES      | -       | URL-friendly slug (UNIQUE)      |
| `description`    | TEXT        | YES      | -       | Set description                 |
| `category`       | VARCHAR     | YES      | -       | Category (e.g., "Seasonal")     |
| `theme`          | VARCHAR     | YES      | -       | Theme (e.g., "December Hockey") |
| `difficulty`     | VARCHAR     | YES      | -       | Difficulty level                |
| `tags`           | TEXT[]      | YES      | -       | Array of tags                   |
| `question_data`  | JSONB       | NO       | -       | Array of question objects       |
| `question_count` | INTEGER     | YES      | -       | Number of questions             |
| `status`         | VARCHAR     | NO       | -       | draft, published, archived      |
| `visibility`     | VARCHAR     | YES      | -       | Public, Unlisted, Private       |
| `published_at`   | TIMESTAMPTZ | YES      | -       | When published                  |
| `scheduled_for`  | TIMESTAMPTZ | YES      | -       | Scheduled publish time          |
| `created_at`     | TIMESTAMPTZ | YES      | NOW()   | Creation timestamp              |
| `updated_at`     | TIMESTAMPTZ | YES      | NOW()   | Update timestamp                |

### Indexes

- `idx_trivia_sets_status` - Status filtering
- `idx_trivia_sets_published_at` - Published items
- `idx_trivia_sets_theme` - Theme filtering
- `idx_trivia_sets_category` - Category filtering
- `idx_trivia_sets_slug` - Slug lookup (unique)
- `idx_trivia_sets_created_at` - Recent items

### Constraints

- `trivia_sets_slug_unique` - UNIQUE constraint on slug

---

## 📋 Question Data Structure (JSONB)

The `question_data` column stores an array of question objects:

```typescript
interface TriviaQuestionData {
  question_text: string;
  question_type: "multiple-choice" | "true-false" | "who-am-i";
  correct_answer: string;
  wrong_answers: string[];
  explanation?: string;
  tags?: string[];
  // Optional Process Builder fields
  question_id?: string; // Unique ID for this instance
  source_id?: number; // Reference to source question
  difficulty?: number; // Numeric difficulty (1-5)
  points?: number; // Points value
  time_limit?: number; // Time limit in seconds
}
```

---

## ✅ TypeScript Types Updated

**File:** `lib/supabase.ts`

- ✅ `id: number` (was `string`, now matches BIGSERIAL)
- ✅ Added `published_at?: string`
- ✅ Added `scheduled_for?: string`
- ✅ Added optional Process Builder fields to `TriviaQuestionData`

**File:** `process-builders/build-trivia-set/lib/types/index.ts`

- ✅ Updated to match SQL schema
- ✅ `id: number` (matches BIGSERIAL)

---

## 🔧 Migration Script

**File:** `sql/30-verify-trivia-sets-for-process-builder.sql`

Run this to:

1. Ensure slug is unique
2. Create missing indexes
3. Verify table structure

---

## ✅ Verification Checklist

- [x] Table structure matches Process Builder needs
- [x] TypeScript types aligned with SQL schema
- [x] Slug has unique constraint
- [x] All indexes created
- [x] Question data structure documented
- [x] Process Builder types updated

---

## 🎯 Ready for Process Builder

The `trivia_sets` table is now verified and ready for Process Builder to use.

**Next Steps:**

1. ✅ Table structure verified
2. ⏭️ Create UI component
3. ⏭️ Implement task logic
