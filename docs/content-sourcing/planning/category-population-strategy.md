# Category Population Strategy for Trivia Multiple Choice

## Problem

The `trivia_multiple_choice` table has many records with `category = NULL`. We need to populate these categories based on available data.

## Available Data Sources

1. **Theme** - Required field, one of 5 standardized themes
2. **Tags** - Array of keywords/topics
3. **Question Text** - The actual question content
4. **Source Content ID** - Link to `source_content_ingested` table (if available)
5. **Explanation** - May contain context clues

## Category Assignment Strategy (Hybrid Approach)

### Phase 1: Source Content Inheritance (Most Reliable)

**If `source_content_id` exists:**

- Look up category from `source_content_ingested` table
- Inherit category directly from source content
- **Rationale:** Source content already has AI-extracted categories

### Phase 2: Rule-Based Pattern Matching (Fast & Efficient)

**Use tags and question_text patterns:**

- Create keyword mappings for each category
- Match tags/question text against patterns
- **Rationale:** Many questions have clear indicators in tags

### Phase 3: AI-Powered Assignment (For Remaining Records)

**Use Gemini API for complex cases:**

- Analyze question_text, theme, and tags
- AI determines appropriate category from standardized list
- **Rationale:** Handles edge cases and nuanced content

## Implementation Plan

### Step 1: Source Content Lookup

```sql
UPDATE trivia_multiple_choice tmc
SET category = sci.category
FROM source_content_ingested sci
WHERE tmc.source_content_id = sci.id
  AND tmc.category IS NULL
  AND sci.category IS NOT NULL;
```

### Step 2: Rule-Based Pattern Matching

Create keyword patterns for each category:

**Theme: "Players"**

- "Player Spotlight": tags contain player names, "player", "career"
- "Sharpshooters": tags contain "goal", "scoring", "shooter", "points"
- "Net Minders": tags contain "goalie", "goalkeeper", "save", "shutout"
- "Icons": tags contain "legend", "hall of fame", "retired", "career"
- "Captains": tags contain "captain", "leadership", "C"
- "Hockey is Family": tags contain "family", "sibling", "brother", "sister"

**Theme: "Teams & Organizations"**

- "Stanley Cup Playoffs": tags contain "playoff", "stanley cup", "postseason"
- "NHL Draft": tags contain "draft", "pick", "prospect", "rookie"
- "Free Agency": tags contain "free agency", "signing", "contract"
- "Game Day": tags contain "game", "match", "regular season"
- "Hockey Nations": tags contain country names, "international", "world"
- "All-Star Game": tags contain "all-star", "all star", "allstar"
- "Heritage Classic": tags contain "heritage classic", "outdoor"

**Theme: "Awards & Honors"**

- "NHL Awards": tags contain award names ("hart", "norris", "vezina", "calder")
- "Milestones": tags contain "milestone", "record", "achievement", "first"

**Theme: "Leadership & Staff"**

- "Coaching": tags contain "coach", "coaching", "head coach"
- "Management": tags contain "gm", "general manager", "management"
- "Front Office": tags contain "front office", "executive", "president"

### Step 3: AI-Powered Assignment

For records still without category:

- Use Gemini API to analyze question_text + theme + tags
- Request category assignment from standardized list
- Batch process in chunks to avoid rate limits

## Recommended Approach

**Start with Phase 1 (Source Content Lookup)** - This will handle most cases if questions were generated from ingested content.

**Then Phase 2 (Rule-Based)** - Fast pattern matching for remaining records.

**Finally Phase 3 (AI)** - Only for records that don't match patterns.

## Migration Script Structure

1. **Verification queries** - Count records by phase
2. **Phase 1 execution** - Source content lookup
3. **Phase 2 execution** - Pattern matching
4. **Phase 3 preparation** - Identify remaining records for AI
5. **Verification** - Final counts and sample review
