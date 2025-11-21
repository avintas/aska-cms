# Public Hero Collections API Documentation

## Overview

Public content API for accessing published hero collections from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming curated content collections on omnipaki.com.

---

## Base URL

```
https://your-tango-cms-domain.com/api/hero-collections
```

---

## What are Hero Collections?

Hero Collections are curated sets of **7 content items** designed for the hero/landing section of omnipaki.com. Each collection contains a balanced mix of:

- 2 motivational items
- 2 statistic items
- 2 wisdom items
- 1 greeting item

Collections rotate randomly on each page load, with smart "recent history" exclusion to prevent repetition.

---

## Endpoints

### 1. Get Random Collection (Default)

Returns a random active hero collection with 7 content items.

**Endpoint:** `GET /api/hero-collections/default`

**Query Parameters:**

- `exclude` (optional) - Comma-separated collection IDs to exclude from selection
  - Example: `?exclude=1,5,12`
  - Use this to prevent showing recently viewed collections

**Response:**

```json
{
  "collection_id": 5,
  "collection_name": "Legendary Motivation",
  "description": "Inspirational quotes from hockey legends",
  "content": [
    {
      "id": 1,
      "content_text": "Hockey teaches us that every shift matters",
      "content_type": "motivational",
      "theme": "dedication",
      "attribution": null
    },
    {
      "id": 2,
      "content_text": "Did you know the first hockey puck was made of wood?",
      "content_type": "statistics",
      "theme": "history",
      "attribution": null
    }
    // ... 5 more items (7 total)
  ],
  "count": 7,
  "total_available": 24
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/hero-collections/default")
  .then((res) => res.json())
  .then((data) => {
    const collection = data;
    console.log(`Collection: ${collection.collection_name}`);
    console.log(`Items: ${collection.count}`);
    collection.content.forEach((item) => {
      console.log(`${item.content_type}: ${item.content_text}`);
    });
  });

// With exclusion (prevent recent repeats)
const recentIds = [1, 3, 7]; // Collections already shown
fetch(
  `https://tango.yoursite.com/api/hero-collections/default?exclude=${recentIds.join(",")}`,
)
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

### 2. Get Specific Collection by ID

Returns a specific hero collection by ID (useful for preview/testing).

**Endpoint:** `GET /api/hero-collections/:id`

**Response:**

```json
{
  "collection_id": 12,
  "collection_name": "Morning Motivation",
  "description": "Start your day strong",
  "active": true,
  "content": [
    // ... 7 content items
  ],
  "count": 7
}
```

**Example Usage:**

```javascript
// Get collection with ID 12
fetch("https://tango.yoursite.com/api/hero-collections/12")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Features

✅ **Public & Open** - No authentication required  
✅ **CORS Enabled** - Works from any domain  
✅ **Active Only** - Only returns active collections  
✅ **Balanced Content** - Each collection has a curated mix of 7 items  
✅ **Smart Exclusion** - Prevent showing same collections repeatedly  
✅ **Self-Contained** - All content included (no additional queries needed)

---

## Data Fields

### Collection Response

| Field             | Type           | Description                                          |
| ----------------- | -------------- | ---------------------------------------------------- |
| `collection_id`   | number         | Unique collection ID                                 |
| `collection_name` | string         | Name of the collection                               |
| `description`     | string \| null | Optional description                                 |
| `content`         | ContentItem[]  | Array of 7 content items                             |
| `count`           | number         | Number of items (always 7)                           |
| `total_available` | number         | Total active collections available                   |
| `active`          | boolean        | Whether collection is active (only in /:id endpoint) |

### Content Item Fields

| Field          | Type           | Description                                              |
| -------------- | -------------- | -------------------------------------------------------- |
| `id`           | number         | Content item ID                                          |
| `content_text` | string         | The actual content text                                  |
| `content_type` | string         | Type: 'motivational', 'statistics', 'wisdom', 'greeting' |
| `theme`        | string         | Theme category                                           |
| `attribution`  | string \| null | Source attribution                                       |

---

## Error Responses

**No Active Collections Available:**

```json
{
  "error": "No active collections available",
  "available_collections": 0
}
```

**Collection Not Found (/:id endpoint):**

```json
{
  "error": "Collection not found",
  "id": 999
}
```

**Server Error:**

```json
{
  "error": "Internal server error"
}
```

---

## Usage on omnipaki.com

### Example: Hero Section with Random Collection

```javascript
// omnipaki.com - Hero Section
async function loadHeroCollection() {
  try {
    // Get recently viewed collections from localStorage
    const recentIds = JSON.parse(
      localStorage.getItem("recentHeroCollections") || "[]",
    );

    // Keep only last 5
    const last5 = recentIds.slice(-5);

    // Build API URL with exclusions
    const excludeParam = last5.length > 0 ? `?exclude=${last5.join(",")}` : "";
    const response = await fetch(
      `https://tango.yoursite.com/api/hero-collections/default${excludeParam}`,
    );

    const data = await response.json();

    if (data.error) {
      console.error("Failed to load collection:", data.error);
      return;
    }

    // Save this collection ID to history
    const newHistory = [...recentIds, data.collection_id];
    localStorage.setItem("recentHeroCollections", JSON.stringify(newHistory));

    // Render the collection
    renderHeroContent(data.content);
  } catch (error) {
    console.error("Failed to load hero collection:", error);
  }
}

