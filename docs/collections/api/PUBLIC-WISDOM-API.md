# Public Wisdom API Documentation

## Overview

Public content API for accessing published wisdom entries from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming content on OnlyHockey.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/wisdom
```

---

## Endpoints

### 1. Get Random Wisdom

Returns a single random published wisdom entry.

**Endpoint:** `GET /api/public/wisdom/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "The Ripple Effect",
    "musing": "Draisaitl says McDavid is 'irreplaceable.' Every player leaves a void...",
    "from_the_box": "A missing tooth is easily replaced but, like a player, the gap changes everything.",
    "theme": "Awards & Honors",
    "category": null,
    "attribution": "Penalty Box Philosopher"
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/wisdom/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomWisdom = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/wisdom/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest Wisdom

Returns the latest published wisdom entries.

**Endpoint:** `GET /api/public/wisdom/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 30,
      "title": "The Price of Legacy",
      "musing": "McDavid taking a lower AAV to win. That's like a player sacrificing...",
      "from_the_box": "Sometimes the greatest play isn't the one you make on the ice.",
      "theme": "Players",
      "category": null,
      "attribution": "Penalty Box Philosopher"
    }
    // ... more entries
  ],
  "count": 10
}
```

**Example Usage:**

```javascript
// Get latest 5 wisdom entries
fetch("https://tango.yoursite.com/api/public/wisdom/latest?limit=5")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get Wisdom with Filters

Returns published wisdom entries with optional filters and pagination.

**Endpoint:** `GET /api/public/wisdom?theme=impact&limit=20&offset=0`

**Query Parameters:**

- `theme` (optional) - Filter by theme (e.g., "Players", "Awards & Honors", "Leadership & Staff")
- `category` (optional) - Filter by category
- `limit` (optional) - Number of entries per page (default: 20, max: 100)
- `offset` (optional) - Number of entries to skip for pagination (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "title": "The Language of the Locker Room",
      "musing": "Connor said Toews helps the younger players with wisdom...",
      "from_the_box": "The best assists aren't always on the scoresheet.",
      "theme": "Leadership & Staff",
      "category": null,
      "attribution": "Penalty Box Philosopher"
    }
    // ... more entries
  ],
  "count": 15
}
```

**Example Usage:**

```javascript
// Get all wisdom with "Players" theme
fetch("https://tango.yoursite.com/api/public/wisdom?theme=Players&limit=50")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch("https://tango.yoursite.com/api/public/wisdom?limit=20&offset=20")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

## Features

✅ **Public & Open** - No authentication required  
✅ **CORS Enabled** - Works from any domain  
✅ **Published Only** - Only returns published wisdom (never drafts or archived)  
✅ **Clean Data** - Returns display-ready fields only  
✅ **Rate Limiting** - Max 100 entries per request to prevent abuse  
✅ **Cross-Origin** - Perfect for OnlyHockey.com or any external site

---

## Data Fields

All endpoints return these fields:

| Field          | Type           | Description                                               |
| -------------- | -------------- | --------------------------------------------------------- |
| `id`           | number         | Unique wisdom ID                                          |
| `title`        | string         | Wisdom title/heading                                      |
| `musing`       | string         | Full philosophical musing text                            |
| `from_the_box` | string         | Key quote extracted from the musing                       |
| `theme`        | string \| null | Theme classification (e.g., "Players", "Awards & Honors") |
| `category`     | string \| null | Secondary classification                                  |
| `attribution`  | string \| null | Source attribution (e.g., "Penalty Box Philosopher")      |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, etc. are NOT exposed in the public API.

---

## Error Responses

**No Published Wisdom Found:**

```json
{
  "success": false,
  "error": "No published wisdom found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch wisdom"
}
```

---

## Usage on OnlyHockey.com

### Example: Display Random Wisdom on Homepage

```javascript
// OnlyHockey Homepage
async function loadWisdom() {
  try {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/wisdom/random",
    );
    const result = await response.json();

    if (result.success) {
      const wisdom = result.data;
      document.getElementById("wisdom-title").textContent = wisdom.title;
      document.getElementById("wisdom-musing").textContent = wisdom.musing;
      document.getElementById("wisdom-quote").textContent = wisdom.from_the_box;
    }
  } catch (error) {
    console.error("Failed to load wisdom:", error);
  }
}

loadWisdom();
```

### Example: Wisdom Archive Page

```javascript
// OnlyHockey Wisdom Archive Page
async function loadWisdomArchive() {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/wisdom/latest?limit=50",
  );
  const result = await response.json();

  result.data.forEach((wisdom) => {
    // Render each wisdom entry
    const card = `
      <div class="wisdom-card">
        <h3>${wisdom.title}</h3>
        <p class="musing">"${wisdom.musing}"</p>
        <p class="quote"><strong>From the box:</strong> ${wisdom.from_the_box}</p>
        <span class="theme">${wisdom.theme}</span>
      </div>
    `;
    document.getElementById("wisdom-list").innerHTML += card;
  });
}
```

---

## Future Extensions

Potential future endpoints (not yet implemented):

- `GET /api/public/greetings/random`
- `GET /api/public/motivational/random`
- `GET /api/public/stats/random`
- `GET /api/public/content/random?type=wisdom` (unified endpoint)

---

## Questions?

This is a public content API - feel free to use it however you like! The API automatically filters to only show published content, so you never have to worry about seeing drafts or internal data.
