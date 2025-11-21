# Shareables Calendarization System - Business Overview

## What This System Does

Think of this system as a **content factory** that pre-packages your shareables into daily "gift boxes" that are ready to open and display on your website.

### The Big Picture

1. **You create content** (motivational quotes) in your CMS
2. **You schedule it** by telling the system: "Generate 30 days starting January 1st"
3. **The system packages it** - selects 10 items per day, stores them ready-to-go
4. **Your website displays it** - just opens today's "gift box" and shows the 10 items

No daily work needed. Generate once, display automatically.

---

## Database Structure: The Storage System

### Table Name: `daily_shareables_motivational`

**What it stores:** One row = one day's complete collection of motivational shareable items (flexible count)

**Think of it like:** A calendar where each day has a box with 10 motivational items already inside

**Future:** Separate tables for other content types (`daily_shareables_wisdom`, `daily_shareables_stats`, `daily_shareables_greetings`)

### The Fields (Columns)

| Field Name       | What It Means                                                | Example                      |
| ---------------- | ------------------------------------------------------------ | ---------------------------- |
| **publish_date** | The date these items will appear on your website             | January 15, 2025             |
| **items**        | The actual motivational items, completely packaged and ready | [Item 1, Item 2, ... Item N] |
| **created_at**   | When you created this schedule                               | January 10, 2025 10:30 AM    |
| **updated_at**   | When you last regenerated this day                           | January 12, 2025 2:15 PM     |

### Key Concept: Pre-Processed Storage

**What "pre-processed" means:**

- All the content is already packaged inside the `items` field
- Your website doesn't need to look up anything else
- It's like a canned report - just open and display

**Why this matters:**

- Fast: Website just grabs one row and displays it
- Simple: No complex lookups or joins
- Reliable: Everything needed is already there

---

## Data Types: What Information We Track

### Daily Shareable Item Structure

Each of the 10 items in a day contains:

- **Quote** - The motivational text
- **Author** - Who said it (if known)
- **Context** - Background information (if available)
- **Theme** - Category (e.g., "legends", "modern", "history")
- **Category** - Sub-category
- **Attribution** - Source information
- **Display Order** - Which position (1-10) in the day's collection

**All of this is stored together** in the `items` field as a complete package.

---

## API Backend: How The System Works

### High-Level Flow

```
Admin Action → System Processing → Database Storage → Website Display
```

### The Two Main Operations

#### 1. **Generation** (Admin Creates Schedule)

**What happens:**

- Admin picks: "Start January 1st, generate 30 days"
- System calculates: January 1-30 (30 consecutive dates)
- For each date:
  - System looks at all available motivational quotes
  - Picks 10 items (ensuring even distribution - no item appears too often)
  - Packages complete content into JSONB format
  - Saves one row per day in database
- Result: 30 rows in the table, ready to go

**Business benefit:** One click, 30 days scheduled. No daily work.

#### 2. **Display** (Website Shows Content)

**What happens:**

- Website asks: "What should I show today?"
- System looks up: Today's date in the table
- Returns: The 10 pre-packaged items
- Website displays: All 10 items immediately

**Business benefit:** Automatic. No manual publishing needed.

---

## Date Handling: How We Work With Dates

### The Calendar System

**What the system understands:**

- **Consecutive dates** - If you start January 1st and want 30 days, it knows: Jan 1, Jan 2, Jan 3... Jan 30
- **Month boundaries** - It knows January has 31 days, February has 28 (or 29 in leap years)
- **Leap years** - Handles February 29th correctly
- **Date ranges** - Can generate any number of days (7, 30, 365, etc.)

### How Dates Work in Practice

**Example 1: Monthly Schedule**

- You pick: Start date = February 1, 2025
- You request: 28 days
- System generates: Feb 1 - Feb 28 (exactly one month)
- Result: 28 rows in database

**Example 2: Cross-Month Schedule**

- You pick: Start date = January 25, 2025
- You request: 30 days
- System generates: Jan 25 - Jan 31 (7 days), then Feb 1 - Feb 23 (23 days)
- Result: 30 rows spanning two months

**Example 3: Yearly Schedule**

- You pick: Start date = January 1, 2025
- You request: 365 days
- System generates: All 365 days of the year
- Result: 365 rows (handles leap year if applicable)

### Date Storage Format

**In the database:** Dates are stored as `DATE` type (e.g., "2025-01-15")
**Why this matters:**

- Easy to query: "Get today's shareables" = simple date match
- No timezone confusion: Just the date, no time component
- Calendar-friendly: Works perfectly with calendar displays

---

## Frequency Control: Ensuring Fair Distribution

### The Problem

If you have 100 motivational quotes and need to fill 300 slots (30 days × 10 items), you don't want the same 10 quotes appearing every day.

### The Solution: Even Distribution

**How it works:**

- System calculates: "Total slots ÷ total quotes = each quote appears ~X times"
- During generation, system tracks: "Quote #5 has been used Y times so far"
- System ensures: Even distribution across all days
- Result: Fair distribution - every quote gets used roughly equally

**Business benefit:** Your content library gets full exposure, not just the same items repeating.

---

## Content Release Report: Seeing Your Schedule

### Calendar Grid View

**What you see:**

- A monthly calendar (like a wall calendar)
- Each day shows:
  - ✅ Green dot = Has scheduled content
  - ⚪ Empty = No content scheduled
  - Number = How many items (always 10 when scheduled)
- Click a day = See the 10 items for that day

**Business benefit:** Visual overview of your entire schedule at a glance.

### List View

**What you see:**

- Table showing all scheduled dates
- Columns: Date | Content Type | Items Count | Created Date
- Sortable: By date, by creation date
- Filterable: Show specific date ranges

**Business benefit:** Detailed list view for planning and review.

---

## Regeneration: Updating Your Schedule

### How It Works

**Scenario:** You generated 30 days, but now you have new content and want to refresh.

**Process:**

1. Go to generation page
2. Pick same start date (e.g., January 1st)
3. Pick same number of days (30)
4. Click "Generate"
5. System **overwrites** existing dates with new selections

**What "overwrite" means:**

- Old schedule for those dates is replaced
- New content is selected (including your new items)
- Frequency control recalculates for fresh distribution

**Business benefit:** Easy to refresh schedules as your content library grows.

---

## Phase 1 Scope: Motivational Content Only

### What's Included

- ✅ Generate schedules for motivational quotes only
- ✅ Store pre-processed collections
- ✅ Display on website
- ✅ Content release report
- ✅ Frequency control

### What's Coming Later

- ⏳ Wisdom content
- ⏳ Stats content
- ⏳ Greetings content
- ⏳ Mixed content (daily soup)
- ⏳ Advanced rules and filters

**Why start with one type:** Build the pattern, then replicate it for other content types.

---

## Summary: The Business Value

### Before This System

- ❌ Manual daily publishing
- ❌ No visibility into future schedule
- ❌ Risk of repeating same content too often
- ❌ Time-consuming daily tasks

### After This System

- ✅ Generate weeks/months in advance
- ✅ Visual calendar of entire schedule
- ✅ Automatic fair distribution
- ✅ One-time setup, automatic display
- ✅ Easy regeneration when needed

**Bottom line:** Schedule once, display automatically. Focus on creating content, not managing daily publishing.
