# Content Suitability Analysis - Implementation Plan

## Overview
Add content suitability analysis to the sourcing workflow to determine if ingested content is suitable for generating various content types (multiple-choice trivia, true/false trivia, motivational content, etc.).

**Storage Approach:** Option 1 - Store analysis results in `source_content_ingested` table using JSON field

---

## Phase 1: Database Schema Changes

### 1.1 Update `source_content_ingested` Table
- **Action:** Add/modify `metadata` JSONB column to include `suitability_analysis` object
- **Structure:**
  ```json
  {
    "key_phrases": [...],
    "suitability_analysis": {
      "multiple_choice_trivia": {
        "suitable": true,
        "confidence": 0.85,
        "reasoning": "Content contains factual information suitable for multiple choice questions..."
      },
      "true_false_trivia": {
        "suitable": true,
        "confidence": 0.90,
        "reasoning": "Content has clear true/false statements..."
      },
      "motivational": {
        "suitable": false,
        "confidence": 0.30,
        "reasoning": "Content is factual rather than inspirational..."
      },
      "facts": {
        "suitable": true,
        "confidence": 0.95,
        "reasoning": "Content contains numerical data and verifiable hockey facts..."
      },
      "wisdom": {
        "suitable": false,
        "confidence": 0.25,
        "reasoning": "Content lacks philosophical depth or reflective insights..."
      },
      "analyzed_at": "2024-01-15T10:30:00Z",
      "analysis_version": "1.0"
    }
  }
  ```
- **Note:** No migration needed if `metadata` column already exists as JSONB (can be updated)

---

## Phase 2: Backend/Server Actions

### 2.1 Add New Prompt Type
- **File:** `src/lib/prompts/repository.ts`
- **Action:** Add `'content_suitability_analysis'` to `PromptType` union type
- **Purpose:** Allow admins to configure analysis prompts in Prompts Library

### 2.2 Create Analysis Adapter Function
- **File:** `src/lib/sourcing/adapters.ts` (or create new file)
- **Function:** `analyzeContentSuitability(contentText: string, prompt: string)`
- **Returns:**
  ```typescript
  {
    success: boolean;
    error?: string;
    data?: {
      multiple_choice_trivia: { suitable: boolean; confidence: number; reasoning: string };
      true_false_trivia: { suitable: boolean; confidence: number; reasoning: string };
      motivational: { suitable: boolean; confidence: number; reasoning: string };
      facts: { suitable: boolean; confidence: number; reasoning: string };
      wisdom: { suitable: boolean; confidence: number; reasoning: string };
      // Future: greeting, stat, who_am_i_trivia
    };
  }
  ```
- **Implementation:** Similar to `extractMetadata` - call Gemini API with structured output

### 2.3 Update Ingestion Pipeline
- **File:** `src/app/sourcing/actions.ts`
- **Changes:**
  1. Load analysis prompt: `await getActivePromptByType('content_suitability_analysis')`
  2. After metadata extraction and enrichment, call `analyzeContentSuitability()`
  3. Add analysis results to `insertPayload.metadata.suitability_analysis`
  4. Update `IngestState` interface to include `suitabilityAnalysis` in metadata
- **Error Handling:** If analysis fails, log error but don't fail ingestion (make it optional/non-blocking)

### 2.4 Update Type Definitions
- **File:** `src/app/sourcing/actions.ts`
- **Action:** Extend `IngestState.metadata` interface to include:
  ```typescript
  suitabilityAnalysis?: {
    [contentType: string]: {
      suitable: boolean;
      confidence: number;
      reasoning: string;
    };
  };
  ```

---

## Phase 3: UI/UX Changes

### 3.1 Update Workflow Steps
- **File:** `src/app/sourcing/page.tsx`
- **Current Flow:** Input → Processing → Review → Finalization
- **New Flow:** Input → Processing → Analysis → Review → Finalization
- **Change:** Add `'analysis'` to `WorkflowStep` type

### 3.2 Add Analysis Step UI
- **Location:** Between "Processing" and "Review" steps
- **Display:**
  - Show loading spinner: "Analyzing content suitability..."
  - After analysis completes, show results:
    - Badge/pill indicators for each content type
    - Green checkmark (✓) for suitable, red X (✗) for not suitable
    - Confidence score (e.g., "85% confidence")
    - Collapsible reasoning text
- **Visual Design:**
  ```
  Content Suitability Analysis:
  
  ✓ Multiple Choice Trivia (85% confidence)
  ✓ True/False Trivia (90% confidence)
  ✗ Motivational Content (30% confidence)
  ✓ Facts (95% confidence)
  ✗ Wisdom (25% confidence)
  
  [Show reasoning...]
  ```

### 3.3 Update Step 2 (Review) Display
- **Action:** Show suitability analysis results in the review section
- **Display:** Add a new section showing which content types this source is suitable for
- **Purpose:** User can see at a glance what they can generate from this content

### 3.4 Update Step 3 (Receipt) Display
- **Action:** Include suitability analysis summary in the final receipt
- **Display:** Show quick summary badges of suitable content types

---

## Phase 4: Content Types to Analyze

