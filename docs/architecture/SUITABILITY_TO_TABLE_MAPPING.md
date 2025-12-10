# Suitability Analysis → Content Type → Table Mapping

## Overview
This document maps the suitability analysis content types to their corresponding generator trackKeys and database tables where results are stored.

## Suitability Analysis Content Types

The `suitability_analysis` JSONB field contains analysis for these content types:
1. `multiple_choice_trivia`
2. `true_false_trivia`
3. `motivational`
4. `facts`
5. `wisdom`

## Complete Mapping

| Suitability Key | Generator TrackKey | Target Table | Notes |
|----------------|-------------------|--------------|-------|
| `multiple_choice_trivia` | `trivia_multiple_choice` | `trivia_multiple_choice` | Trivia table |
| `true_false_trivia` | `trivia_true_false` | `trivia_true_false` | Trivia table |
| `who_am_i_trivia` | `trivia_who_am_i` | `trivia_who_am_i` | Trivia table |
| `motivational` | `motivational` | `collection_hockey_motivate` | Hockey motivational table |
| `facts` | `facts` | `collection_hockey_facts` | Hockey facts table |
| `wisdom` | `wisdom` | `collection_hockey_wisdom` | Hockey wisdom table |

## Additional Tables (Special Routes)

These tables exist but are NOT part of the main generator tracks. They're used by specialized generation routes:

| Table Name | Used By | Content Type | Notes |
|-----------|---------|--------------|-------|
| `collection_hockey_facts` | F-Gen route (`/f-gen`) | `facts` | Hockey-specific facts |
| `collection_hockey_wisdom` | W-Gen route (`/w-gen`) | `wisdom` | Penalty Box Philosopher wisdom |
| `collection_hockey_motivate` | Bench Gen (`/bench-gen`), Captain Heart (`/captain-heart-gen`), M-Gen (`/main-generator`) | `motivational` | Character-specific motivational (uses `attribution` field) |
| `collection_greetings` | Main Generator | `greetings` | H.U.G.s (Hockey Universal Greetings) |
| `collection_stats` | Stats route | `stat` | Statistics content |

**Note:** `greetings` is NOT included in suitability analysis, so it won't be processed via multi-type processing.

## Suitability Analysis Structure

```typescript
interface ContentSuitabilityAnalysis {
  multiple_choice_trivia?: {
    suitable: boolean;      // true/false
    confidence: number;      // 0.0 to 1.0 (0% to 100%)
    reasoning: string;      // Explanation
  };
  true_false_trivia?: {
    suitable: boolean;
    confidence: number;
    reasoning: string;
  };
  who_am_i_trivia?: {
    suitable: boolean;
    confidence: number;
    reasoning: string;
  };
  motivational?: {
    suitable: boolean;
    confidence: number;
    reasoning: string;
  };
  facts?: {
    suitable: boolean;
    confidence: number;
    reasoning: string;
  };
  wisdom?: {
    suitable: boolean;
    confidence: number;
    reasoning: string;
  };
}
```

## Cut-off Criteria

**Default:** `suitable === true AND confidence >= 0.7` (70%)

This means a content type will be processed if:
- Gemini marked it as `suitable: true`
- AND confidence score is 70% or higher

## Processing Logic

For multi-type processing of one source:

```typescript
// Example: Process source ID 123 for all suitable content types
const sourceId = 123;

// Query suitability_analysis
const analysis = source.suitability_analysis;

// Process each suitable content type
if (analysis.multiple_choice_trivia?.suitable === true && 
    analysis.multiple_choice_trivia?.confidence >= 0.7) {
  await generateContentAction({
    trackKey: 'trivia_multiple_choice',
    sourceId: 123
  });
  // Results saved to: trivia_multiple_choice table
}

if (analysis.true_false_trivia?.suitable === true && 
    analysis.true_false_trivia?.confidence >= 0.7) {
  await generateContentAction({
    trackKey: 'trivia_true_false',
    sourceId: 123
  });
  // Results saved to: trivia_true_false table
}

if (analysis.who_am_i_trivia?.suitable === true && 
    analysis.who_am_i_trivia?.confidence >= 0.7) {
  await generateContentAction({
    trackKey: 'trivia_who_am_i',
    sourceId: 123
  });
  // Results saved to: trivia_who_am_i table
}

if (analysis.motivational?.suitable === true && 
    analysis.motivational?.confidence >= 0.7) {
  await generateContentAction({
    trackKey: 'motivational',
    sourceId: 123
  });
  // Results saved to: collection_hockey_motivate table
}

if (analysis.facts?.suitable === true && 
    analysis.facts?.confidence >= 0.7) {
  await generateContentAction({
    trackKey: 'facts',
    sourceId: 123
  });
  // Results saved to: collection_hockey_facts table
}

if (analysis.wisdom?.suitable === true && 
    analysis.wisdom?.confidence >= 0.7) {
  await generateContentAction({
    trackKey: 'wisdom',
    sourceId: 123
  });
  // Results saved to: collection_hockey_wisdom table
}
```

## Summary

**Main Generator Tracks (via suitability analysis):**
- ✅ `multiple_choice_trivia` → `trivia_multiple_choice` table
- ✅ `true_false_trivia` → `trivia_true_false` table
- ✅ `who_am_i_trivia` → `trivia_who_am_i` table
- ✅ `motivational` → `collection_hockey_motivate` table
- ✅ `facts` → `collection_hockey_facts` table
- ✅ `wisdom` → `collection_hockey_wisdom` table

**Special Routes (NOT via suitability analysis):**
- `collection_hockey_facts` - F-Gen route
- `collection_hockey_wisdom` - W-Gen route
- `collection_hockey_motivate` - Bench Boss, Captain Heart, M-Gen routes
- `collection_greetings` - Main Generator (not in suitability analysis)
- `collection_stats` - Stats route (not in suitability analysis)

