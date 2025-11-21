# Field Design Decisions

## Question 1: Are Three Fields Enough?

### Current Fields (4 total)
1. `publish_date` - Primary key, the date items publish
2. `items` - JSONB array of pre-processed content
3. `created_at` - When schedule was created
4. `updated_at` - When schedule was last updated

### Analysis

**What we have:**
- ✅ Date identification (publish_date)
- ✅ Content storage (items)
- ✅ Audit trail (created_at, updated_at)

**What we could add:**
- `items_count` - Quick count without parsing JSONB
  - **Verdict:** Not needed - can derive from `items.length`
- `generation_metadata` - Notes about generation process
  - **Verdict:** Not needed for Phase 1 - adds complexity
- `status` - Published/scheduled/skipped
  - **Verdict:** Not needed - we overwrite, no status tracking

**Conclusion:** 4 fields is sufficient for Phase 1. Can add fields later if needed.

---

## Question 2: Primary Key Choice

### Option A: `publish_date` as Primary Key (Current)

```sql
publish_date DATE NOT NULL PRIMARY KEY
```

**Pros:**
- ✅ Simple and clear
- ✅ Ensures one row per day (natural constraint)
- ✅ Fast lookups: `WHERE publish_date = CURRENT_DATE`
- ✅ No JOINs needed
- ✅ Matches business requirement (one schedule per day)

**Cons:**
- ❌ No history tracking (but we overwrite anyway)
- ❌ Can't have multiple schedules for same day (not needed)

**Use Case Fit:** Perfect for "one schedule per day, overwrite on regenerate"

### Option B: Auto-Increment ID + Unique Constraint

```sql
id SERIAL PRIMARY KEY,
publish_date DATE NOT NULL UNIQUE
```

**Pros:**
- ✅ Allows history/audit trail
- ✅ More traditional database pattern

**Cons:**
- ❌ More complex queries (need to use date in WHERE clause)
- ❌ Extra column that's not really needed
- ❌ Doesn't match business requirement (we overwrite, don't track history)

**Use Case Fit:** Overkill for current requirements

### Recommendation

**Keep `publish_date` as PRIMARY KEY**

**Reasoning:**
- Matches business requirement perfectly
- Simplest possible design
- Fastest queries
- Can always add ID later if needed (migration is possible)

---

## Question 3: Items Array Length

### Current TypeScript Definition

```typescript
items: DailyShareableItem[]  // Unlimited array
```

### The Issue

**TypeScript Limitation:**
- TypeScript cannot enforce array length at compile time
- `DailyShareableItem[]` means "array of any length"
- Business rule: Always exactly 10 items

### Options

#### Option A: Keep Flexible Type (Current)

```typescript
items: DailyShareableItem[]  // Flexible length
```

**Pros:**
- ✅ Flexible for future changes
- ✅ Simple type definition
- ✅ Can change to 8, 12, etc. without type changes

**Cons:**
- ❌ No compile-time enforcement
- ❌ Could accidentally store wrong number

**Validation:** Runtime validation ensures exactly 10 items

#### Option B: Document Only

```typescript
/** Always contains exactly 10 items */
items: DailyShareableItem[]
```

**Pros:**
- ✅ Documents the rule
- ✅ Still flexible

**Cons:**
- ❌ No enforcement

#### Option C: Runtime Validation

```typescript
items: DailyShareableItem[]  // Type stays flexible

// But validate at generation:
if (items.length !== 10) {
  throw new Error('Must have exactly 10 items');
}
```

**Pros:**
- ✅ Enforces business rule
- ✅ Type stays flexible
- ✅ Clear error messages

**Cons:**
- ❌ Runtime check only (not compile-time)

### Recommendation

**Keep flexible type + Runtime validation**

**Implementation:**
1. TypeScript type: `items: DailyShareableItem[]` (flexible length)
2. Documentation comment: "Number of items is flexible (typically 7-12, but can vary)"
3. No hardcoded count enforcement - flexible based on generation parameters
4. Database constraint: **No CHECK constraint** - flexible item count

**Why:**
- TypeScript can't enforce array length anyway
- Runtime validation catches errors
- Flexible for future changes
- Clear documentation

---

## Summary

### Field Count: ✅ 4 fields is sufficient

### Primary Key: ✅ `publish_date` as PRIMARY KEY is correct

### Array Length: ✅ Flexible type + runtime validation

**All design decisions align with:**
- Simplicity (no over-engineering)
- Business requirements (one schedule per day, 10 items)
- Future flexibility (can add fields/types later)
- Performance (fast queries, simple structure)