### 4.1 Initial Content Types (All to be analyzed)
1. **Multiple Choice Trivia** (`multiple_choice_trivia` / `multiple-choice`)
   - Looks for: Factual information, clear questions possible, multiple answer options
   - Table: `trivia_multiple_choice`
   
2. **True/False Trivia** (`true_false_trivia` / `true-false`)
   - Looks for: Statements that can be verified, binary facts
   - Table: `trivia_true_false`
   
3. **Motivational Content** (`motivational`)
   - Looks for: Inspirational language, personal growth themes, encouragement
   - Table: `collection_motivational`
   
4. **Facts** (`facts` / `fact`)
   - Looks for: Numerical data, statistics, verifiable factual statements, hockey-specific facts
   - Table: `collection_facts`
   
5. **Wisdom** (`wisdom`)
   - Looks for: Philosophical insights, reflective content, life lessons, "Penalty Box" style musings
   - Table: `collection_wisdom`

### 4.2 Future Content Types (Phase 2)
- Greetings (`greeting`) - Table: `collection_greetings`
- Stats (`stat`) - Table: `collection_stats`
- Who Am I trivia (`who-am-i`) - Table: `trivia_who_am_i`

---

## Phase 5: Integration Points

### 5.1 Content Browser Integration
- **File:** `src/app/content-browser/page.tsx` or related components
- **Action:** Add filter/search by suitability
- **Example:** "Show sources suitable for Multiple Choice Trivia"

### 5.2 Main Generator Integration
- **File:** `src/app/main-generator/page.tsx` or related
- **Action:** When selecting a source, show suitability indicators
- **Purpose:** Help users choose appropriate sources for content generation

---

## Phase 6: Error Handling & Edge Cases

### 6.1 Analysis Failure Handling
- **Strategy:** Non-blocking - if analysis fails, ingestion still succeeds
- **Fallback:** Show "Analysis unavailable" or skip analysis display
- **Logging:** Log analysis errors for debugging

### 6.2 Missing Prompt Configuration
- **Strategy:** If no active analysis prompt exists, skip analysis step
- **User Experience:** Workflow continues normally without analysis

### 6.3 Partial Analysis Results
- **Strategy:** Display only successfully analyzed content types
- **Handling:** If one content type analysis fails, show others

---

## Phase 7: Testing Considerations

### 7.1 Unit Tests
- Test `analyzeContentSuitability` adapter function
- Test analysis prompt loading
- Test error handling scenarios

### 7.2 Integration Tests
- Test full ingestion pipeline with analysis
- Test workflow step transitions
- Test UI display of analysis results

### 7.3 Manual Testing
- Test with various content types (factual, inspirational, narrative)
- Verify analysis results make sense
- Test error scenarios (missing prompt, API failure)

---

## Implementation Order

1. **Phase 1:** Database schema (verify `metadata` column supports JSON)
2. **Phase 2.1-2.2:** Add prompt type and create analysis adapter
3. **Phase 2.3:** Integrate analysis into ingestion pipeline
4. **Phase 3.1-3.2:** Add analysis step to UI workflow
5. **Phase 3.3-3.4:** Display results in Review and Receipt steps
6. **Phase 5:** Integrate with Content Browser and Main Generator (optional, can be Phase 2)

---

## Files to Modify/Create

### New Files:
- None (reuse existing patterns)

### Modified Files:
1. `src/lib/prompts/repository.ts` - Add prompt type
2. `src/lib/sourcing/adapters.ts` - Add analysis function (or create new adapter file)
3. `src/app/sourcing/actions.ts` - Integrate analysis into pipeline
4. `src/app/sourcing/page.tsx` - Add analysis step UI
5. `src/app/content-browser/...` - Add suitability filters (optional)
6. `src/app/main-generator/...` - Show suitability indicators (optional)

---

## Success Criteria

✅ Analysis runs automatically after content ingestion  
✅ Results stored in database `metadata` field  
✅ Analysis results displayed in workflow UI  
✅ Non-blocking - ingestion succeeds even if analysis fails  
✅ Admin can configure analysis prompt in Prompts Library  
✅ Results help users understand content suitability  

---

## Questions for Approval

1. Should analysis be **blocking** (must complete before proceeding) or **non-blocking** (can proceed even if it fails)?
   - **Recommendation:** Non-blocking for better UX

2. Should we show analysis results **during** the workflow or only **after** ingestion?
   - **Recommendation:** Show during workflow (new step) for better visibility

3. Which content types should we analyze **initially**?
   - **Recommendation:** Analyze all 5 core types (Multiple Choice, True/False, Motivational, Facts, Wisdom) from the start

4. Should analysis be **optional** (user can skip) or **automatic**?
   - **Recommendation:** Automatic - runs for all ingested content

5. Should we add **confidence thresholds** (e.g., only show "suitable" if confidence > 70%)?
   - **Recommendation:** Show all results, but highlight high-confidence ones

---

## Estimated Complexity

- **Backend:** Medium (similar to existing metadata extraction)
- **Frontend:** Medium (new step, display components)
- **Integration:** Low (follows existing patterns)
- **Testing:** Medium (need to test various content types)

**Total Estimated Time:** 4-6 hours of development + testing

