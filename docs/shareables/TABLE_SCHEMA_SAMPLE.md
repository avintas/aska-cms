# Daily Shareables Motivational - Table Schema & Sample Data

## Table Structure

| Field | Type | Nullable | Sample Value | Description |
|-------|------|----------|--------------|-------------|
| **id** | BIGSERIAL | NOT NULL | `1` | Primary key - auto-incrementing |
| **publish_date** | DATE | NOT NULL | `2025-11-19` | The date this collection publishes (UNIQUE) |
| **items** | JSONB | NOT NULL | `[{...}, {...}]` | Array of motivational items (see below) |
| **code** | VARCHAR(50) | NULL | `2025-11-19-MOT` | Unique code identifier |
| **day_of_week** | INTEGER | NULL | `3` | 0=Sunday, 1=Monday, ..., 6=Saturday |
| **day_of_week_name** | VARCHAR(10) | NULL | `Wednesday` | Day name |
| **week_of_year** | INTEGER | NULL | `47` | ISO week number (1-53) |
| **month** | INTEGER | NULL | `11` | Month number (1-12) |
| **month_name** | VARCHAR(10) | NULL | `November` | Month name |
| **year** | INTEGER | NULL | `2025` | Year |
| **quarter** | INTEGER | NULL | `4` | Quarter (1-4) |
| **is_weekend** | BOOLEAN | NULL | `false` | True if Saturday or Sunday |
| **special_occasion** | VARCHAR(100) | NULL | `Halloween` | Special holiday/event |
| **special_season** | VARCHAR(100) | NULL | `Regular Season` | Hockey season type |
| **metadata** | JSONB | NULL | `{...}` | Flexible additional data |
| **created_at** | TIMESTAMPTZ | NOT NULL | `2025-01-20 10:30:00-05:00` | Creation timestamp |
| **updated_at** | TIMESTAMPTZ | NOT NULL | `2025-01-20 10:30:00-05:00` | Last update timestamp |

---

## Sample Row Data

### Example 1: Regular Weekday (Wednesday, November 19, 2025)

```json
{
  "id": 1,
  "publish_date": "2025-11-19",
  "code": "2025-11-19-MOT",
  "day_of_week": 3,
  "day_of_week_name": "Wednesday",
  "week_of_year": 47,
  "month": 11,
  "month_name": "November",
  "year": 2025,
  "quarter": 4,
  "is_weekend": false,
  "special_occasion": null,
  "special_season": "Regular Season",
  "metadata": {
    "tags": ["hockey", "motivation"],
    "notes": "Mid-week motivation boost"
  },
  "items": [
    {
      "id": 42,
      "quote": "The only way to do great work is to love what you do.",
      "author": "Wayne Gretzky",
      "context": "From his 1999 retirement speech",
      "theme": "legends",
      "category": "retirement",
      "attribution": "NHL Hall of Fame",
      "display_order": 1
    },
    {
      "id": 87,
      "quote": "You miss 100% of the shots you don't take.",
      "author": "Wayne Gretzky",
      "context": null,
      "theme": "legends",
      "category": "perseverance",
      "attribution": null,
      "display_order": 2
    }
    // ... 8 more items (total of 10 items)
  ],
  "created_at": "2025-01-20T10:30:00-05:00",
  "updated_at": "2025-01-20T10:30:00-05:00"
}
```

### Example 2: Special Occasion (Halloween, October 31, 2025)

```json
{
  "id": 45,
  "publish_date": "2025-10-31",
  "code": "2025-10-31-MOT",
  "day_of_week": 5,
  "day_of_week_name": "Friday",
  "week_of_year": 44,
  "month": 10,
  "month_name": "October",
  "year": 2025,
  "quarter": 4,
  "is_weekend": false,
  "special_occasion": "Halloween",
  "special_season": "Regular Season",
  "metadata": {
    "tags": ["halloween", "hockey", "spooky"],
    "theme_override": "Halloween-themed quotes",
    "notes": "Special Halloween collection"
  },
  "items": [
    {
      "id": 123,
      "quote": "The scariest thing in hockey is a player who never gives up.",
      "author": null,
      "context": "Halloween special",
      "theme": "modern",
      "category": "perseverance",
      "attribution": null,
      "display_order": 1
    }
    // ... 9 more items
  ],
  "created_at": "2025-01-20T10:30:00-05:00",
  "updated_at": "2025-01-20T10:30:00-05:00"
}
```

### Example 3: Weekend (Saturday, December 6, 2025)

```json
{
  "id": 78,
  "publish_date": "2025-12-06",
  "code": "2025-12-06-MOT",
  "day_of_week": 6,
  "day_of_week_name": "Saturday",
  "week_of_year": 49,
  "month": 12,
  "month_name": "December",
  "year": 2025,
  "quarter": 4,
  "is_weekend": true,
  "special_occasion": null,
  "special_season": "Regular Season",
  "metadata": {
    "tags": ["weekend", "hockey"],
    "weekend_boost": true
  },
  "items": [
    // ... 10 items
  ],
  "created_at": "2025-01-20T10:30:00-05:00",
  "updated_at": "2025-01-20T10:30:00-05:00"
}
```

### Example 4: Playoffs Season (May 15, 2025)

```json
{
  "id": 135,
  "publish_date": "2025-05-15",
  "code": "2025-05-15-MOT",
  "day_of_week": 4,
  "day_of_week_name": "Thursday",
  "week_of_year": 20,
  "month": 5,
  "month_name": "May",
  "year": 2025,
  "quarter": 2,
  "is_weekend": false,
  "special_occasion": null,
  "special_season": "Playoffs",
  "metadata": {
    "tags": ["playoffs", "championship", "intensity"],
    "playoff_round": "Conference Finals",
    "intensity_level": "high"
  },
  "items": [
    // ... 10 items focused on playoff/championship themes
  ],
  "created_at": "2025-01-20T10:30:00-05:00",
  "updated_at": "2025-01-20T10:30:00-05:00"
}
```

---

## Items JSONB Structure

Each item in the `items` array contains:

| Field | Type | Sample Value | Description |
|-------|------|--------------|-------------|
| **id** | number | `42` | Source item ID from `collection_motivational` |
| **quote** | string | `"You miss 100%..."` | The motivational quote text |
| **author** | string \| null | `"Wayne Gretzky"` | Author name (if available) |
| **context** | string \| null | `"From 1999 speech"` | Background context |
| **theme** | string \| null | `"legends"` | Theme category |
| **category** | string \| null | `"perseverance"` | Sub-category |
| **attribution** | string \| null | `"NHL Hall of Fame"` | Source attribution |
| **display_order** | number | `1` | Position in day's collection (1-based) |

---

## Query Examples

### Get today's shareables
```sql
SELECT * FROM daily_shareables_motivational 
WHERE publish_date = CURRENT_DATE;
```

### Get all weekends in a month
```sql
SELECT * FROM daily_shareables_motivational 
WHERE year = 2025 AND month = 11 AND is_weekend = true;
```

### Get special occasions
```sql
SELECT * FROM daily_shareables_motivational 
WHERE special_occasion IS NOT NULL 
ORDER BY publish_date;
```

### Get playoff season content
```sql
SELECT * FROM daily_shareables_motivational 
WHERE special_season = 'Playoffs'
ORDER BY publish_date;
```

### Get all Mondays in Q4
```sql
SELECT * FROM daily_shareables_motivational 
WHERE year = 2025 AND quarter = 4 AND day_of_week = 1;
```

