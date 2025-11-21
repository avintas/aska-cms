# Special Events & Overrides Design

## The Challenge

How to handle special days, events, and durations that need different content:
- **Special Days:** Halloween, Christmas, New Year's Day
- **Special Durations:** Christmas week, Playoff season, Stanley Cup Finals
- **Special Events:** Championship games, Memorial Day, etc.

## Design Approach: Override Pattern

**Key Concept:** Special events override the regular schedule

**How it works:**
1. Regular schedule runs as normal (`daily_shareables_motivational`)
2. Special events stored separately (`special_shareables_motivational`)
3. When querying: Check special events first, then fall back to regular schedule
4. Special events take precedence

---

## Database Structure

### Table: `special_shareables_motivational`

```sql
CREATE TABLE special_shareables_motivational (
  -- Primary key: The date this special collection is scheduled
  publish_date DATE NOT NULL PRIMARY KEY,
  
  -- Event name/description (for admin reference)
  event_name VARCHAR(255) NOT NULL,
  
  -- Event type: 'single_day', 'duration', 'recurring'
  event_type VARCHAR(20) NOT NULL DEFAULT 'single_day',
  
  -- For durations: end_date when event ends
  end_date DATE NULL,
  
  -- For recurring: pattern (e.g., 'yearly', 'monthly')
  recurrence_pattern VARCHAR(20) NULL,
  
  -- Pre-processed collection: Complete JSONB array of items
  items JSONB NOT NULL,
  
  -- Priority: Higher priority overrides lower (for overlapping events)
  priority INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Examples

**Single Day Event (Halloween):**
```sql
publish_date: '2025-10-31'
event_name: 'Halloween'
event_type: 'single_day'
end_date: NULL
items: [halloween-themed motivational quotes]
```

**Duration Event (Christmas Week):**
```sql
publish_date: '2025-12-24'
event_name: 'Christmas Week'
event_type: 'duration'
end_date: '2025-12-31'
items: [christmas-themed motivational quotes]
```

**Recurring Event (Yearly):**
```sql
publish_date: '2025-12-25'
event_name: 'Christmas Day'
event_type: 'recurring'
recurrence_pattern: 'yearly'
items: [christmas-themed motivational quotes]
```

---

## Query Logic: Priority System

### When Displaying Content

```typescript
// Pseudo-code for query logic

