# Trivia Sets Strategy - High-Level Architecture

## The Problem

OnlyHockey needs **curated, playable trivia sets** - not just individual questions. Users need structured game experiences worth playing.

## Strategy Overview

### 1. Acquisition (Where Questions Come From)

- **AI Generation:** Gemini generates questions from source content (stats, wisdom, stories)
- **Source Content:** Questions originate from Tango's content library (source library)
- **Three Types:** Multiple-choice, True/False, Who Am I
- **Status:** All start as `draft` in individual question tables

### 2. Production (Questions → Playable Sets)

- **Curate:** Select questions from draft pool
- **Assemble:** Group questions into themed sets (e.g., "NHL Legends", "Stanley Cup History")
- **Structure:** Each set has title, description, theme, difficulty, question count
- **Quality Control:** Review/approve before publishing
- **Storage:** Sets stored in `trivia_sets` table referencing individual questions

### 3. Maintenance (Keeping Sets Fresh)

- **Rotate:** Periodically refresh sets with new questions
- **Archive:** Remove outdated or low-performing sets
- **Update:** Add new questions to existing sets
- **Monitor:** Track set performance (completion rates, engagement)

### 4. Publishing (OnlyHockey Consumption)

- **API Endpoint:** `/api/public/trivia-sets` - Returns complete, playable sets
- **Format:** Each set includes all questions with answers (for game play)
- **Filtering:** By theme, difficulty, category
- **Status:** Only published sets visible to OnlyHockey

## Key Architecture Decision

**Sets vs. Individual Questions:**

- Individual questions = raw material (in draft tables)
- Trivia sets = finished product (curated, playable games)
- OnlyHockey consumes sets, not individual questions
- Sets provide structure, context, and complete game experience

## Flow Summary

```
Source Content → AI Generation → Individual Questions (draft)
→ Curation → Trivia Sets (published) → OnlyHockey API → User Plays
```
