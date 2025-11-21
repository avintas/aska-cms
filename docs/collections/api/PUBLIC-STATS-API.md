# Public Stats API Documentation

## Overview

Public content API for accessing published hockey statistics from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming stats on OnlyHockey.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/stats
```

---

## Endpoints

### 1. Get Random Stat

Returns a single random published stat.

**Endpoint:** `GET /api/public/stats/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "stat_text": "Wayne Gretzky scored 894 goals in his NHL career",
    "stat_value": "894 goals",
    "stat_category": "player",
    "year": 1999,
    "theme": "scoring",
    "category": "career",
    "attribution": "NHL Official Stats"
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/stats/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomStat = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/stats/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest Stats

Returns the latest published stats.

**Endpoint:** `GET /api/public/stats/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 58,
      "stat_text": "Connor McDavid reached 1000 career points in 659 games",
      "stat_value": "1000 points in 659 games",
      "stat_category": "player",
      "year": 2023,
      "theme": "milestones",
      "category": "NHL",
      "attribution": "NHL.com"
    },
    {
      "id": 57,
      "stat_text": "The Montreal Canadiens have won 24 Stanley Cups",
      "stat_value": "24 Stanley Cups",
      "stat_category": "team",
      "year": null,
      "theme": "championships",
      "category": "historical",
      "attribution": "Hockey Reference"
    }
  ],
  "count": 2
}
```

**Example Usage:**

```javascript
// Get latest 5 stats
fetch("https://tango.yoursite.com/api/public/stats/latest?limit=5")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get Stats with Filters & Pagination

Returns published stats with filtering and pagination support.

**Endpoint:** `GET /api/public/stats?stat_category=player&limit=20&offset=0`

**Query Parameters:**

- `theme` (optional) - Filter by theme (e.g., "scoring", "defense", "records")
- `category` (optional) - Filter by category (e.g., "NHL", "playoffs", "season")
- `stat_category` (optional) - Filter by stat category (e.g., "player", "team", "league", "historical")
- `year` (optional) - Filter by year
- `limit` (optional) - Number of entries per page (default: 20, max: 100)
- `offset` (optional) - Number of entries to skip for pagination (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 35,
      "stat_text": "Alex Ovechkin has scored 800+ career goals",
      "stat_value": "800+ goals",
      "stat_category": "player",
      "year": 2023,
      "theme": "scoring",
      "category": "career",
      "attribution": "NHL.com"
    }
  ],
  "count": 1
}
```

**Example Usage:**

```javascript
// Get player stats
fetch(
  "https://tango.yoursite.com/api/public/stats?stat_category=player&limit=20",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Get stats from specific year
fetch("https://tango.yoursite.com/api/public/stats?year=2023&limit=10")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Get stats by theme
fetch("https://tango.yoursite.com/api/public/stats?theme=scoring&limit=15")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch("https://tango.yoursite.com/api/public/stats?limit=20&offset=20")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

## Features

✅ **Public & Open** - No authentication required  
✅ **CORS Enabled** - Works from any domain  
✅ **Published Only** - Only returns published stats (never drafts or archived)  
✅ **Flexible Filtering** - Filter by category, theme, year, and more  
✅ **Clean Data** - Returns display-ready fields only  
✅ **Rate Limiting** - Max 100 entries per request to prevent abuse  
✅ **Cross-Origin** - Perfect for OnlyHockey.com or any external site

---

## Data Fields

All endpoints return these fields:

| Field           | Type           | Description                                                     |
| --------------- | -------------- | --------------------------------------------------------------- |
| `id`            | number         | Unique stat ID                                                  |
| `stat_text`     | string         | The full statistical statement                                  |
| `stat_value`    | string \| null | The actual numeric value/stat (e.g., "894 goals")               |
| `stat_category` | string \| null | Type of statistic: "player", "team", "league", "historical"     |
| `year`          | number \| null | Year the stat is from (if applicable)                           |
| `theme`         | string \| null | Thematic classification (e.g., "scoring", "defense", "records") |
| `category`      | string \| null | Secondary classification (e.g., "NHL", "playoffs", "season")    |
| `attribution`   | string \| null | Source attribution (e.g., "NHL Official Stats")                 |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, `used_in`, etc. are NOT exposed in the public API.

---

## Error Responses

**No Published Stats Found:**

```json
{
  "success": false,
  "error": "No published stats found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch stats"
}
```

---

## Usage on OnlyHockey.com

### Example: Display Random Stat on Homepage

```javascript
// OnlyHockey Homepage
async function loadRandomStat() {
  try {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/stats/random",
    );
    const result = await response.json();

    if (result.success) {
      const stat = result.data;
      document.getElementById("stat-text").textContent = stat.stat_text;
      if (stat.stat_value) {
        document.getElementById("stat-value").textContent = stat.stat_value;
      }
      if (stat.attribution) {
        document.getElementById("stat-source").textContent =
          `Source: ${stat.attribution}`;
      }
    }
  } catch (error) {
    console.error("Failed to load stat:", error);
  }
}

