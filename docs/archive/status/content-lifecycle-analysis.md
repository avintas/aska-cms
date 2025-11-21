# Content Lifecycle Analysis & Issues

## Current Content Flow

### 1. **Content Ingestion** (`ingested` table)

- **Source**: Raw content saved via `/cms/sourcing` page
- **Storage**: `ingested` table
- **Fields**: `id`, `content`, `title`, `status`, `created_at`, etc.
- **Purpose**: Store raw source material before processing

### 2. **Question Generation** (AI + Parsing)

- **Process**:
  - User selects source content from library
  - Uses prompts from `/cms/prompts/create`
  - Calls Gemini AI to generate questions
  - Parses markdown format (e.g., `**Theme:**`, `**Tags:**`)
- **Output**: Parsed questions with optional `theme` and `tags` from markdown

### 3. **Question Storage** (`trivia_multiple_choice`, `trivia_true_false`, `trivia_who_am_i`)

- **Fields**: `question_text`, `correct_answer`, `wrong_answers`, `theme`, `tags`, `source_content_id`
- **Problem**: `theme` and `tags` are **optional** and often **NULL**
- **Why**: Only populated if AI-generated markdown includes `**Theme:**` or `**Tags:**` lines

### 4. **Trivia Set Creation** (Process Builder)

- **Input**: User enters theme (e.g., "Winnipeg Jets")
- **Query**: Searches `theme` column, `question_text`, and `tags` array
- **Problem**: If `theme` is NULL, relies on fuzzy text matching in `question_text`

## The Core Problem

### Issue 1: **Inconsistent Metadata Assignment**

- `theme` and `tags` are only populated if:
  1. AI prompt explicitly asks for them
  2. AI includes them in markdown output
  3. Parser successfully extracts them
- **Result**: Many questions have `theme = NULL` and `tags = []`

### Issue 2: **Weak Theme Matching**

- Process Builder searches:
  - `theme` column (often NULL)
  - `question_text` (fuzzy keyword match)
  - `tags` array (often empty)
- **Result**: Unreliable matching, especially for specific themes like "Winnipeg Jets"

### Issue 3: **No Source Content Context**

- Questions have `source_content_id` but:
  - Source content's theme/topic isn't inherited
  - No automatic metadata propagation
  - Manual theme assignment required

### Issue 4: **Disconnected Workflows**

- **Sourcing** → Raw content (no structured metadata)
- **Prompt Creation** → Prompts (may or may not request theme/tags)
- **Question Generation** → Questions (may or may not have theme/tags)
- **Process Builder** → Expects reliable theme matching

## What Needs to Happen

### Option A: **Enforce Metadata at Generation**

- Update prompts to **always** request `**Theme:**` and `**Tags:**`
- Make parser **require** these fields (or fail gracefully)
- Auto-populate from source content if missing

### Option B: **Inherit from Source Content**

- Extract theme/tags from `ingested` content
- Auto-assign to questions during save
- Use source content metadata as fallback

### Option C: **Post-Processing Enhancement**

- Run analysis on `question_text` to extract themes
- Use NLP/keyword extraction to populate missing metadata
- Batch update existing questions

### Option D: **Structured Metadata at Ingestion**

- Add `theme`, `tags`, `category` fields to `ingested` table
- Require metadata when saving source content
- Propagate to questions during generation

## Recommended Approach

**Hybrid: Option B + Option D**

1. **Enhance Source Content** (`ingested` table):
   - Add `theme`, `tags`, `category` fields
   - Require metadata when saving (or auto-extract)
   - This becomes the "source of truth"

2. **Inherit During Generation**:
   - When generating questions from source content:
     - Use source content's `theme` if question doesn't have one
     - Merge source content's `tags` with question's tags
     - Set `category` from source content

3. **Update Process Builder**:
   - Prioritize `theme` column matching (most reliable)
   - Fall back to source content's theme via `source_content_id`
   - Then fall back to `question_text` keyword matching

4. **Backfill Existing Data**:
   - Analyze existing questions
   - Extract themes from `question_text` or `source_content_id`
   - Populate missing metadata

## Next Steps

1. **Audit Current Data**:
   - How many questions have `theme = NULL`?
   - How many have `tags = []`?
   - What's the distribution of `source_content_id`?

2. **Decide on Metadata Strategy**:
   - Where should theme/tags be assigned?
   - Who is responsible (user, AI, system)?
   - What's the fallback strategy?

3. **Update Workflows**:
   - Enhance source content ingestion
   - Update question generation to inherit metadata
   - Improve Process Builder matching logic

4. **Test & Validate**:
   - Test theme matching with real data
   - Verify Process Builder finds correct questions
   - Measure improvement in match quality