function renderHeroContent(content) {
  const container = document.getElementById("hero-content");
  container.innerHTML = "";

  content.forEach((item, index) => {
    const itemHTML = `
      <div class="hero-item" data-type="${item.content_type}">
        <span class="emoji">${getEmoji(item.content_type)}</span>
        <p class="content-text">${item.content_text}</p>
        ${item.attribution ? `<cite>${item.attribution}</cite>` : ""}
      </div>
    `;
    container.innerHTML += itemHTML;
  });
}

function getEmoji(type) {
  const emojiMap = {
    motivational: "🔥",
    statistics: "📊",
    wisdom: "💎",
    greeting: "👋",
  };
  return emojiMap[type] || "📝";
}

// Load on page load
loadHeroCollection();
```

---

### Example: Refresh Button

```javascript
// Add refresh button to get new collection
function refreshHeroContent() {
  const refreshBtn = document.getElementById("refresh-hero-btn");
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Loading...";

    await loadHeroCollection();

    refreshBtn.disabled = false;
    refreshBtn.textContent = "🎲 Show Me More";
  });
}
```

---

## React/Next.js Example

```typescript
// components/HeroSection.tsx
'use client';

import { useState, useEffect } from 'react';

interface ContentItem {
  id: number;
  content_text: string;
  content_type: string;
  theme: string;
  attribution: string | null;
}

interface HeroCollection {
  collection_id: number;
  collection_name: string;
  description: string | null;
  content: ContentItem[];
  count: number;
  total_available: number;
}

