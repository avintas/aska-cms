# Shareables Calendarization - API Overview

## High-Level API Design

### The Two Main Operations

```
1. GENERATE SCHEDULE (Admin creates schedule)
   ↓
   POST /api/shareables/generate
   
2. GET SCHEDULE (Website displays content)
   ↓
   GET /api/shareables/today
   GET /api/shareables (with filters)
   GET /api/shareables/report
```

---

## API Endpoint 1: Generate Schedule

### Purpose
Admin creates a schedule by selecting start date and number of days.

### Endpoint
**POST** `/api/shareables/generate`

### What Admin Provides
- **Start Date:** "I want to start on January 1st, 2025"
- **Number of Days:** "Generate 30 days"
- **Content Type:** "Motivational" (Phase 1)

### What Happens Behind The Scenes

1. **Date Calculation**
   - System calculates: Jan 1, Jan 2, Jan 3... Jan 30 (30 consecutive dates)
   - Handles month boundaries automatically
   - Handles leap years if needed

2. **Content Selection**
   - System looks at all available motivational quotes
   - For each of the 30 days:
     - Selects 10 items
     - Ensures even distribution (frequency control)
     - Packages complete content

3. **Storage**
   - Creates 30 rows in database
   - Each row = one day with 10 items
   - Overwrites existing dates if regenerating

4. **Response**
   - Returns: "Success! Generated 30 days from Jan 1 to Jan 30"

### Business Flow

```
Admin clicks "Generate 30 days"
  ↓
System processes (takes a few seconds)
  ↓
30 days scheduled and stored
  ↓
Admin sees success message
  ↓
Admin can view schedule in report
```

---

## API Endpoint 2: Get Today's Shareables

### Purpose
Website displays today's shareables automatically.

### Endpoint
**GET** `/api/shareables/today`

### What Happens

1. **Query**
   - System asks: "What's today's date?"
   - Looks up that date in the database

2. **Response**
   - Returns: The 10 pre-packaged items for today
   - Or: "No schedule for today" (if not generated)

3. **Display**
   - Website receives the 10 items
   - Displays them immediately (no processing needed)

### Business Flow

```
User visits website
  ↓
Website asks: "What should I show today?"
  ↓
System looks up today's date
  ↓
Returns 10 items ready to display
  ↓
Website shows all 10 items
```

---

## API Endpoint 3: Get Schedule Report

### Purpose
Admin views the entire schedule (calendar grid or list).

### Endpoint
**GET** `/api/shareables/report`

### Optional Filters
- **Date Range:** "Show me January 2025"
- **Content Type:** "Show only motivational"

### What Admin Sees

**Calendar Grid View:**
- Monthly calendar
- Each day shows: ✅ Has content or ⚪ Empty
- Click day → See the 10 items

**List View:**
- Table of all scheduled dates
- Shows: Date | Content Type | Items Count | Created Date
- Sortable and filterable

### Business Flow

```
Admin opens report page
  ↓
System queries all scheduled dates
  ↓
Returns calendar data + list data
  ↓
Admin sees visual overview
  ↓
Admin can click dates to see details
```

---

## API Endpoint 4: Get Schedule by Date Range

### Purpose
Get multiple days for planning or review.

### Endpoint
**GET** `/api/shareables`

### Query Parameters
- `start_date`: "Show me from January 1st"
- `end_date`: "Show me until January 31st"
- `date`: "Show me specific date"
- `content_type`: Filter by type

### Use Cases
- View entire month's schedule
- Check specific date range
- Export schedule data

---

## Data Flow: Complete Picture

### Generation Flow

```
Admin UI
  ↓ (clicks "Generate")
CMS Backend API
  ↓ (processes request)
Date Calculation Engine
  ↓ (calculates dates)
Content Selection Engine
  ↓ (selects items with frequency control)
Database Storage
  ↓ (saves 30 rows)
Success Response
  ↓ (returns to admin)
Admin sees confirmation
```

### Display Flow

```
Website Page Loads
  ↓ (requests today's content)
Web API Endpoint
  ↓ (queries database)
Database Lookup
  ↓ (finds today's row)
Returns JSONB Data
  ↓ (10 items ready)
Website Renders
  ↓ (displays all items)
User sees content
```

---

## Error Handling

### Common Scenarios

**Scenario 1: Not Enough Content**
- Problem: Requesting 30 days but only 20 quotes available
- Solution: System generates what it can, warns admin

**Scenario 2: Invalid Date**
- Problem: Admin picks invalid date (e.g., Feb 30)
- Solution: System validates and rejects with error message

**Scenario 3: No Schedule for Today**
- Problem: Website queries but no schedule exists
- Solution: Returns empty result, website shows fallback message

**Scenario 4: Database Error**
- Problem: Database connection fails
- Solution: Returns error, logs issue, admin notified

---

## Performance Considerations

### Generation Performance
- **30 days:** ~2-5 seconds
- **365 days:** ~30-60 seconds
- **Why:** Needs to select and package content for each day

### Query Performance
- **Today's shareables:** <100ms (instant)
- **Why:** Simple date lookup with index

### Report Performance
- **Monthly report:** <500ms
- **Yearly report:** <2 seconds
- **Why:** Indexed date queries are fast

---

## Security

### Admin Operations (Generate)
- **Authentication Required:** Only logged-in admins
- **Authorization:** CMS users only
- **Validation:** All inputs validated before processing

### Public Operations (Display)
- **No Authentication:** Public website access
- **Read-Only:** Can only query, never modify
- **Rate Limiting:** Prevents abuse

---

## Summary

**Three Main APIs:**
1. **Generate** - Admin creates schedule (POST)
2. **Get Today** - Website displays content (GET)
3. **Report** - Admin views schedule (GET)

**Key Characteristics:**
- Simple, focused endpoints
- Fast queries (indexed database)
- Pre-processed data (no complex joins)
- Error handling built-in
- Secure (admin vs public separation)

