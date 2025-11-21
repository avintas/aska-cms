# Public Motivational API Documentation

## Overview

Public content API for accessing published motivational quotes from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming content on onlyhockey.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/motivational
```

---

## Endpoints

### 1. Get Random Motivational Quote

Returns a single random published motivational quote.

**Endpoint:** `GET /api/public/motivational/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "quote": "You miss 100% of the shots you don't take.",
    "context": "Wayne Gretzky's famous quote about taking chances and seizing opportunities",
    "theme": "Players",
    "category": null,
    "attribution": "Wayne Gretzky"
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/motivational/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomQuote = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/motivational/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest Motivational Quotes

Returns the latest published motivational quotes.

**Endpoint:** `GET /api/public/motivational/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 28,
      "quote": "Hard work beats talent when talent doesn't work hard.",
      "context": "A reminder that dedication and effort trump natural ability",
      "theme": "Players",
      "category": null,
      "attribution": "Tim Notke"
    },
    {
      "id": 27,
      "quote": "Champions keep playing until they get it right.",
      "context": null,
      "theme": "Teams & Organizations",
      "category": null,
      "attribution": "Billie Jean King"
    }
    // ... more entries
  ],
  "count": 10
}
```

**Example Usage:**

```javascript
// Get latest 5 motivational quotes
fetch("https://tango.yoursite.com/api/public/motivational/latest?limit=5")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get Motivational Quotes with Filters

Returns published motivational quotes with optional filters and pagination.

**Endpoint:** `GET /api/public/motivational?theme=Players&limit=20&offset=0`

**Query Parameters:**

- `theme` (optional) - Filter by theme (e.g., "Players", "Teams & Organizations", "Leadership & Staff")
- `category` (optional) - Filter by category
- `limit` (optional) - Number of entries per page (default: 20, max: 100)
- `offset` (optional) - Number of entries to skip for pagination (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 23,
      "quote": "The only way to prove you are a good sport is to lose.",
      "context": "About grace in defeat and sportsmanship",
      "theme": "Players",
      "category": null,
      "attribution": "Ernie Banks"
    },
    {
      "id": 18,
      "quote": "It's not whether you get knocked down, it's whether you get up.",
      "context": null,
      "theme": "Players",
      "category": null,
      "attribution": "Vince Lombardi"
    }
    // ... more entries
  ],
  "count": 13
}
```

**Example Usage:**

```javascript
// Get all motivational quotes with "Players" theme
fetch(
  "https://tango.yoursite.com/api/public/motivational?theme=Players&limit=50",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch("https://tango.yoursite.com/api/public/motivational?limit=20&offset=20")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Filter by theme with pagination
fetch(
  "https://tango.yoursite.com/api/public/motivational?theme=Teams%20%26%20Organizations&limit=10",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

## Features

✅ **Public & Open** - No authentication required  
✅ **CORS Enabled** - Works from any domain  
✅ **Published Only** - Only returns published motivational quotes (never drafts or archived)  
✅ **Clean Data** - Returns display-ready fields only  
✅ **Rate Limiting** - Max 100 entries per request to prevent abuse  
✅ **Cross-Origin** - Perfect for onlyhockey.com or any external site

---

## Data Fields

All endpoints return these fields:

| Field         | Type           | Description                                                                           |
| ------------- | -------------- | ------------------------------------------------------------------------------------- |
| `id`          | number         | Unique motivational quote ID                                                          |
| `quote`       | string         | The motivational quote or message text                                                |
| `context`     | string \| null | Optional background, context, or explanation                                          |
| `theme`       | string \| null | Theme classification (e.g., "Players", "Teams & Organizations", "Leadership & Staff") |
| `category`    | string \| null | Secondary classification                                                              |
| `attribution` | string \| null | Source attribution (player, coach, author, etc.)                                      |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, etc. are NOT exposed in the public API.

---

## Available Themes

Common themes you can filter by:

- **Players** - Individual growth, personal development, work ethic
- **Teams & Organizations** - Team unity, collective effort, commitment
- **Leadership & Staff** - Leadership, mentorship, inspiration
- **Awards & Honors** - Achievement, legacy, recognition

---

## Error Responses

**No Published Quotes Found:**

```json
{
  "success": false,
  "error": "No published motivational quotes found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch motivational quotes"
}
```

---

## Usage on onlyhockey.com

### Example: Display Random Quote on Homepage

```javascript
// onlyhockey.com Homepage
async function loadMotivationalQuote() {
  try {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/motivational/random",
    );
    const result = await response.json();

    if (result.success) {
      const quote = result.data;
      document.getElementById("quote-text").textContent = `"${quote.quote}"`;
      document.getElementById("quote-attribution").textContent =
        `— ${quote.attribution || "Unknown"}`;

      if (quote.context) {
        document.getElementById("quote-context").textContent = quote.context;
      }
    }
  } catch (error) {
    console.error("Failed to load motivational quote:", error);
  }
}

loadMotivationalQuote();
```

### Example: Motivational Quotes Archive Page

```javascript
// onlyhockey.com Motivational Archive Page
async function loadMotivationalArchive(theme = null) {
  const url = theme
    ? `https://tango.yoursite.com/api/public/motivational?theme=${encodeURIComponent(theme)}&limit=50`
    : "https://tango.yoursite.com/api/public/motivational/latest?limit=50";

  const response = await fetch(url);
  const result = await response.json();

  result.data.forEach((quote) => {
    const card = `
      <div class="quote-card">
        <blockquote class="quote">"${quote.quote}"</blockquote>
        ${quote.context ? `<p class="context">${quote.context}</p>` : ""}
        <p class="attribution">— ${quote.attribution || "Unknown"}</p>
        ${quote.theme ? `<span class="theme-badge">${quote.theme}</span>` : ""}
      </div>
    `;
    document.getElementById("quotes-list").innerHTML += card;
  });
}