export default function HeroSection() {
  const [collection, setCollection] = useState<HeroCollection | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCollection = async () => {
    setLoading(true);
    try {
      // Get recent collection IDs from localStorage
      const recentIds = JSON.parse(
        localStorage.getItem('recentHeroCollections') || '[]'
      );
      const last5 = recentIds.slice(-5);

      // Build URL with exclusions
      const excludeParam = last5.length > 0 ? `?exclude=${last5.join(',')}` : '';
      const response = await fetch(
        `https://tango.yoursite.com/api/hero-collections/default${excludeParam}`
      );

      const data = await response.json();

      if (!data.error) {
        setCollection(data);

        // Save to history
        const newHistory = [...recentIds, data.collection_id];
        localStorage.setItem('recentHeroCollections', JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error('Failed to fetch hero collection:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  if (loading) {
    return <div className="hero-loading">Loading...</div>;
  }

  if (!collection) {
    return <div className="hero-error">Failed to load content</div>;
  }

  return (
    <section className="hero-section">
      <h1>THERE IS ONLY HOCKEY!</h1>
      <p className="tagline">LOVE FOR THE GAME IS ALL YOU NEED</p>

      <div className="get-in-the-game">
        <h2>Get in the Game</h2>

        <div className="content-list">
          {collection.content.map((item, index) => (
            <HeroContentItem key={item.id} item={item} index={index} />
          ))}
        </div>

        <button onClick={fetchCollection} className="refresh-btn">
          🎲 Show Me More
        </button>
      </div>
    </section>
  );
}

function HeroContentItem({ item }: { item: ContentItem }) {
  const getEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      motivational: '🔥',
      statistics: '📊',
      wisdom: '💎',
      greeting: '👋',
    };
    return emojiMap[type] || '📝';
  };

  return (
    <div className="hero-content-item" data-type={item.content_type}>
      <span className="emoji">{getEmoji(item.content_type)}</span>
      <p className="content-text">{item.content_text}</p>
      {item.attribution && <cite>{item.attribution}</cite>}
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// types/hero-collections.ts

export interface ContentItem {
  id: number;
  content_text: string;
  content_type: "motivational" | "statistics" | "wisdom" | "greeting";
  theme: string;
  attribution: string | null;
}

export interface HeroCollectionResponse {
  collection_id: number;
  collection_name: string;
  description: string | null;
  content: ContentItem[];
  count: number;
  total_available: number;
}

export interface HeroCollectionError {
  error: string;
  available_collections?: number;
  id?: number;
}
```

---

## Performance Tips

1. **Use Recent History Exclusion** - Prevent showing same collections repeatedly
2. **Cache in localStorage** - Track recently viewed collection IDs
3. **Keep last 5 IDs** - Balance between variety and simplicity
4. **Add Loading States** - Show skeletons while fetching
5. **Error Handling** - Implement fallback content if API fails
6. **Preload on Hover** - Preload next collection when user hovers nav

---

## Caching Strategy

```javascript
// Cache collection for 5 minutes
const CACHE_KEY = "hero_collection_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedCollection() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const isExpired = Date.now() - timestamp > CACHE_DURATION;

  return isExpired ? null : data;
}

function setCachedCollection(data) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );
}

// Use in fetch function
async function loadHeroCollection() {
  // Try cache first
  const cached = getCachedCollection();
  if (cached) {
    renderHeroContent(cached.content);
    return;
  }

  // Fetch fresh
  const response = await fetch("...");
  const data = await response.json();

  setCachedCollection(data);
  renderHeroContent(data.content);
}
```

---

## Troubleshooting

### Issue: Same Collection Shows Repeatedly

**Solution:** Implement recent history tracking with the `exclude` parameter.

```javascript
// Track last 5 viewed collections
const recentIds = JSON.parse(
  localStorage.getItem("recentHeroCollections") || "[]",
);
const last5 = recentIds.slice(-5);
const excludeParam = `?exclude=${last5.join(",")}`;
```

### Issue: No Collections Available

**Solution:** Ensure collections are marked as `active: true` in Tango CMS.

### Issue: API Request Fails

**Solution:** Implement retry logic with exponential backoff.

```javascript
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Security & Performance

1. **CORS**: API has CORS enabled for omnipaki.com domain
2. **Rate Limiting**: Reasonable API usage expected
3. **Content Validation**: Sanitize `content_text` before rendering (prevent XSS)

```javascript
import DOMPurify from "dompurify";

<p>{DOMPurify.sanitize(item.content_text)}</p>;
```

---

## Testing Checklist

- [ ] API returns 7 items consistently
- [ ] Exclude parameter works (no recent duplicates)
- [ ] localStorage persists across page reloads
- [ ] Mobile responsive design works
- [ ] Loading state displays properly
- [ ] Error handling shows fallback content
- [ ] Refresh button works smoothly

---

## Related APIs

- **Wisdom API**: `/api/public/wisdom` - Philosophical musings
- **Greetings API**: `/api/public/greetings` - Hockey greetings (HUG)
- **Motivational API**: Coming soon
- **Stats API**: Coming soon

---

## Questions?

If you need:

- New endpoints or features
- Additional data fields
- Different response formats
- Rate limiting adjustments

Contact the Tango CMS team!

---

## ✅ Quick Start Checklist

1. Replace `https://tango.yoursite.com` with actual Tango CMS domain
2. Test `/api/hero-collections/default` endpoint in browser
3. Implement recent history tracking with `exclude` parameter
4. Use example code to build hero section
5. Add refresh button for variety
6. Deploy and enjoy! 🎉

---

**Last Updated:** October 29, 2025  
**Status:** Production Ready  
**API Version:** 1.0  
**CMS Location:** `/cms/hero-collections`
