# Stage 3: CMS Backend API - Summary

## ✅ REST API Endpoints Created

Following Next.js App Router pattern (matching existing CMS API structure)

---

### 1. POST `/api/shareables/generate`

**Purpose:** Generate schedule for specified date range

**Request Body:**
```typescript
{
  start_date: string;  // ISO date: YYYY-MM-DD
  days: number;        // Number of consecutive days
  content_type: 'motivational';  // Phase 1 only
}
```

**Response:**
```typescript
{
  success: boolean;
  dates_generated: number;
  date_range: {
    start: string;
    end: string;
  };
  error?: string;  // Optional warning if some dates failed
}
```

**Functionality:**
- ✅ Validates authentication (requires logged-in admin)
- ✅ Validates input (date format, positive days, content type)
- ✅ Calculates consecutive dates (handles month boundaries, leap years)
- ✅ Fetches all motivational content from database
- ✅ Creates usage tracker for frequency control
- ✅ Generates schedule for each date:
  - Selects items with frequency control
  - Packages complete content as JSONB
  - Upserts into database (overwrites existing dates)
- ✅ Returns success with date range

**File:** `apps/cms/src/app/api/shareables/generate/route.ts`

---

### 2. GET `/api/shareables`

**Purpose:** Fetch scheduled shareables with optional filters

**Query Parameters:**
- `date` - Get specific date (ISO: YYYY-MM-DD)
- `start_date` - Start of date range
- `end_date` - End of date range
- `content_type` - Content type filter (Phase 1: only 'motivational')

**Response:**
```typescript
{
  success: boolean;
  data: DailyShareableMotivational[];
  count: number;
  error?: string;
}
```

**Functionality:**
- ✅ Validates authentication
- ✅ Validates date formats
- ✅ Supports single date lookup
- ✅ Supports date range queries
- ✅ Returns ordered results (by publish_date)

**File:** `apps/cms/src/app/api/shareables/route.ts`

---

### 3. GET `/api/shareables/report`

**Purpose:** Get content release report data

**Query Parameters:**
- `start_date` - Optional start date filter
- `end_date` - Optional end date filter

**Response:**
```typescript
{
  success: boolean;
  data: ScheduleReport;
  error?: string;
}
```

**ScheduleReport Structure:**
```typescript
{
  total_days: number;
  date_range: { start: string; end: string };
  scheduled_dates: string[];
  gaps: string[];  // Dates without schedules
  stats: {
    earliest_date: string | null;
    latest_date: string | null;
    total_items: number;
  };
}
```

**Functionality:**
- ✅ Validates authentication
- ✅ Fetches all scheduled dates
- ✅ Calculates date range
- ✅ Identifies coverage gaps
- ✅ Calculates statistics (total items, etc.)

**File:** `apps/cms/src/app/api/shareables/report/route.ts`

---

## API Pattern

**Matches Existing CMS Pattern:**
- ✅ Next.js App Router route handlers
- ✅ Uses `createApiClient()` for authentication
- ✅ Returns `NextResponse.json()` with success/error pattern
- ✅ Uses Supabase for database operations
- ✅ Proper error handling and validation

**Authentication:**
- All endpoints require authenticated admin user
- Returns 401 if not authenticated
- Uses existing CMS auth system

**Error Handling:**
- Input validation (400 errors)
- Authentication errors (401)
- Database errors (500)
- Detailed error messages

---

## Usage Examples

### Generate 30 Days Schedule

```bash
POST /api/shareables/generate
Content-Type: application/json

{
  "start_date": "2025-02-01",
  "days": 30,
  "content_type": "motivational"
}
```

### Get Today's Schedule

```bash
GET /api/shareables?date=2025-02-15
```

### Get Date Range

```bash
GET /api/shareables?start_date=2025-02-01&end_date=2025-02-28
```

### Get Report

```bash
GET /api/shareables/report
```

---

## Implementation Details

### Frequency Control
- Uses `createUsageTracker()` to track item usage
- Uses `selectItemsWithFrequencyControl()` for even distribution
- Ensures no item exceeds max_appearances
- Prefers less-used items

### Date Handling
- Uses `generateConsecutiveDates()` for date calculations
- Handles month boundaries automatically
- Handles leap years automatically
- Validates ISO date format

### Database Operations
- Uses Supabase `.upsert()` for overwriting existing dates
- Uses `.select()` with filters for queries
- Proper error handling for database operations

---

## Next Steps

**Stage 3: ✅ COMPLETE**

Ready to proceed to:
- **Stage 4:** CMS UI - Generation Page
- **Stage 5:** CMS UI - Content Release Report
- **Stage 6:** Web App Integration
- **Stage 8:** Testing & Validation

---

## Files Created

**API Routes:**
- `apps/cms/src/app/api/shareables/generate/route.ts`
- `apps/cms/src/app/api/shareables/route.ts`
- `apps/cms/src/app/api/shareables/report/route.ts`

**Documentation:**
- `docs/shareables/STAGE_3_SUMMARY.md`

