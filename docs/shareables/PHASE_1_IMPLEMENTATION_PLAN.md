# Shareables Calendarization System - Phase 1 Implementation Plan

## Overview

Phase 1 implements a calendarization system for **Motivational content only**. The system allows admins to generate pre-processed daily shareable collections that are stored as JSONB in the database. The web app can then query and display these collections without any additional processing.

**Key Principles:**
- Simple, no over-engineering
- Pre-processed = factory/canned report approach
- Full regeneration (overwrites existing dates)
- Basic frequency control (even distribution)
- Month-aware date handling

---

## Stage 1: Database Schema

### 1.1 Table Structure

**Table: `daily_shareables`**

```sql
CREATE TABLE daily_shareables (
  publish_date DATE PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL DEFAULT 'motivational', -- For Phase 1
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX idx_daily_shareables_date ON daily_shareables(publish_date);
CREATE INDEX idx_daily_shareables_content_type ON daily_shareables(content_type);

-- Index for JSONB queries (if needed later)
CREATE INDEX idx_daily_shareables_items ON daily_shareables USING GIN(items);
```

### 1.2 JSONB Structure

Each `items` JSONB column contains a complete array of 10 motivational items:

```json
[
  {
    "id": 123,
    "quote": "Full quote text here",
    "author": "Author name or null",
    "context": "Context or null",
    "theme": "theme_value or null",
    "category": "category_value or null",
    "attribution": "attribution or null",
    "display_order": 1
  },
  // ... 9 more items
]
```

**Note:** All fields from `collection_motivational` table are included for complete pre-processing.

### 1.3 Deliverables
- SQL migration file: `sql/migrations/migration_YYYYMMDD_create_daily_shareables.sql`
- Documentation of JSONB structure

---

## Stage 2: Shared Types & Utilities

### 2.1 TypeScript Types

**File: `packages/shared/src/types/shareables.ts`**

```typescript
export interface DailyShareableItem {
  id: number;
  quote: string;
  author: string | null;
  context: string | null;
  theme: string | null;
  category: string | null;
  attribution: string | null;
  display_order: number;
}

export interface DailyShareable {
  publish_date: string; // ISO date string
  content_type: 'motivational' | 'wisdom' | 'stats' | 'greetings' | 'mixed';
  items: DailyShareableItem[];
  created_at: string;
  updated_at: string;
}

export interface GenerateScheduleRequest {
  start_date: string; // ISO date string
  days: number; // 7, 30, 365, etc.
  content_type: 'motivational'; // Phase 1 only
}

export interface GenerateScheduleResponse {
  success: boolean;
  dates_generated: number;
  date_range: {
    start: string;
    end: string;
  };
  error?: string;
}
```

### 2.2 Date Utilities

**File: `packages/shared/src/utils/dates.ts`**

Functions for:
- Calculating consecutive dates from start date
- Month-aware date calculations
- Leap year handling
- Date range validation

### 2.3 Content Selection Utilities

**File: `packages/shared/src/utils/shareables-selection.ts`**

- `selectItemsWithFrequencyControl()` - Selects items with even distribution
- Tracks usage during generation
- Ensures no item exceeds max appearances
- Returns array of selected items

### 2.4 Deliverables
- Type definitions in shared package
- Date utility functions
- Content selection algorithm with frequency control
- Unit tests for utilities

---

## Stage 3: CMS Backend API

### 3.1 API Endpoints

**File: `apps/cms/src/app/api/shareables/generate/route.ts`**

**POST `/api/shareables/generate`**

Request body:
```typescript
{
  start_date: string; // ISO date
  days: number;
  content_type: 'motivational';
}
```

Response:
```typescript
{
  success: boolean;
  dates_generated: number;
  date_range: { start: string; end: string };
  error?: string;
}
```

**Logic:**
1. Validate input (start_date, days > 0, content_type)
2. Calculate date range (handle month boundaries, leap years)
3. Fetch all available motivational content from `collection_motivational`
4. For each date:
   - Select 10 items using frequency control algorithm
   - Package complete content as JSONB
   - UPSERT into `daily_shareables` table
5. Return success with date range

**File: `apps/cms/src/app/api/shareables/route.ts`**

**GET `/api/shareables`**

Query params:
- `start_date` (optional) - Filter from date
- `end_date` (optional) - Filter to date
- `date` (optional) - Get specific date
- `content_type` (optional) - Filter by type

Response: Array of `DailyShareable` objects

**GET `/api/shareables/report`**

Returns content release report data:
- Calendar view data (monthly breakdown)
- List view data (all scheduled dates)
- Coverage gaps
- Statistics (total days scheduled, date range)

### 3.2 Server Actions (Alternative/Additional)

**File: `apps/cms/src/app/shareables-schedule/actions.ts`**

Server actions for:
- `generateSchedule()`
- `getScheduleReport()`
- `getScheduleByDate()`

### 3.3 Deliverables
- API route handlers
- Server actions (if using)
- Error handling
- Input validation
- API documentation

---

## Stage 4: CMS UI - Generation Page

### 4.1 Page Structure

**File: `apps/cms/src/app/shareables-schedule/generate/page.tsx`**

**Components:**
1. **Date Picker** - Select start date
2. **Days Input** - Number of days (7, 30, 365, custom)
3. **Content Type Selector** - Phase 1: Only "Motivational" (disabled others)
4. **Generate Button** - Triggers generation
5. **Loading State** - Shows progress during generation
6. **Success/Error Messages** - Feedback after generation

**UI Flow:**
1. Admin selects start date
2. Admin enters number of days
3. Admin clicks "Generate Schedule"
4. System shows loading state
5. On success: Shows date range generated, link to report
6. On error: Shows error message

### 4.2 Deliverables
- Generation page component
- Form validation
- Loading states
- Success/error handling
- Responsive design