async function getShareablesForDate(date: Date) {
  // 1. Check for special events first (highest priority)
  const specialEvent = await getSpecialEvent(date);
  if (specialEvent) {
    return specialEvent.items; // Special content wins
  }
  
  // 2. Fall back to regular schedule
  const regularSchedule = await getRegularSchedule(date);
  if (regularSchedule) {
    return regularSchedule.items;
  }
  
  // 3. No content available
  return null;
}
```

### Priority Handling

If multiple special events overlap:
- Higher `priority` number wins
- Most recent `created_at` breaks ties
- Admin can adjust priority as needed

---

## Admin Workflow

### Creating Special Events

**Single Day:**
1. Admin selects date (e.g., October 31)
2. Admin enters event name: "Halloween"
3. Admin generates/selects special content
4. System creates override for that date

**Duration:**
1. Admin selects start date (e.g., December 24)
2. Admin selects end date (e.g., December 31)
3. Admin enters event name: "Christmas Week"
4. Admin generates content for duration
5. System creates overrides for all dates in range

**Recurring:**
1. Admin selects date (e.g., December 25)
2. Admin selects recurrence: "Yearly"
3. Admin enters event name: "Christmas Day"
4. System creates override that repeats annually

---

## Implementation Options

### Option A: Separate Table (Recommended)

**Pros:**
- ✅ Clear separation of concerns
- ✅ Easy to query special events
- ✅ Doesn't complicate regular schedule table
- ✅ Can have different business rules
- ✅ Follows existing pattern (separate tables)

**Cons:**
- ❌ More tables to manage
- ❌ Need to check two tables when querying

**Structure:**
- `daily_shareables_motivational` (regular schedule)
- `special_shareables_motivational` (special events)

### Option B: Flag in Regular Table

**Pros:**
- ✅ Single table
- ✅ Simpler queries

**Cons:**
- ❌ Mixes regular and special content
- ❌ Harder to manage special events
- ❌ Doesn't follow pattern

### Option C: Event Metadata Table

**Pros:**
- ✅ Separates event info from content
- ✅ Can link to regular schedule

**Cons:**
- ❌ More complex
- ❌ Over-engineered for current needs

---

## Special Event Types

### 1. Single Day Events

**Examples:**
- Halloween (October 31)
- New Year's Day (January 1)
- Memorial Day (last Monday in May)
- Independence Day (July 4)

**Implementation:**
- One row per date
- `event_type = 'single_day'`
- `end_date = NULL`

### 2. Duration Events

**Examples:**
- Christmas Week (Dec 24 - Dec 31)
- Playoff Season (April - June)
- Stanley Cup Finals (specific dates)

**Implementation:**
- One row with start date
- `event_type = 'duration'`
- `end_date` specifies when it ends
- Query checks: `date >= publish_date AND date <= end_date`

### 3. Recurring Events

**Examples:**
- Christmas Day (every December 25)
- New Year's Day (every January 1)
- Hockey season start (first Monday in October)

**Implementation:**
- One row with base date
- `event_type = 'recurring'`
- `recurrence_pattern = 'yearly'` (or 'monthly', etc.)
- Query checks: Matches pattern for current year

---

## Query Examples

### Get Today's Shareables (With Override Check)

```sql
-- Check special events first
SELECT items, priority
FROM special_shareables_motivational
WHERE publish_date = CURRENT_DATE
   OR (event_type = 'duration' 
       AND CURRENT_DATE >= publish_date 
       AND CURRENT_DATE <= end_date)
   OR (event_type = 'recurring' 
       AND recurrence_pattern = 'yearly'
       AND EXTRACT(MONTH FROM publish_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(DAY FROM publish_date) = EXTRACT(DAY FROM CURRENT_DATE))
ORDER BY priority DESC, created_at DESC
LIMIT 1

-- If no special event, fall back to regular schedule
-- (separate query to daily_shareables_motivational)
```

### Get All Special Events

```sql
SELECT * 
FROM special_shareables_motivational
WHERE publish_date >= CURRENT_DATE
ORDER BY publish_date, priority DESC
```

---

## Admin UI Considerations

### Special Events Management Page

**Features:**
1. **List View:** All special events (past, current, future)
2. **Calendar View:** Shows special events on calendar
3. **Create Event:**
   - Single day picker
   - Date range picker (for durations)
   - Recurrence selector (for recurring)
4. **Content Generation:** Same as regular schedule (select items)
5. **Priority Management:** Adjust priority for overlapping events

### Visual Indicators

**In Content Release Report:**
- Regular days: Normal color
- Special event days: Highlighted color (e.g., orange for Halloween)
- Duration events: Highlighted range
- Tooltip: Shows event name

---

## Business Rules

### Override Behavior

1. **Special events always override regular schedule**
   - If Halloween has special content, use it instead of regular
   - Regular schedule still exists, just not displayed

2. **Multiple special events:**
   - Highest priority wins
   - Admin can adjust priorities

3. **Regeneration:**
   - Regenerating regular schedule doesn't affect special events
   - Special events are independent

4. **Deletion:**
   - Delete special event → Falls back to regular schedule
   - No data loss

---

## Future Enhancements

### Phase 1: Basic Special Events
- Single day events only
- Simple override mechanism

### Phase 2: Duration Support
- Date range events
- Multi-day special content

### Phase 3: Recurring Events
- Yearly recurring (Christmas, etc.)
- Pattern matching

### Phase 4: Advanced Features
- Event templates
- Bulk event creation
- Event categories/themes

---

## Summary

**Pattern:**
- Separate table: `special_shareables_motivational`
- Override mechanism: Check special first, then regular
- Priority system: Higher priority wins
- Admin control: Easy to create/manage special events

**Benefits:**
- ✅ Doesn't complicate regular schedule
- ✅ Flexible for any special day/event
- ✅ Easy to manage
- ✅ Follows existing pattern (separate tables)

**Implementation:**
- Phase 1: Start with single day events
- Phase 2: Add duration support
- Phase 3: Add recurring events

