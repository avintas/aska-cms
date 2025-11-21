# Category Normalization Plan for Trivia Generation

## Current State

### Sourcing System (Constrained)
- **Location**: `apps/cms/src/lib/sourcing/validators.ts`
- **Constraint**: Predefined categories per theme
- **Validation**: Enforced at metadata extraction time
- **Result**: Consistent, controlled categories

### Trivia Generation System (Unconstrained)
- **Location**: `apps/cms/src/lib/gemini/generators/multiple-choice.ts`
- **Constraint**: None - Gemini creates any category
- **Validation**: None
- **Result**: Inconsistent categories (e.g., "Coaching", "Location", "Dentistry", "NHL Draft")

## Goal

Normalize trivia question categories to match sourcing constraints while maintaining safety and backward compatibility.

## Solution Options

### Option 1: Normalization at Generation Time (Recommended)
**What**: Map Gemini's categories to allowed categories when generating questions

**Changes Required**:
1. Create normalization function in `apps/cms/src/lib/gemini/normalizers/category.ts`
2. Update `multiple-choice.ts`, `true-false.ts`, `who-am-i.ts` generators
3. Add fuzzy matching for close category names
4. Log normalization actions for review

**Pros**:
- ✅ Prevents bad data from entering database
- ✅ No migration needed for existing data
- ✅ Immediate consistency
- ✅ Can still allow "Uncategorized" for edge cases

**Cons**:
- ⚠️ May lose some semantic meaning if mapping is imperfect
- ⚠️ Requires fuzzy matching logic

**Effort**: 4-6 hours
**Risk**: Low (can be tested before deployment)

---

### Option 2: Normalization at Save Time
**What**: Normalize categories when inserting questions into database

**Changes Required**:
1. Create normalization function
2. Update database insert operations in:
   - `apps/cms/src/app/main-generator/actions.ts` (line 115)
   - Any direct insert operations
3. Add validation layer

**Pros**:
- ✅ Centralized normalization
- ✅ Works for both generated and manually created questions
- ✅ Can add logging/audit trail

**Cons**:
- ⚠️ Existing bad data remains
- ⚠️ Need to update all insert points

**Effort**: 5-7 hours
**Risk**: Medium (need to find all insert points)

---

### Option 3: Hybrid Approach (Best Safety)
**What**: Normalize at generation + validate at save + migrate existing data

**Changes Required**:
1. Normalization at generation (Option 1)
2. Validation at save (Option 2)
3. Migration script for existing data
4. Update materialized views after migration

**Pros**:
- ✅ Most comprehensive
- ✅ Handles existing data
- ✅ Prevents future issues
- ✅ Complete consistency

**Cons**:
- ⚠️ Highest effort
- ⚠️ Migration needs careful testing

**Effort**: 8-12 hours
**Risk**: Medium (migration needs testing)

---

## Recommended Approach: Option 1 with Migration

### Phase 1: Normalization Function (2-3 hours)

**Create**: `apps/cms/src/lib/gemini/normalizers/category.ts`

```typescript
import { CATEGORY_BY_THEME } from '@/lib/sourcing/validators';

/**
 * Normalize a category name to match allowed categories for a theme
 * Uses fuzzy matching to find closest match
 */
export function normalizeCategory(
  category: string | null | undefined,
  theme: string,
): string | null {
  if (!category || !theme) return null;
  
  const allowedCategories = CATEGORY_BY_THEME[theme as keyof typeof CATEGORY_BY_THEME];
  if (!allowedCategories) return null;
  
  // Exact match
  if (allowedCategories.includes(category)) {
    return category;
  }
  
  // Fuzzy match (case-insensitive, partial)
  const normalized = category.trim();
  const match = allowedCategories.find(
    (allowed) => allowed.toLowerCase() === normalized.toLowerCase()
  );
  if (match) return match;
  
  // Partial match (e.g., "NHL Draft" matches "NHL Draft")
  const partialMatch = allowedCategories.find(
    (allowed) => 
      allowed.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(allowed.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // No match - return null (will be stored as "Uncategorized" or null)
  return null;
}
```

