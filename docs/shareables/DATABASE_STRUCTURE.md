# Daily Shareables - Database Structure

## Table: `daily_shareables_motivational`

**Phase 1:** Motivational content only  
**Future:** Will create `daily_shareables_wisdom`, `daily_shareables_stats`, `daily_shareables_greetings`

### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│            daily_shareables_motivational                     │
├─────────────────────────────────────────────────────────────┤
│ publish_date (DATE)          │ PRIMARY KEY                  │
│                               │ One row per day              │
├─────────────────────────────────────────────────────────────┤
│ items (JSONB)                 │ Complete array of 10 items   │
│                               │ Pre-processed, ready to go   │
├─────────────────────────────────────────────────────────────┤
│ created_at (TIMESTAMP)        │ When schedule was created    │
├─────────────────────────────────────────────────────────────┤
│ updated_at (TIMESTAMP)        │ When schedule was updated    │
└─────────────────────────────────────────────────────────────┘
```

### Example Row

**publish_date:** `2025-01-15`  
**items:** (JSONB containing 10 complete motivational items - see below)  
**created_at:** `2025-01-10 10:30:00`  
**updated_at:** `2025-01-10 10:30:00`

---

## JSONB Structure: What's Inside `items`

### Visual Representation

```
items: [
  {
    id: 123,
    quote: "The harder you work, the harder it is to surrender.",
    author: "Wayne Gretzky",
    context: "From 1980s interview",
    theme: "legends",
    category: "perseverance",
    attribution: "Hockey Hall of Fame",
    display_order: 1
  },
  {
    id: 456,
    quote: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    context: null,
    theme: "legends",
    category: "motivation",
    attribution: null,
    display_order: 2
  },
  // ... 8 more items (3-10)
]
```

### Key Points

- **Array of 10 objects** - Always exactly 10 items per day
- **Complete content** - All fields included (quote, author, context, etc.)
- **Display order** - Numbered 1-10 for positioning
- **No lookups needed** - Everything is self-contained

---

## Indexes: How We Find Data Fast

### Index 1: Date Lookup
**Purpose:** Find today's shareables instantly  
**How it works:** Like an index in a book - jump straight to the date

### Index 2: JSONB Search
**Purpose:** Search within the items if needed later  
**How it works:** Allows searching inside the JSONB content

---

## Constraints: Data Rules

### Rule 1: One Collection Per Day
- **Primary Key:** `publish_date`
- **Effect:** Can't have two collections for the same date
- **Why:** Ensures clean, predictable data

### Rule 2: Table Per Content Type
- **Phase 1:** `daily_shareables_motivational` only
- **Future:** Separate tables for each content type
- **Why:** Follows existing pattern (`collection_motivational`, `collection_wisdom`, etc.)

---

## Query Examples: How We Use The Table

### Query 1: Get Today's Shareables
```sql
SELECT items 
FROM daily_shareables_motivational 
WHERE publish_date = CURRENT_DATE
```

**Result:** One row with today's 10 items ready to display

### Query 2: Get Date Range (For Report)
```sql
SELECT * 
FROM daily_shareables_motivational 
WHERE publish_date >= '2025-01-01' 
AND publish_date <= '2025-01-31'
ORDER BY publish_date
```

**Result:** All scheduled days in January

### Query 3: Check Coverage
```sql
SELECT COUNT(*) 
FROM daily_shareables_motivational 
WHERE publish_date >= CURRENT_DATE
```

**Result:** How many days are scheduled going forward

---

## Data Flow: From Generation to Display

```
1. ADMIN GENERATES SCHEDULE
   ↓
   System creates rows in daily_shareables
   Each row = one day with 10 items
   ↓
2. DATA STORED IN DATABASE
   ↓
   Table contains pre-processed collections
   Ready to query and display
   ↓
3. WEBSITE QUERIES TODAY'S DATE
   ↓
   Gets one row with 10 items
   ↓
4. WEBSITE DISPLAYS
   ↓
   Shows all 10 items immediately
   No additional processing needed
```

---

## Storage Efficiency

### Why JSONB?

**JSONB = JSON Binary**
- **Efficient storage** - Compressed format
- **Fast queries** - Indexed for performance  
- **Flexible structure** - Can store complex data
- **PostgreSQL native** - Optimized for this database

### Size Estimate

**Per day:**
- Date: ~10 bytes
- Content type: ~15 bytes
- Items (10 items with full content): ~2-5 KB
- Timestamps: ~16 bytes
- **Total per row:** ~3-6 KB

**For 365 days:** ~1-2 MB total (very manageable)

---

## Summary

**Table Name:** `daily_shareables_motivational`  
**Purpose:** Store pre-processed daily motivational collections  
**Structure:** One row = one day = 10 items  
**Key Feature:** Complete content in JSONB (no joins needed)  
**Query Pattern:** Simple date lookup for today's content  
**Future:** Separate tables for wisdom, stats, greetings (following existing pattern)