---

## Stage 5: CMS UI - Content Release Report

### 5.1 Report Page Structure

**File: `apps/cms/src/app/shareables-schedule/report/page.tsx`**

**Two Views:**

#### 5.1.1 Calendar Grid View
- Monthly calendar layout
- Each day shows:
  - Status indicator (scheduled/empty)
  - Number of items scheduled
  - Click to view details
- Month navigation (previous/next)
- Current month highlighted

#### 5.1.2 List View
- Table/list of all scheduled dates
- Columns:
  - Date
  - Content Type
  - Number of Items
  - Created Date
  - Actions (view details)
- Sortable by date
- Filterable by date range

**Shared Features:**
- Toggle between Calendar/List views
- Date range filter
- Statistics summary (total days, date range, coverage)
- Click date → Modal/Page showing the 10 items for that day

### 5.2 Components

**File: `apps/cms/src/app/shareables-schedule/report/components/CalendarGrid.tsx`**
- Calendar grid component
- Month navigation
- Day cell rendering

**File: `apps/cms/src/app/shareables-schedule/report/components/ListView.tsx`**
- Table/list component
- Sorting/filtering

**File: `apps/cms/src/app/shareables-schedule/report/components/ScheduleDetails.tsx`**
- Modal/page showing day's items
- Display all 10 items with full content

### 5.3 Deliverables
- Calendar grid view
- List view
- Schedule details view
- View toggle
- Date filtering
- Statistics display

---

## Stage 6: Web App Integration

### 6.1 API Endpoint

**File: `apps/web/src/app/api/shareables/today/route.ts`**

**GET `/api/shareables/today`**

Query today's shareables:
```sql
SELECT items FROM daily_shareables 
WHERE publish_date = CURRENT_DATE 
AND content_type = 'motivational'
```

Response:
```typescript
{
  success: boolean;
  data: {
    publish_date: string;
    items: DailyShareableItem[];
  } | null;
  error?: string;
}
```

**Fallback:** If no data for today, return recent items or empty array.

### 6.2 Shareables Display Page

**File: `apps/web/src/app/shareables/page.tsx`**

- Fetches today's shareables from API
- Displays 10 items in a grid/list
- Each item shows quote, author, context
- Responsive design
- Loading states

### 6.3 Navigation Update

Update main page to link to `/shareables` (already exists in cell 3)

### 6.4 Deliverables
- API endpoint for today's shareables
- Shareables display page
- Responsive design
- Error handling
- Loading states

---

## Stage 7: Frequency Control Algorithm

### 7.1 Algorithm Design

**Function: `selectItemsWithFrequencyControl()`**

**Input:**
- Available items array
- Number of items needed (10)
- Total days being generated
- Max appearances per item (calculated: total_slots / total_items, rounded up)

**Process:**
1. Calculate max appearances: `Math.ceil((days * 10) / total_items)`
2. Initialize usage counter: `Map<itemId, count>`
3. For each date:
   - Shuffle available items
   - Select 10 items:
     - Skip items that reached max appearances
     - Prefer items with lower usage counts
     - Ensure even distribution
   - Update usage counter
4. Return selected items for date

**Example:**
- Generating 30 days × 10 items = 300 slots
- 100 motivational quotes available
- Max appearances per item = ceil(300/100) = 3
- Each item appears 2-3 times across 30 days

### 7.2 Deliverables
- Selection algorithm implementation
- Usage tracking logic
- Even distribution logic
- Unit tests
- Documentation

---

## Stage 8: Testing & Validation

### 8.1 Database Tests
- Table creation
- JSONB structure validation
- Date handling (month boundaries, leap years)
- UPSERT behavior (overwrites)

### 8.2 API Tests
- Generation endpoint
- Report endpoint
- Date range queries
- Error handling

### 8.3 UI Tests
- Generation form validation
- Calendar grid rendering
- List view rendering
- Date navigation

### 8.4 Algorithm Tests
- Frequency control accuracy
- Even distribution
- Edge cases (more days than items, etc.)

### 8.5 Deliverables
- Test suite
- Test documentation
- Edge case coverage

---

## Implementation Order & Dependencies

```
Stage 1: Database Schema
  ↓
Stage 2: Shared Types & Utilities
  ↓
Stage 7: Frequency Control Algorithm (can be parallel with Stage 2)
  ↓
Stage 3: CMS Backend API
  ↓
Stage 4: CMS UI - Generation Page
  ↓
Stage 5: CMS UI - Content Release Report
  ↓
Stage 6: Web App Integration
  ↓
Stage 8: Testing & Validation
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Admin can generate 7-365 days of motivational shareables
- ✅ Schedule is stored as pre-processed JSONB
- ✅ Content release report shows calendar grid and list view
- ✅ Web app can display today's shareables
- ✅ Frequency control ensures even distribution
- ✅ System handles month boundaries and leap years
- ✅ Regeneration overwrites existing dates
- ✅ All tests pass

---

## Future Enhancements (Post-Phase 1)

- Apply pattern to Wisdom, Stats, Greetings
- Mixed content type (daily soup)
- Advanced rule plugins
- Per-item frequency limits
- Content usage analytics
- Schedule editing (swap days, regenerate specific dates)

---

## Questions for Approval

1. **JSONB Structure:** Store full content or just IDs? (Plan assumes full content)
2. **Date Format:** ISO strings or Date objects? (Plan assumes ISO strings)
3. **Error Handling:** What happens if not enough content for days requested?
4. **Calendar Library:** Use a library (date-fns, dayjs) or custom?
5. **UI Framework:** Any specific component library preferences?

---

## Next Steps

1. Review and approve this plan
2. Approve each stage before implementation
3. Begin Stage 1: Database Schema