loadRandomStat();
```

### Example: Stats Carousel by Category

```javascript
// OnlyHockey Player Stats Carousel
async function loadPlayerStats() {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/stats?stat_category=player&limit=10",
  );
  const result = await response.json();

  result.data.forEach((stat) => {
    // Render each stat in carousel
    const slide = `
      <div class="stat-slide">
        <p class="stat-text">${stat.stat_text}</p>
        ${stat.stat_value ? `<div class="stat-value">${stat.stat_value}</div>` : ""}
        ${stat.year ? `<span class="stat-year">${stat.year}</span>` : ""}
        ${stat.attribution ? `<cite class="source">${stat.attribution}</cite>` : ""}
      </div>
    `;
    document.getElementById("stats-carousel").innerHTML += slide;
  });
}
```

### Example: Historical Stats Widget

```html
<div id="historical-stats-widget">
  <h3>Hockey History</h3>
  <div id="stats-container"></div>
  <button onclick="loadHistoricalStats()">Load More</button>
</div>

<script>
  async function loadHistoricalStats() {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/stats?stat_category=historical&limit=5",
    );
    const result = await response.json();

    if (result.success) {
      const container = document.getElementById("stats-container");
      result.data.forEach((stat) => {
        const statCard = `
          <div class="stat-card">
            <p>${stat.stat_text}</p>
            ${stat.stat_value ? `<strong>${stat.stat_value}</strong>` : ""}
          </div>
        `;
        container.innerHTML += statCard;
      });
    }
  }

  // Load on page load
  loadHistoricalStats();
</script>
```

### Example: Year Filter Widget

```javascript
// Stats by Year
async function loadStatsByYear(year) {
  const response = await fetch(
    `https://tango.yoursite.com/api/public/stats?year=${year}&limit=20`,
  );
  const result = await response.json();

  if (result.success) {
    displayStats(result.data);
  }
}

// Year selector
document.getElementById("year-selector").addEventListener("change", (e) => {
  loadStatsByYear(e.target.value);
});
```

---

## React/Next.js Example

```typescript
// components/RandomStat.tsx
'use client';

import { useState, useEffect } from 'react';

interface Stat {
  id: number;
  stat_text: string;
  stat_value?: string | null;
  stat_category?: string | null;
  year?: number | null;
  theme?: string | null;
  category?: string | null;
  attribution?: string | null;
}

export default function RandomStat() {
  const [stat, setStat] = useState<Stat | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStat = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://tango.yoursite.com/api/public/stats/random');
      const result = await response.json();
      if (result.success) {
        setStat(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStat();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stat) return null;

  return (
    <div className="stat-widget">
      <p className="stat-text">{stat.stat_text}</p>
      {stat.stat_value && (
        <div className="stat-value">{stat.stat_value}</div>
      )}
      <div className="stat-meta">
        {stat.stat_category && (
          <span className="badge">{stat.stat_category}</span>
        )}
        {stat.year && <span className="year">{stat.year}</span>}
      </div>
      {stat.attribution && (
        <cite className="attribution">{stat.attribution}</cite>
      )}
      <button onClick={fetchStat}>New Stat</button>
    </div>
  );
}
```

### Example: Stats List Component

```typescript
// components/StatsList.tsx
'use client';

import { useState, useEffect } from 'react';

interface Stat {
  id: number;
  stat_text: string;
  stat_value?: string | null;
  stat_category?: string | null;
  year?: number | null;
  theme?: string | null;
  attribution?: string | null;
}

interface StatsListProps {
  category?: string;
  theme?: string;
  limit?: number;
}

export default function StatsList({ category, theme, limit = 10 }: StatsListProps) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let url = `https://tango.yoursite.com/api/public/stats/latest?limit=${limit}`;
        if (category) url += `&stat_category=${category}`;
        if (theme) url += `&theme=${theme}`;

        const response = await fetch(url);
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [category, theme, limit]);

  if (loading) return <div>Loading stats...</div>;

  return (
    <div className="stats-list">
      {stats.map((stat) => (
        <div key={stat.id} className="stat-item">
          <p>{stat.stat_text}</p>
          {stat.stat_value && <strong>{stat.stat_value}</strong>}
          {stat.year && <span className="year">({stat.year})</span>}
        </div>
      ))}
    </div>
  );
}
```

---

## ⚡ Performance Tips

1. **Cache responses** - Stats don't change frequently, cache for 10-15 minutes
2. **Use filters** - More efficient than fetching all stats and filtering client-side
3. **Use `latest` for lists** - More efficient than fetching random multiple times
4. **Pagination** - Use `limit` and `offset` for large lists
5. **Error handling** - Always check `result.success` before using `result.data`

---

## 🔧 Troubleshooting

### CORS Error?

The API has CORS enabled. If you get CORS errors, contact the Tango team.

### 404 Error?

Check that you're using the correct domain and path:

- ✅ `https://tango.example.com/api/public/stats/random`
- ❌ `https://tango.example.com/stats/random`

### Empty Response?

Make sure stats are **published** in Tango CMS (not draft or archived).

### Filter Not Working?

Double-check parameter names:

- `stat_category` (not `category` alone)
- `theme`
- `category`
- `year`

---

## 📞 Questions?

If you need:

- New endpoints (e.g., search, by ID)
- Additional data fields
- Different response formats
- Rate limiting adjustments

Contact the Tango CMS team!

---

## 🎁 Related APIs

- **Wisdom API**: `/api/public/wisdom` - Philosophical musings
- **Greetings API**: `/api/public/greetings` - Hockey Universal Greetings
- **Hero Collections API**: `/api/hero-collections/default` - Curated content collections
- **Motivational API**: Coming soon

---

## ✅ Quick Start Checklist

1. Replace `https://tango.yoursite.com` with actual domain
2. Test endpoints in browser
3. Choose your filtering strategy (category, theme, year)
4. Use example code to build features
5. Deploy and enjoy! 🎉

---

**Last Updated:** October 29, 2025  
**Status:** Production Ready
