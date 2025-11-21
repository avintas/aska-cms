# Hero Collections Integration Guide for OnlyHockey.com

## Overview

The Hero Collections system provides curated sets of 7 content items that rotate randomly on each page load. Each collection contains complete, self-contained content (text, type, theme) stored as JSONB in the CMS database.

## System Architecture

### How It Works

1. **CMS Side**: Editors generate and save collections of 7 content items
2. **API**: Provides random collection selection with "recent history" exclusion
3. **Website Side**: Fetches and displays content with custom styling and features

### Key Features

- ✅ Random selection from active collections
- ✅ Prevents showing same collection in last 3-5 visits (via `exclude` param)
- ✅ Self-contained data (no additional queries needed)
- ✅ Fast performance (single API call)

---

## API Endpoints

### GET `/api/hero-collections/default`

Returns a random collection from all active hero collections.

**Query Parameters:**

- `exclude` (optional): Comma-separated collection IDs to exclude from selection
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

**Note:** The API returns `collection_name` (for the front-end), but the database field is `title`.

**Error Response:**

```json
{
  "error": "No active collections available",
  "available_collections": 0
}
```

---

## TypeScript Types

```typescript
interface ContentItem {
  id: number;
  content_text: string;
  content_type:
    | "motivational"
    | "statistics"
    | "wisdom"
    | "greeting"
    | "trivia";
  theme: string;
  attribution?: string | null;
}

interface HeroCollectionResponse {
  collection_id: number;
  collection_name: string;
  description?: string | null;
  content: ContentItem[];
  count: number;
  total_available: number;
}
```

---

## Integration Example: React Component

### Basic Implementation

```tsx
"use client";

import { useState, useEffect } from "react";

interface ContentItem {
  id: number;
  content_text: string;
  content_type: string;
  theme: string;
  attribution?: string | null;
}

export default function HeroSection() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    try {
      // Get recently viewed collection IDs from localStorage
      const recentIds = JSON.parse(
        localStorage.getItem("recentHeroCollections") || "[]",
      );

      // Only keep last 5 IDs
      const last5 = recentIds.slice(-5);

      // Build API URL with exclusions
      const excludeParam =
        last5.length > 0 ? `?exclude=${last5.join(",")}` : "";
      const response = await fetch(
        `https://your-cms-domain.com/api/hero-collections/default${excludeParam}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch hero content");
      }

      const data = await response.json();

      // Save this collection ID to history
      const newHistory = [...recentIds, data.collection_id];
      localStorage.setItem("recentHeroCollections", JSON.stringify(newHistory));

      setContent(data.content);
    } catch (error) {
      console.error("Error loading hero content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="hero-section">
      <h1>THERE IS ONLY HOCKEY!</h1>
      <p className="tagline">LOVE FOR THE GAME IS ALL YOU NEED</p>

      <div className="get-in-the-game">
        <h2>Get in the Game</h2>

        <div className="content-list">
          {content.map((item, index) => (
            <HeroContentItem key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Content Item Component (with Social Sharing)

```tsx
import {
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
} from "react-share";

interface HeroContentItemProps {
  item: ContentItem;
  index: number;
}

function HeroContentItem({ item, index }: HeroContentItemProps) {
  const getEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      motivational: "🔥",
      statistics: "📊",
      wisdom: "💎",
      greeting: "👋",
      trivia: "🏒",
    };
    return emojiMap[type] || "📝";
  };

  const shareUrl = `https://onlyhockey.com`;
  const shareText = item.content_text;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content_text);
    // Show toast notification
  };

  return (
    <div className="hero-content-item">
      <div className="content-wrapper">
        <span className="emoji">{getEmoji(item.content_type)}</span>
        <p className="content-text">{item.content_text}</p>
      </div>

      {/* Social Sharing Buttons */}
      <div className="social-share">
        <TwitterShareButton url={shareUrl} title={shareText}>
          <button className="share-btn twitter">
            <svg>...</svg> {/* Twitter icon */}
          </button>
        </TwitterShareButton>

        <FacebookShareButton url={shareUrl} quote={shareText}>
          <button className="share-btn facebook">
            <svg>...</svg> {/* Facebook icon */}
          </button>
        </FacebookShareButton>

        <button className="share-btn copy" onClick={handleCopy}>
          <svg>...</svg> {/* Copy icon */}
        </button>
      </div>
    </div>
  );
}
```

---

## Advanced Features

### 1. Refresh Button (Get New Collection)

```tsx
const refreshContent = async () => {
  setLoading(true);
  await fetchHeroContent();
  setLoading(false);
};

// In your JSX
<button onClick={refreshContent} className="refresh-btn">
  🎲 Show Me More
</button>;
```

### 2. Track Analytics

```tsx
useEffect(() => {
  if (content.length > 0) {
    // Track which collection was shown
    analytics.track("Hero Collection Viewed", {
      collection_id: collectionId,
      content_count: content.length,
    });
  }
}, [content]);
```

### 3. Fallback Content

```tsx
const FALLBACK_CONTENT = [
  {
    id: 0,
    content_text: "Hockey teaches us that every shift matters",
    content_type: "motivational",
    theme: "dedication",
  },
  // ... more fallback items
];

// Use fallback if API fails
if (error) {
  setContent(FALLBACK_CONTENT);
}
```

---

## Styling Guidelines

### Content Type Colors

```css
.content-item[data-type="motivational"] {
  --accent-color: #ff6b6b; /* Red/Orange */
}

.content-item[data-type="statistics"] {
  --accent-color: #4ecdc4; /* Teal */
}

.content-item[data-type="wisdom"] {
  --accent-color: #9b59b6; /* Purple */
}

.content-item[data-type="greeting"] {
  --accent-color: #3498db; /* Blue */
}

.content-item[data-type="trivia"] {
  --accent-color: #f39c12; /* Gold */
}
```

### Responsive Design

```css
/* Mobile */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Desktop */
@media (min-width: 768px) {
  .content-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}
```

---

## Performance Optimization

### 1. Caching Strategy

```tsx
// Cache the collection for 5 minutes
const CACHE_KEY = "hero_collection_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedCollection = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const isExpired = Date.now() - timestamp > CACHE_DURATION;

  return isExpired ? null : data;
};

const setCachedCollection = (data: any) => {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );
};
```

### 2. Preload on Hover

```tsx
<Link
  href="/"
  onMouseEnter={() => {
    // Preload next collection
    fetch("/api/hero-collections/default");
  }}
