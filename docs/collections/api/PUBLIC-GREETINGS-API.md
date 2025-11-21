# Public Greetings API Documentation

## Overview

Public content API for accessing published greetings (HUG - Hockey Universal Greetings) from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming content on OnlyHockey.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/greetings
```

---

## Endpoints

### 1. Get Random Greeting

Returns a single random published greeting.

**Endpoint:** `GET /api/public/greetings/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "greeting_text": "Hey hockey legend! Keep your stick on the ice and your head in the game!",
    "attribution": "Generated from Game 453"
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/greetings/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomGreeting = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/greetings/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest Greetings

Returns the latest published greetings.

**Endpoint:** `GET /api/public/greetings/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 58,
      "greeting_text": "Welcome to the greatest game on earth! Lace up and let's play!",
      "attribution": null
    },
    {
      "id": 57,
      "greeting_text": "Time to hit the ice! Your team is counting on you!",
      "attribution": "Generated from Article #123"
    }
  ],
  "count": 2
}
```

**Example Usage:**

```javascript
// Get latest 5 greetings
fetch("https://tango.yoursite.com/api/public/greetings/latest?limit=5")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get Greetings with Pagination

Returns published greetings with pagination support.

**Endpoint:** `GET /api/public/greetings?limit=20&offset=0`

**Query Parameters:**

- `limit` (optional) - Number of entries per page (default: 20, max: 100)
- `offset` (optional) - Number of entries to skip for pagination (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 35,
      "greeting_text": "Good morning, hockey fans! Let's make today count!",
      "attribution": null
    }
  ],
  "count": 1
}
```

**Example Usage:**

```javascript
// Get first page (20 greetings)
fetch("https://tango.yoursite.com/api/public/greetings?limit=20&offset=0")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch("https://tango.yoursite.com/api/public/greetings?limit=20&offset=20")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

## Features

✅ **Public & Open** - No authentication required  
✅ **CORS Enabled** - Works from any domain  
✅ **Published Only** - Only returns published greetings (never drafts or archived)  
✅ **Clean Data** - Returns display-ready fields only  
✅ **Rate Limiting** - Max 100 entries per request to prevent abuse  
✅ **Cross-Origin** - Perfect for OnlyHockey.com or any external site

---

## Data Fields

All endpoints return these fields:

| Field           | Type           | Description                                          |
| --------------- | -------------- | ---------------------------------------------------- |
| `id`            | number         | Unique greeting ID                                   |
| `greeting_text` | string         | The greeting message                                 |
| `attribution`   | string \| null | Source attribution (e.g., "Generated from Game 453") |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, `used_in`, etc. are NOT exposed in the public API.

---

## Error Responses

**No Published Greetings Found:**

```json
{
  "success": false,
  "error": "No published greetings found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch greetings"
}
```

---

## Usage on OnlyHockey.com

### Example: Display Random Greeting on Homepage

```javascript
// OnlyHockey Homepage
async function loadGreeting() {
  try {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/greetings/random",
    );
    const result = await response.json();

    if (result.success) {
      const greeting = result.data;
      document.getElementById("greeting-text").textContent =
        greeting.greeting_text;
      if (greeting.attribution) {
        document.getElementById("greeting-source").textContent =
          greeting.attribution;
      }
    }
  } catch (error) {
    console.error("Failed to load greeting:", error);
  }
}

loadGreeting();
```

### Example: Greetings Carousel

```javascript
// OnlyHockey Greetings Carousel
async function loadGreetingsCarousel() {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/greetings/latest?limit=10",
  );
  const result = await response.json();

  result.data.forEach((greeting) => {
    // Render each greeting in carousel
    const slide = `
      <div class="greeting-slide">
        <p class="greeting-text">"${greeting.greeting_text}"</p>
        ${greeting.attribution ? `<span class="source">${greeting.attribution}</span>` : ""}
      </div>
    `;
    document.getElementById("greeting-carousel").innerHTML += slide;
  });
}
```

### Example: Daily Greeting Widget

```html
<div id="daily-greeting-widget">
  <h3>Today's Greeting</h3>
  <blockquote id="greeting-text"></blockquote>
  <button onclick="loadNewGreeting()">Get Another</button>
</div>

<script>
  async function loadNewGreeting() {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/greetings/random",
    );
    const result = await response.json();

    if (result.success) {
      document.getElementById("greeting-text").textContent =
        result.data.greeting_text;
    }
  }

  // Load on page load
  loadNewGreeting();
</script>
```

---

## React/Next.js Example

```typescript
// components/RandomGreeting.tsx
'use client';

import { useState, useEffect } from 'react';

interface Greeting {
  id: number;
  greeting_text: string;
  attribution: string | null;
}

export default function RandomGreeting() {
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGreeting = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://tango.yoursite.com/api/public/greetings/random');
      const result = await response.json();
      if (result.success) {
        setGreeting(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch greeting:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGreeting();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!greeting) return null;

  return (
    <div className="greeting-widget">
      <blockquote>{greeting.greeting_text}</blockquote>
      {greeting.attribution && (
        <cite>— {greeting.attribution}</cite>
      )}
      <button onClick={fetchGreeting}>New Greeting</button>
    </div>
  );
}
```

---

## ⚡ Performance Tips

1. **Cache responses** - Greetings don't change frequently, cache for 5-10 minutes
2. **Use `latest` for lists** - More efficient than fetching random multiple times
3. **Pagination** - Use `limit` and `offset` for large lists
4. **Error handling** - Always check `result.success` before using `result.data`

---

## 🔧 Troubleshooting

### CORS Error?

The API has CORS enabled. If you get CORS errors, contact the Tango team.

### 404 Error?

Check that you're using the correct domain and path:

- ✅ `https://tango.example.com/api/public/greetings/random`
- ❌ `https://tango.example.com/greetings/random`

### Empty Response?

Make sure greetings are **published** in Tango CMS (not draft or archived).

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
- **Motivational API**: Coming soon
- **Stats API**: Coming soon

---

## ✅ Quick Start Checklist

1. Replace `https://tango.yoursite.com` with actual domain
2. Test endpoints in browser
3. Use example code to build features
4. Deploy and enjoy! 🎉

---

**Last Updated:** October 29, 2025  
**Status:** Production Ready
