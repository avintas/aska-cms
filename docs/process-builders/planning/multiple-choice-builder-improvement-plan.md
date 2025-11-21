# Multiple Choice Trivia Set Builder - Improvement Plan

## Current State Assessment

### ✅ What's Complete

1. **Core Infrastructure**
   - Process builder framework (executor, validation, registry)
   - All 6 tasks implemented and working
   - Type-safe implementation
   - Server actions ready

2. **Basic Functionality**
   - Query source questions from `trivia_multiple_choice`
   - Select and balance questions (weighted/even strategies)
   - Generate metadata (title, slug, description)
   - Assemble question data
   - Create set record in `sets_trivia_multiple_choice`
   - Validate and finalize

3. **UI Components**
   - Basic form with theme, question count, filters
   - Navigation link added
   - Error/success messaging

### ❌ What's Missing (Recipe Context)

1. **Cooldown System**
   - No check for recently used questions
   - No exclusion of questions used within cooldown period
   - No cooldown configuration in UI

2. **Ideation Integration**
   - No data landscape view
   - No visibility into available content
   - No gap analysis (what's missing, what's abundant)

3. **Question Usage Tracking**
   - Questions not marked as "used" when added to sets
   - No way to track which questions were used when
   - Can't query "questions not used in last X days"

4. **Enhanced Selection Logic**
   - Doesn't exclude recently used questions
   - No awareness of question reuse patterns
   - Could select same questions repeatedly

5. **Better User Experience**
   - No preview before creating set
   - Limited feedback during process
   - No interaction log/message panel
   - Basic form could be more informative

6. **Recipe Alignment**
   - Not structured to work with recipe system
   - No recipe-based execution mode
   - Missing recipe-related metadata

---

## Improvement Plan

### Phase 1: Cooldown System Implementation

**Goal:** Prevent reusing questions within a specified time period

#### 1.1 Database Query Enhancement

- **Task:** Modify `query-questions.ts` to exclude recently used questions
- **Logic:**
  - Query `sets_trivia_multiple_choice` for sets created within cooldown period
  - Extract `source_id` values from `question_data` JSONB
  - Exclude those question IDs from candidate pool
- **Rules Support:**
  - Add `cooldownDays` rule (1-30 days, nullable)
  - Add `cooldownEnabled` rule (boolean, default true)

#### 1.2 Cooldown Helper Function

- **File:** `lib/helpers/cooldown.ts`
- **Function:** `getExcludedQuestionIds(cooldownDays: number): Promise<number[]>`
- **Query:**
  ```sql
  SELECT DISTINCT jsonb_array_elements(question_data)->>'source_id'
  FROM sets_trivia_multiple_choice
  WHERE created_at >= NOW() - INTERVAL 'X days'
  ```

#### 1.3 UI Enhancement

- Add cooldown fields to form:
  - Cooldown enabled checkbox
  - Cooldown days input (1-30)
- Show how many questions excluded due to cooldown

---

### Phase 2: Ideation Module Integration

**Goal:** Show data landscape before building set

#### 2.1 Data Landscape Component

- **Component:** `IdeationLandscape.tsx`
- **Shows:**
  - Total questions by theme
  - Total questions by category
  - Total questions by difficulty
  - Questions available (excluding cooldown)
  - Questions used recently
  - Gap analysis (themes with few questions)

#### 2.2 Integration Points

- Add "View Data Landscape" button to form
- Modal or side panel showing landscape
- Help user choose theme/category based on availability

#### 2.3 Helper Functions

- Query question counts by theme/category/difficulty
- Calculate availability after cooldown exclusion
- Identify gaps (themes with < X questions)

---

### Phase 3: Enhanced Question Selection

**Goal:** Smarter question selection with cooldown awareness

#### 3.1 Update Task 1 (Query Questions)

- Accept `cooldownDays` and `cooldownEnabled` from rules
- Call cooldown helper to get excluded IDs
- Filter candidates: `WHERE id NOT IN (excluded_ids)`
- Return metadata: `excludedCount`, `availableCount`

