# Schedule Frequency Pattern - Reusable Design

## The Pattern

The same table structure can be reused for different schedule frequencies:
- **Hourly** - Items published every hour
- **Daily** - Items published every day (current implementation)
- **Weekly** - Items published every week
- **Monthly** - Items published every month

## Table Naming Convention

Following the pattern: `{frequency}_shareables_{content_type}`

### Examples

**Motivational Content:**
- `hourly_shareables_motivational`
- `daily_shareables_motivational` ← Current Phase 1
- `weekly_shareables_motivational`
- `monthly_shareables_motivational`

**Wisdom Content (Future):**
- `hourly_shareables_wisdom`
- `daily_shareables_wisdom`
- `weekly_shareables_wisdom`
- `monthly_shareables_wisdom`

## Universal Table Structure

All frequency tables follow the same pattern:

```sql
CREATE TABLE {frequency}_shareables_{content_type} (
  -- Primary key: The date/time this collection is scheduled to publish
  publish_date DATE NOT NULL PRIMARY KEY,  -- or publish_datetime for hourly
  
  -- Pre-processed collection: Complete JSONB array of items ready to display
  items JSONB NOT NULL,
  
  -- Timestamps for tracking when schedule was created/updated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Frequency-Specific Considerations

### Hourly Schedule

**Table Name:** `hourly_shareables_motivational`

**Primary Key:** 
- Option A: `publish_datetime TIMESTAMP` (includes date + hour)
- Option B: `publish_date DATE, publish_hour INTEGER` (composite key)

**Items Count:** Could be 5 items per hour (less than daily)

**Query Pattern:**
```sql
-- Get current hour's shareables
SELECT items 
FROM hourly_shareables_motivational 
WHERE publish_datetime = DATE_TRUNC('hour', NOW())
```

**Use Case:** High-frequency content updates, social media feeds

---

### Daily Schedule (Current)

**Table Name:** `daily_shareables_motivational`

**Primary Key:** `publish_date DATE`

**Items Count:** 10 items per day

**Query Pattern:**
```sql
-- Get today's shareables
SELECT items 
FROM daily_shareables_motivational 
WHERE publish_date = CURRENT_DATE
```

**Use Case:** Daily content publishing, blog posts, newsletters

---

### Weekly Schedule

**Table Name:** `weekly_shareables_motivational`

**Primary Key:** `publish_date DATE` (represents the week start date, e.g., Monday)

**Items Count:** Could be 20-30 items per week (more than daily)

**Query Pattern:**
```sql
-- Get current week's shareables
SELECT items 
FROM weekly_shareables_motivational 
WHERE publish_date = DATE_TRUNC('week', CURRENT_DATE)
```

**Use Case:** Weekly digests, newsletter content, weekly highlights

---

### Monthly Schedule

**Table Name:** `monthly_shareables_motivational`

**Primary Key:** `publish_date DATE` (represents the month start date, e.g., 1st of month)

**Items Count:** Could be 50-100 items per month

**Query Pattern:**
```sql
-- Get current month's shareables
SELECT items 
FROM monthly_shareables_motivational 
WHERE publish_date = DATE_TRUNC('month', CURRENT_DATE)
```

**Use Case:** Monthly magazines, comprehensive collections, monthly themes

---

## Pattern Benefits

### 1. Consistent Structure
- Same fields across all frequencies
- Same JSONB storage approach
- Same timestamp tracking

### 2. Reusable Code
- Same generation logic (just different date calculations)
- Same API patterns (just different table names)
- Same UI components (just different frequency labels)

### 3. Easy Extension
- Add new frequency = create new table following pattern
- Add new content type = create tables for all frequencies
- No schema changes needed

### 4. Clear Separation
- Each frequency is independent
- Can have different item counts per frequency
- Can have different business rules per frequency

---

## Implementation Example

### Generation Logic (Reusable)

```typescript
// Pseudo-code showing pattern reuse

function generateSchedule(
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly',
  content_type: 'motivational',
  start_date: Date,
  periods: number  // number of periods (hours/days/weeks/months)
) {
  const tableName = `${frequency}_shareables_${content_type}`;
  const itemsPerPeriod = getItemsPerPeriod(frequency); // 5, 10, 20, 50
  
  for (let i = 0; i < periods; i++) {
    const publishDate = calculatePublishDate(frequency, start_date, i);
    const items = selectItems(itemsPerPeriod, frequency);
    
    await upsertSchedule(tableName, publishDate, items);
  }
}

function calculatePublishDate(
  frequency: string,
  start: Date,
  offset: number
): Date {
  switch (frequency) {
    case 'hourly': return addHours(start, offset);
    case 'daily': return addDays(start, offset);
    case 'weekly': return addWeeks(start, offset);
    case 'monthly': return addMonths(start, offset);
  }
}
```

---

## Future Expansion

### Phase 1: Daily Only
- `daily_shareables_motivational`

### Phase 2: Add Frequencies
- `hourly_shareables_motivational`
- `weekly_shareables_motivational`
- `monthly_shareables_motivational`

### Phase 3: Add Content Types
- `daily_shareables_wisdom`
- `daily_shareables_stats`
- `daily_shareables_greetings`
- (Repeat for hourly, weekly, monthly)

### Phase 4: Mixed Content
- `daily_shareables_mixed` (combines all types)

---

## Design Decision: Separate Tables vs Single Table

### Option A: Separate Tables Per Frequency (Recommended)

**Pros:**
- ✅ Clear separation of concerns
- ✅ Different item counts per frequency
- ✅ Different business rules per frequency
- ✅ Follows existing pattern (separate tables per content type)
- ✅ Simple queries (no frequency filter needed)

**Cons:**
- ❌ More tables to manage
- ❌ More migrations

### Option B: Single Table with Frequency Field

**Pros:**
- ✅ Fewer tables
- ✅ Unified queries

**Cons:**
- ❌ More complex queries (always need frequency filter)
- ❌ Can't have different item counts easily
- ❌ Doesn't match existing pattern

### Recommendation

**Use Option A: Separate Tables Per Frequency**

**Reasoning:**
- Matches your existing pattern (separate tables per content type)
- Simpler queries (no filters needed)
- More flexible (different rules per frequency)
- Clearer structure

---

## Summary

**The Pattern:**
```
{frequency}_shareables_{content_type}
```

**Current Implementation:**
- `daily_shareables_motivational` (Phase 1)

**Future Extensions:**
- Same structure, different frequencies
- Same structure, different content types
- Same generation logic, different date calculations

**Key Insight:** Design the daily table well, and the pattern applies to all frequencies.