### Phase 2: Update Generators (1-2 hours)

**Update**: `apps/cms/src/lib/gemini/generators/multiple-choice.ts`

```typescript
import { normalizeCategory } from '../normalizers/category';

// In the map function:
return {
  // ... other fields
  category: normalizeCategory(item.category, item.theme) || null,
  // ...
};
```

**Repeat for**: `true-false.ts`, `who-am-i.ts`

### Phase 3: Migration Script (2-3 hours)

**Create**: `sql/migrations/migration_YYYYMMDD_normalize_trivia_categories.sql`

- Update existing questions to use normalized categories
- Map existing categories to closest allowed category
- Set to null if no match found
- Update materialized views after migration

### Phase 4: Testing & Validation (1-2 hours)

- Test normalization with various category names
- Verify existing questions still work
- Test materialized view refresh
- Verify category selector still works

---

## Cost Breakdown

| Phase | Effort | Risk | Dependencies |
|-------|--------|------|--------------|
| **Phase 1: Normalization Function** | 2-3 hours | Low | None |
| **Phase 2: Update Generators** | 1-2 hours | Low | Phase 1 |
| **Phase 3: Migration Script** | 2-3 hours | Medium | Phase 1, Test data |
| **Phase 4: Testing** | 1-2 hours | Low | All phases |
| **Total** | **6-10 hours** | **Low-Medium** | |

---

## Safety Measures

### 1. Backward Compatibility
- Keep `category` field nullable
- Allow "Uncategorized" or null for unmapped categories
- Don't break existing queries

### 2. Gradual Rollout
- Deploy normalization function first (doesn't change existing data)
- Test with new generations
- Run migration separately after validation

### 3. Audit Trail
- Log normalization actions (what was changed, why)
- Keep original category in logs for review
- Allow manual override if needed

### 4. Fallback Strategy
- If normalization fails, set category to null (not an error)
- Don't block question creation if category can't be normalized
- Allow manual category assignment in UI

---

## Migration Strategy

### Step 1: Create Normalization Function
- Safe: Only adds new code, doesn't change existing behavior
- Can be deployed immediately

### Step 2: Update Generators
- Safe: Only affects new questions
- Existing questions unchanged
- Can be tested in dev environment

### Step 3: Migration Script
- **Critical**: Must test on copy of production data first
- Create backup before running
- Run during low-traffic period
- Verify results before committing

### Step 4: Refresh Materialized Views
- Run `refresh_trivia_statistics()` after migration
- Verify category counts are correct

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing queries | Low | High | Keep field nullable, test thoroughly |
| Losing category information | Medium | Medium | Use fuzzy matching, log changes |
| Migration data loss | Low | High | Backup first, test on copy |
| Performance impact | Low | Low | Normalization is fast, minimal overhead |

---

## Success Criteria

1. ✅ All new trivia questions use normalized categories
2. ✅ Existing questions migrated successfully
3. ✅ Category selector shows consistent categories
4. ✅ Materialized views reflect correct counts
5. ✅ No broken queries or UI components
6. ✅ Logging shows normalization actions

---

## Alternative: Soft Normalization (Lower Risk)

If full normalization is too risky, we can:

1. **Add category suggestions** in UI (show closest match)
2. **Warn on save** if category doesn't match allowed list
3. **Allow manual correction** in edit forms
4. **Gradually migrate** as questions are edited

**Effort**: 2-3 hours
**Risk**: Very Low
**Result**: Partial consistency, user-driven

---

## Recommendation

**Start with Option 1 (Normalization at Generation)** because:
- ✅ Safest approach (only affects new data)
- ✅ Immediate benefit for new questions
- ✅ Can add migration later if needed
- ✅ Low risk, high value

**Then add migration** after validation:
- Test normalization function works correctly
- Verify category selector handles normalized categories
- Run migration on test data first
- Deploy migration during maintenance window

**Total Timeline**: 1-2 days (with testing and validation)