#### 3.2 Update Task 2 (Select & Balance)

- Consider cooldown-excluded count in warnings
- Better messaging when cooldown reduces pool significantly

#### 3.3 Selection Strategy Enhancement

- Prioritize questions not used recently
- Weight selection toward "fresh" questions
- Still balance by difficulty when possible

---

### Phase 4: Enhanced UI & User Experience

**Goal:** Better feedback and interaction

#### 4.1 Preview Before Creation

- **Component:** `SetPreview.tsx`
- **Shows:**
  - Selected questions (list or cards)
  - Metadata preview (title, description, etc.)
  - Question count and distribution
  - Cooldown impact summary
- **Action:** "Create Set" or "Cancel & Edit"

#### 4.2 Message/Interaction Panel

- **Component:** `ProcessMessagePanel.tsx`
- **Shows:**
  - Real-time task progress
  - Warnings and info messages
  - Success/error messages
  - Execution summary
- **Features:**
  - Scrollable log
  - Clear messages
  - Timestamp for each message

#### 4.3 Enhanced Form

- **Improvements:**
  - Show available question count (live update)
  - Show cooldown impact preview
  - Better field descriptions
  - Validation feedback
  - Suggested themes based on availability

#### 4.4 Result Display

- **After Creation:**
  - Show created set details
  - Link to view/edit set
  - Show which questions were used
  - Show cooldown status for next run

---

### Phase 5: Recipe System Alignment

**Goal:** Prepare for recipe-based execution

#### 5.1 Recipe Rule Support

- Add recipe-related rules:
  - `recipeId` (optional, if executing from recipe)
  - `bagType` (multiple-choice, true-false, mixed)
  - `executionMode` (auto, manual)
- Store recipe reference in set metadata (future)

#### 5.2 Recipe Execution Mode

- **Manual Mode:** Current behavior (user triggers)
- **Auto Mode:** (Future) Scheduled execution
- Track execution mode in context

#### 5.3 Recipe Metadata Storage

- Store recipe ID when executing from recipe
- Track recipe usage count (future enhancement)

---

## Implementation Priority

### High Priority (Must Have)

1. ✅ **Cooldown System** - Core requirement for recipe system
2. ✅ **Enhanced Query with Cooldown** - Prevents question reuse
3. ✅ **Message Panel** - Better user feedback

### Medium Priority (Should Have)

4. ✅ **Ideation Integration** - Helps users make informed decisions
5. ✅ **Preview Before Creation** - Prevents mistakes
6. ✅ **Enhanced Form** - Better UX

### Low Priority (Nice to Have)

7. ✅ **Recipe Alignment** - Prepares for recipe system
8. ✅ **Advanced Selection Strategies** - Optimization

---

## Technical Details

### Cooldown Query Pattern

```typescript
// Get excluded question IDs from sets created in last X days
const excludedIds = await supabase
  .from('sets_trivia_multiple_choice')
  .select('question_data')
  .gte('created_at', new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString())
  .then((results) => {
    const ids = new Set<number>();
    results.data?.forEach((set) => {
      set.question_data.forEach((q: any) => {
        if (q.source_id) ids.add(q.source_id);
      });
    });
    return Array.from(ids);
  });
```

### Data Landscape Query Pattern

```typescript
// Get question counts by theme
const themeCounts = await supabase
  .from('trivia_multiple_choice')
  .select('theme')
  .eq('status', 'published')
  .then((results) => {
    // Group and count by theme
  });
```

---

## Success Criteria

- ✅ Cooldown system prevents reusing questions within specified period
- ✅ Users can see data landscape before building sets
- ✅ Better feedback during set creation process
- ✅ Preview allows review before final creation
- ✅ System ready for recipe integration
- ✅ All improvements maintain backward compatibility

---

## Next Steps

1. Start with Phase 1 (Cooldown System) - highest priority
2. Implement helper functions first
3. Update Task 1 to use cooldown
4. Add UI fields for cooldown
5. Test with various cooldown periods
6. Move to Phase 2 (Ideation Integration)
7. Continue through remaining phases
