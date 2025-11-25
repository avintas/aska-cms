# Sourcing Node: Simultaneous Ingestion & Generation Architecture

**Version:** 1.0  
**Date:** 2025-01-21  
**Status:** Design Document

---

## Executive Summary

This document outlines the architectural design for evolving the Source Ingestion Process from a manual, sequential workflow to a **Simultaneous Ingestion & Generation** model. The proposed system integrates Gemini API-driven content generation directly into the ingestion pipeline, enabling users to generate derivative content types (Trivia Questions, Wisdom/Quotes, Facts, Greetings) immediately upon source ingestion.

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Proposed Architecture](#proposed-architecture)
3. [Feasibility Analysis](#feasibility-analysis)
4. [Design Decisions](#design-decisions)
5. [Data Flow & Pipeline](#data-flow--pipeline)
6. [Implementation Considerations](#implementation-considerations)
7. [Risk Assessment](#risk-assessment)
8. [Future Enhancements](#future-enhancements)

---

## Current Architecture

### Workflow Overview

The current system operates in **two distinct phases**:

#### Phase 1: Source Ingestion
1. User pastes content into source window (`/sourcing`)
2. Content is normalized via `processText()`
3. Two sequential Gemini API calls:
   - **Metadata Extraction**: Extracts theme, tags, category, summary
   - **Content Enrichment**: Generates title and key phrases
4. Source saved to `source_content_ingested` table with `ingestion_status: 'complete'`
5. User manually navigates to Main Generator workspace

#### Phase 2: Content Generation (Separate)
1. User selects a source from Main Generator
2. User selects a content type (track) to generate
3. System calls `generateContentAction()` which:
   - Resolves context (track, prompt, source)
   - Calls Gemini API via track-specific adapter
   - Normalizes and validates generated items
   - Inserts into appropriate table (`collection_*` or `trivia_*`)
   - Updates `used_for` array on source record

### Current Limitations

- **Manual Workflow**: Requires user to switch contexts between ingestion and generation
- **Sequential Processing**: Content generation happens separately, often hours or days later
- **No Batch Automation**: Each content type must be generated individually
- **Context Switching**: User must remember which sources need which content types

---

## Proposed Architecture

### High-Level Vision

Transform the ingestion pipeline into a **Sourcing Node** that can optionally generate derivative content immediately upon ingestion, based on user-selected preferences.

### Core Components

#### 1. **Ingestion Pipeline** (Enhanced)
- Accepts source content + generation preferences
- Performs existing normalization and metadata extraction
- Conditionally triggers content generation workflows
- Returns comprehensive ingestion + generation results

#### 2. **Generation Orchestrator**
- Manages parallel/serial execution of multiple content type generations
- Handles API rate limiting and error recovery
- Tracks generation status per content type
- Updates database atomically

#### 3. **UI Selectors** (New)
- Toggle switches for each content type:
  - Trivia Questions (Multiple Choice, True/False, Who Am I)
  - Wisdom/Quotes
  - Facts
  - Greetings
  - Stats
  - Motivational
- Mode selector: Manual vs. Automated

#### 4. **Background Processing Engine** (New)
- Handles asynchronous generation in automated mode
- Manages job queue and status tracking
- Provides progress updates to UI

---

## Feasibility Analysis

### Complexity Assessment

#### **Low Complexity** ✅
- **UI Components**: Standard React toggles/switches - straightforward implementation
- **API Integration**: Existing Gemini adapters can be reused - no new API patterns needed
- **Database Updates**: Current `used_for` tracking mechanism already supports this workflow

#### **Medium Complexity** ⚠️
- **Orchestration Logic**: Coordinating multiple API calls with proper error handling
- **State Management**: Tracking partial success/failure across multiple content types
- **Rate Limiting**: Managing Gemini API quotas when generating multiple types simultaneously

#### **High Complexity** 🔴
- **Background Jobs**: Requires job queue system (e.g., BullMQ, Inngest) if true async processing needed
- **Transaction Management**: Ensuring atomicity when updating source + multiple content tables
- **Error Recovery**: Handling partial failures gracefully (e.g., 3 of 4 content types succeed)

### Workload Comparison

#### **Immediate API Calls (Synchronous)**
**Pros:**
- Simpler implementation - no job queue needed
- Immediate feedback to user
- Easier error handling (all-or-nothing)
- No additional infrastructure

**Cons:**
- Higher latency (user waits for all generations)
- Risk of timeout on long-running requests
- Blocks user interaction during processing
- Higher memory usage (holding all results in memory)

**Estimated Latency:**
- Single content type: ~10-30 seconds
- 4 content types (sequential): ~40-120 seconds
- 4 content types (parallel): ~30-60 seconds (with rate limiting)

#### **Background Job (Asynchronous)**
**Pros:**
- Better UX - user can continue working
- More resilient to failures
- Can retry failed generations
- Scales better under load

**Cons:**
- Requires job queue infrastructure
- More complex error handling
- Need progress tracking mechanism
- Additional operational overhead

**Estimated Implementation Time:**
- Synchronous approach: 2-3 days
- Asynchronous approach: 5-7 days (includes queue setup)

### Recommendation

**Start with Synchronous Approach** for MVP:
- Faster to implement and validate
- Simpler debugging and error handling
- Can evolve to async later if needed
- User can see immediate results

**Migrate to Async** if:
- Users frequently generate 4+ content types simultaneously
- Timeout issues occur regularly
- Need to support batch ingestion workflows

---

## Design Decisions

### Decision 1: Manual vs. Automated Mode

#### **Manual Mode**
- User selects content types via UI toggles
- User clicks "Ingest & Generate" button
- System executes ingestion + selected generations synchronously
- User sees progress and results immediately

**Use Case:** User wants control over what gets generated, can wait for results

#### **Automated Mode**
- User selects content types via UI toggles
- User clicks "Ingest" button
- System saves source immediately
- System triggers background generation jobs for selected types
- User receives notifications/updates as generations complete

**Use Case:** User wants to ingest quickly and let system generate in background

### Decision 2: Generation Execution Strategy

#### **Option A: Sequential Execution**
- Generate content types one-by-one
- Simpler error handling
- Lower API rate limit risk
- Longer total time

#### **Option B: Parallel Execution**
- Generate all selected types simultaneously
- Faster total time
- Higher API rate limit risk
- More complex error handling

#### **Option C: Hybrid (Recommended)**
- Group by priority/type
- Execute collection types (facts, wisdom, etc.) in parallel
- Execute trivia types sequentially (they're more complex)
- Use semaphore to limit concurrent API calls (max 2-3)

### Decision 3: Error Handling Strategy

#### **Partial Success Handling**
- If source ingestion succeeds but generation fails:
  - Source is still saved (ingestion succeeded)
  - `used_for` array reflects only successful generations
  - Error details returned to user
  - User can retry failed generations later

#### **Transaction Boundaries**
- **Source Ingestion**: Single transaction (atomic)
- **Each Content Type Generation**: Independent transaction
- **No Cross-Type Transactions**: If trivia generation fails, facts generation still succeeds

**Rationale:** Prevents one failure from blocking all content generation

### Decision 4: Database Update Strategy

#### **Current Pattern** (Maintain)
```typescript
// After successful generation:
await updateSourceUsage(sourceId, 'fact'); // Adds 'fact' to used_for array
```

#### **Enhanced Pattern** (Proposed)
```typescript
// After ingestion + all generations:
const successfulTypes = ['fact', 'wisdom', 'multiple-choice'];
await updateSourceUsageBatch(sourceId, successfulTypes);
```

**Benefits:**
- Single database update instead of multiple
- Atomic update of `used_for` array
- Clearer audit trail

---

## Data Flow & Pipeline

### Manual Mode Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Action: Paste Content + Select Content Types         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Content Normalization                              │
│ - processText(rawContent)                                  │
│ - Returns: processedText, wordCount, charCount              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Metadata Extraction (Gemini API Call #1)          │
│ - extractMetadata(processedText, extractionPrompt)           │
│ - Returns: theme, tags, category, summary                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Content Enrichment (Gemini API Call #2)           │
│ - enrichContent(processedText, enrichmentPrompt)            │
│ - Returns: title, key_phrases                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Save Source to Database                           │
│ - INSERT into source_content_ingested                     │
│ - ingestion_status: 'complete'                              │
│ - Returns: sourceId                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Content Generation (If Selected)                  │
│                                                             │
│  ┌──────────────────────────────────────────┐              │
│  │ For each selected content type:          │              │
│  │  1. Resolve context (track, prompt)      │              │
│  │  2. Call Gemini API via adapter          │              │
│  │  3. Normalize & validate items           │              │
│  │  4. INSERT into content table            │              │
│  │  5. Track success in results array       │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  Execution: Hybrid (parallel collections, serial trivia)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Update Source Usage Tracking                      │
│ - updateSourceUsageBatch(sourceId, successfulTypes)        │
│ - Updates used_for array                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Return Comprehensive Results                      │
│ - Source ingestion status                                  │
│ - Per-content-type generation results                      │
│ - Error details (if any)                                   │
│ - Generated item counts                                    │
└─────────────────────────────────────────────────────────────┘
```

### Automated Mode Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Action: Paste Content + Select Content Types          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Steps 1-4: Ingestion Pipeline (Same as Manual)            │
│ - Normalization                                             │
│ - Metadata Extraction                                       │
│ - Content Enrichment                                        │
│ - Save Source                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Immediate Response to User                         │
│ - Return ingestion success                                  │
│ - Show "Generating content..." status                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Queue Background Generation Jobs                  │
│ - Create job for each selected content type                │
│ - Jobs execute asynchronously                               │
│ - Update source.used_for as each completes                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Progress Updates (WebSocket/SSE/Polling)          │
│ - Notify user as each generation completes                 │
│ - Show success/failure per content type                    │
└─────────────────────────────────────────────────────────────┘
```

### Trivia Generation Sequence (Steps 1-4)

For trivia content types, the generation follows a specific sequence:

1. **Question Extraction**: Gemini extracts potential questions from source
2. **Question Generation**: Gemini generates formatted questions with answers
3. **Normalization**: System normalizes to expected schema (multiple-choice options, true/false statements, who-am-i clues)
4. **Validation & Persistence**: Validate against schema, then INSERT into `trivia_*` tables

**Note:** This sequence is handled internally by each trivia adapter (`generateMultipleChoice`, `generateTrueFalse`, `generateWhoAmI`). The orchestrator simply calls these adapters in the correct order.

---

## Implementation Considerations

### API Rate Limiting

**Gemini API Limits:**
- Requests per minute: Varies by tier
- Concurrent requests: Limited
- Token limits: Per request

**Mitigation Strategies:**
1. **Semaphore Pattern**: Limit concurrent API calls (max 2-3)
2. **Exponential Backoff**: Retry failed requests with delays
3. **Request Queuing**: Queue requests if rate limit hit
4. **User Feedback**: Show "Rate limited, please wait" message

### Database Transaction Management

**Challenge:** Multiple tables updated (source + N content tables)

**Solution:**
- Use database transactions per content type
- Don't wrap all generations in single transaction (too long-lived)
- If source save fails, don't generate content
- If generation fails, source still saved (can retry later)

### Error Recovery

**Scenarios:**

1. **Source Ingestion Fails**
   - Don't proceed with generation
   - Return error to user
   - User can retry

2. **Some Generations Fail**
   - Source is saved
   - Successful generations are persisted
   - Failed generations logged with error details
   - User can retry failed types via Main Generator

3. **All Generations Fail**
   - Source is saved
   - Return error summary
   - User can retry via Main Generator

### User Experience Considerations

#### **Loading States**
- Show progress indicator during ingestion
- Show per-content-type progress during generation
- Display estimated time remaining

#### **Results Display**
- Success summary: "Generated 15 facts, 8 wisdom quotes, 12 trivia questions"
- Failure details: "Failed to generate greetings: API timeout"
- Link to view generated content

#### **Timeout Handling**
- Set reasonable timeout (60-90 seconds for synchronous)
- If timeout occurs, save what succeeded, return partial results
- Provide option to retry failed generations

---

## Pros & Cons Analysis

### Pros ✅

#### **User Experience**
- **Reduced Friction**: One-step process instead of two
- **Immediate Results**: See generated content right away (manual mode)
- **Flexibility**: Choose which content types to generate
- **Context Preservation**: Generate while source content is fresh in mind

#### **Operational**
- **Faster Workflow**: No need to switch between pages
- **Better Tracking**: All generation happens in one place
- **Reduced Errors**: Less chance of forgetting to generate content types

#### **Technical**
- **Code Reuse**: Leverage existing generation adapters
- **Consistent Patterns**: Same generation logic, different trigger point
- **Better Observability**: Single pipeline to monitor

### Cons ⚠️

#### **User Experience**
- **Latency**: User must wait for all generations (synchronous mode)
- **Complexity**: More options may confuse some users
- **Error Overload**: Multiple failures can be overwhelming

#### **Operational**
- **API Costs**: More API calls per ingestion session
- **Rate Limiting**: Higher risk of hitting API limits
- **Resource Usage**: Higher memory/CPU during generation

#### **Technical**
- **Complexity**: More moving parts in ingestion pipeline
- **Error Handling**: More failure scenarios to handle
- **Testing**: More test cases needed (combinations of content types)

### Mitigation Strategies

1. **Latency**: Use hybrid parallel execution, show progress indicators
2. **Complexity**: Provide sensible defaults, hide advanced options
3. **API Costs**: Allow users to disable auto-generation, use caching where possible
4. **Rate Limiting**: Implement semaphore, queue requests
5. **Error Handling**: Comprehensive error messages, retry mechanisms

---

## Automation: Handling the Generation Sequence

### The "1, 2, 3, 4" Sequence Explained

For trivia content types, the generation involves multiple steps:

1. **Extract**: Identify question-worthy content from source
2. **Generate**: Create formatted questions with answers
3. **Normalize**: Transform to expected database schema
4. **Persist**: Validate and INSERT into database

### Ensuring Correct Database Updates

#### **Atomicity Per Content Type**
- Each content type generation is atomic
- If normalization fails, no partial data inserted
- If validation fails, no invalid data inserted

#### **Source Tracking Updates**
- Update `used_for` array only after successful INSERT
- Use batch update to update all successful types at once
- If update fails, log error but don't rollback content (already persisted)

#### **Error State Management**
```typescript
interface GenerationResult {
  contentType: ContentType;
  success: boolean;
  itemCount?: number;
  error?: string;
  skippedItems?: number;
}

interface IngestionResult {
  sourceId: number;
  ingestionSuccess: boolean;
  generationResults: GenerationResult[];
  partialSuccess: boolean; // true if some generations failed
}
```

### Timely Database Updates

#### **Synchronous Mode**
- Updates happen immediately after each generation
- User sees results in real-time
- Database is consistent throughout process

#### **Asynchronous Mode**
- Updates happen as each background job completes
- Use database transactions per job
- Implement idempotency (don't duplicate if job retries)

### Ensuring Data Integrity

1. **Source Must Exist**: Don't generate content if source save failed
2. **Validation Before Insert**: Validate all items before database INSERT
3. **Rollback on Critical Failures**: If source save fails, don't proceed
4. **Partial Success Handling**: Save what succeeded, report what failed
5. **Idempotency**: Don't duplicate content if generation retries

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| API Rate Limiting | Medium | High | Implement semaphore, queue requests |
| Timeout on Long Content | Medium | Medium | Set reasonable timeouts, use async mode |
| Partial Failure Confusion | Low | Medium | Clear error messages, retry mechanisms |
| Database Deadlocks | Low | High | Use proper transaction isolation |
| Memory Exhaustion | Low | High | Stream processing, limit batch sizes |

### User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Long Wait Times | High | Medium | Progress indicators, async mode option |
| Error Overload | Medium | Low | Group errors, show summary |
| Confusion About Options | Medium | Low | Sensible defaults, tooltips, docs |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Increased API Costs | High | Medium | User controls, cost monitoring |
| Higher Server Load | Medium | Medium | Rate limiting, async processing |
| More Support Requests | Low | Low | Clear error messages, documentation |

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Smart Defaults**: AI suggests which content types to generate based on source content
2. **Batch Ingestion**: Ingest multiple sources with same generation preferences
3. **Generation Templates**: Save common generation preferences as templates
4. **Scheduled Generation**: Schedule generation for off-peak hours
5. **Generation Analytics**: Track which content types are most successful per source type

### Phase 3: Optimization

1. **Caching**: Cache similar source content to avoid redundant API calls
2. **Parallel Processing**: True parallel execution with proper rate limiting
3. **Incremental Generation**: Generate content types incrementally as user needs them
4. **A/B Testing**: Test different generation strategies to optimize quality

### Phase 4: Intelligence

1. **Content Quality Scoring**: Rate generated content quality, suggest improvements
2. **Source Analysis**: Analyze source to predict best content types
3. **Auto-Optimization**: System learns which content types work best for which sources

---

## Conclusion

The **Simultaneous Ingestion & Generation** model represents a significant evolution of the sourcing workflow, moving from a manual, two-phase process to an integrated, user-controlled pipeline. The architecture balances user experience improvements with technical feasibility, starting with a synchronous approach that can evolve to asynchronous processing as needed.

**Key Takeaways:**
- ✅ Feasible with existing infrastructure
- ✅ Significant UX improvement
- ⚠️ Requires careful error handling and rate limiting
- 🔄 Can start simple and evolve based on user feedback

**Recommended Implementation Path:**
1. **MVP**: Synchronous manual mode with 2-3 content types
2. **Iterate**: Add remaining content types, improve error handling
3. **Enhance**: Add automated/async mode if user demand exists
4. **Optimize**: Add smart defaults, analytics, quality scoring

---

## Appendix

### Related Documents
- `docs/publishing/BATCH_GENERATE_FACTS.md` - Current batch generation pattern
- `src/app/sourcing/actions.ts` - Current ingestion pipeline
- `src/app/main-generator/actions.ts` - Current generation logic

### Key Files to Modify
- `src/app/sourcing/page.tsx` - Add UI selectors
- `src/app/sourcing/actions.ts` - Enhance ingestion pipeline
- `src/app/main-generator/actions.ts` - Extract reusable generation logic
- `src/shared/types/content.ts` - Add generation preference types

### Database Schema
- `source_content_ingested` - Source table (existing)
- `collection_*` - Collection content tables (existing)
- `trivia_*` - Trivia content tables (existing)
- No schema changes required for MVP

---

**Document Status:** Ready for Review  
**Next Steps:** Technical specification, UI mockups, implementation planning