loadMotivationalArchive();
```

### Example: Daily Motivational Quote Widget

```javascript
// Display one quote per day (using localStorage)
async function displayDailyQuote() {
  const today = new Date().toDateString();
  const cachedQuote = localStorage.getItem("daily-quote");
  const cachedDate = localStorage.getItem("daily-quote-date");

  if (cachedQuote && cachedDate === today) {
    // Use cached quote
    displayQuote(JSON.parse(cachedQuote));
  } else {
    // Fetch new quote
    const response = await fetch(
      "https://tango.yoursite.com/api/public/motivational/random",
    );
    const result = await response.json();

    if (result.success) {
      localStorage.setItem("daily-quote", JSON.stringify(result.data));
      localStorage.setItem("daily-quote-date", today);
      displayQuote(result.data);
    }
  }
}

function displayQuote(quote) {
  document.getElementById("daily-quote").innerHTML = `
    <p class="text-xl font-bold">"${quote.quote}"</p>
    <p class="text-sm text-gray-600 mt-2">— ${quote.attribution || "Unknown"}</p>
  `;
}

displayDailyQuote();
```

---

## React/Next.js Integration

### Example: Random Quote Component

```tsx
"use client";

import { useState, useEffect } from "react";

interface MotivationalQuote {
  id: number;
  quote: string;
  context?: string | null;
  theme?: string | null;
  attribution?: string | null;
}

export default function MotivationalQuote() {
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://tango.yoursite.com/api/public/motivational/random",
      );
      const result = await response.json();

      if (result.success) {
        setQuote(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch quote:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white">
      <blockquote className="text-2xl font-bold mb-3">
        &quot;{quote.quote}&quot;
      </blockquote>
      {quote.context && (
        <p className="text-sm opacity-90 mb-3">{quote.context}</p>
      )}
      <p className="text-sm font-medium">— {quote.attribution || "Unknown"}</p>
      <button
        onClick={fetchQuote}
        className="mt-4 px-4 py-2 bg-white text-indigo-600 rounded-md text-sm font-semibold hover:bg-gray-100"
      >
        Get New Quote
      </button>
    </div>
  );
}
```

### Example: Theme-Based Quote List

```tsx
"use client";

import { useState, useEffect } from "react";

interface MotivationalQuote {
  id: number;
  quote: string;
  context?: string | null;
  theme?: string | null;
  attribution?: string | null;
}

export default function MotivationalByTheme({ theme }: { theme: string }) {
  const [quotes, setQuotes] = useState<MotivationalQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch(
          `https://tango.yoursite.com/api/public/motivational?theme=${encodeURIComponent(theme)}&limit=20`,
        );
        const result = await response.json();

        if (result.success) {
          setQuotes(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [theme]);

  if (loading) {
    return <div>Loading quotes...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{theme} Motivational Quotes</h2>
      <div className="grid gap-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="p-4 bg-white rounded-lg shadow">
            <p className="text-lg font-semibold">&quot;{quote.quote}&quot;</p>
            {quote.context && (
              <p className="text-sm text-gray-600 mt-2">{quote.context}</p>
            )}
            <p className="text-sm text-gray-700 mt-2">
              — {quote.attribution || "Unknown"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// Motivational Quote Type
export interface MotivationalQuote {
  id: number;
  quote: string;
  context?: string | null;
  theme?: string | null;
  category?: string | null;
  attribution?: string | null;
}

// API Response Types
export interface MotivationalApiResponse {
  success: boolean;
  data?: MotivationalQuote | MotivationalQuote[];
  count?: number;
  error?: string;
}

// Fetch Params
export interface MotivationalFetchParams {
  theme?: string;
  category?: string;
  limit?: number;
  offset?: number;
}
```

---

## Performance Tips

1. **Caching**: Cache responses for 5-10 minutes to reduce API calls
2. **Pagination**: Use `limit` and `offset` for large result sets
3. **Theme Filtering**: Pre-filter by theme to get more targeted content
4. **Daily Quotes**: Use localStorage to show the same quote all day

```javascript
// Example: Simple caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cache = { data: null, timestamp: 0 };

async function getCachedQuote() {
  const now = Date.now();

  if (cache.data && now - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const response = await fetch(
    "https://tango.yoursite.com/api/public/motivational/random",
  );
  const result = await response.json();

  cache = { data: result.data, timestamp: now };
  return result.data;
}
```

---

## Troubleshooting

### CORS Errors

The API has CORS enabled. If you're getting CORS errors:

1. Check that you're using the correct API domain
2. Verify your request doesn't include authentication headers
3. Test the endpoint directly in your browser

### No Results Returned

If you get an empty array:

1. Check that quotes are published (not draft/archived) in Tango CMS
2. Verify the theme filter matches existing themes exactly
3. Try the `/random` endpoint first to confirm quotes exist

### Rate Limiting

- Maximum 100 results per request
- Consider implementing client-side caching
- Use pagination for large datasets

---

## Questions?

This is a public content API - feel free to use it however you like! The API automatically filters to only show published content, so you never have to worry about seeing drafts or internal data.

For questions about the Tango CMS or adding new motivational quotes, contact the CMS team.

---

**Last Updated:** October 29, 2025