>
  Home
</Link>
```

---

## Content Management

### Adding New Collections

Editors use the CMS at `/cms/hero-collections`:

1. Click "🎲 Generate Random Collection"
2. Review the 7 items
3. Click "🔄 Regenerate" if needed
4. Name it and save

### Collection Naming Convention

Suggested naming patterns:

- "Morning Motivation #1"
- "Stats & Facts - NHL Edition"
- "Weekend Vibes"
- "Championship Mindset"

This helps organize and identify collections in the CMS.

---

## Troubleshooting

### Issue: Same Collection Shows Repeatedly

**Solution:** Check that localStorage is working and the `exclude` parameter is being sent correctly.

```tsx
// Debug: Log excluded IDs
console.log("Excluding collections:", last5);
```

### Issue: No Collections Available

**Solution:** Ensure collections are marked as `active: true` in the CMS.

```tsx
// Show user-friendly message
if (data.total_available === 0) {
  return <div>New content coming soon! 🏒</div>;
}
```

### Issue: API Request Fails

**Solution:** Implement retry logic with exponential backoff.

```tsx
const fetchWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Usage
await fetchWithRetry("/api/hero-collections/default?exclude=1,2,3");
```

---

## Security Considerations

1. **CORS**: Ensure CMS API allows requests from onlyhockey.com domain
2. **Rate Limiting**: API should limit requests to prevent abuse
3. **Content Validation**: Sanitize content_text before rendering (prevent XSS)

```tsx
import DOMPurify from "dompurify";

<p>{DOMPurify.sanitize(item.content_text)}</p>;
```

---

## Testing Checklist

- [ ] API returns 7 items consistently
- [ ] Exclude parameter works (no recent duplicates)
- [ ] LocalStorage persists across page reloads
- [ ] Mobile responsive design works
- [ ] Social sharing buttons work correctly
- [ ] Loading state displays properly
- [ ] Error handling shows fallback content
- [ ] Analytics tracking fires correctly

---

## Example: Complete Integration

See the full working example in `examples/hero-section-complete.tsx` (if needed, I can create this file).

---

## Support

For questions or issues with the Hero Collections system:

1. Check the CMS at `/cms/hero-collections`
2. Test the API directly at `/api/hero-collections/default`
3. Verify collections are active and have 7 items each

---

**Last Updated:** October 28, 2025
**API Version:** 1.0
**CMS Location:** `/cms/hero-collections`
