# OnlyHockey.com - Tango CMS Integration Guide

## Overview

This guide provides step-by-step instructions for implementing content consumption from Tango CMS on OnlyHockey.com. You will be fetching stats, wisdom, motivational messages, and greetings to display on your website.

## Prerequisites

- OnlyHockey.com is a Next.js 14+ application (using App Router)
- TypeScript configured with path aliases (`@/` pointing to project root)
- Access to Tango CMS public API endpoints
- Tango CMS base URL (e.g., `https://your-tango-cms-domain.com`)

## Project File Structure

After implementation, your project will have these new files:

```
onlyhockey/
├── .env.local              # Environment variables (not committed)
├── .env.local.example      # Example env file (committed)
├── lib/
│   ├── tango-api.ts        # API utility functions
│   └── tango-types.ts      # TypeScript type definitions
└── components/
    └── tango-content.tsx   # Content display component
```

## API Endpoints Reference

All endpoints use the `limit` query parameter to control how many items to fetch. **You should fetch only the number you need** (e.g., `limit=5` for 5 items), not fetch all and filter client-side.

### Base URL

Replace `{TANGO_CMS_URL}` with your actual Tango CMS URL.

### Endpoints

#### Stats

- **Endpoint:** `GET {TANGO_CMS_URL}/api/public/stats?limit=5`
- **Response:** Array of stats with fields: `id`, `stat_text`, `stat_value`, `stat_category`, `year?`, `theme?`, `category?`, `attribution?`

#### Wisdom

- **Endpoint:** `GET {TANGO_CMS_URL}/api/public/wisdom?limit=5`
- **Response:** Array of wisdom items with fields: `id`, `title`, `musing`, `from_the_box?`, `theme?`, `category?`, `attribution?`

#### Motivational Messages

- **Endpoint:** `GET {TANGO_CMS_URL}/api/public/motivational?limit=1`
- **Response:** Array with one motivational message: `id`, `quote`, `context?`, `theme?`, `category?`, `attribution?`
- **Alternative:** `GET {TANGO_CMS_URL}/api/public/motivational/random` - Returns a **single object** (not array)

#### Greetings

- **Endpoint:** `GET {TANGO_CMS_URL}/api/public/greetings?limit=1`
- **Response:** Array with one greeting: `id`, `greeting_text`, `attribution?`
- **Alternative:** `GET {TANGO_CMS_URL}/api/public/greetings/random` - Returns a **single object** (not array)

**Note:** Fields marked with `?` are optional and may not be present in all responses.

## Implementation Steps

### Step 1: Set Up Environment Variables

Create or update your `.env.local` file in the OnlyHockey project root:

```env
TANGO_CMS_URL=https://your-tango-cms-domain.com
```

**Important:** We use `TANGO_CMS_URL` (without `NEXT_PUBLIC_` prefix) because:

- This API will only be called from Server Components
- Keeps the URL private and not exposed to the client-side bundle
- More secure and reduces bundle size

Also create `.env.local.example` for documentation (this file gets committed):

```env
# Tango CMS API URL
TANGO_CMS_URL=https://your-tango-cms-domain.com
```

### Step 2: Create TypeScript Type Definitions

Create a new file: `lib/tango-types.ts`

This file will contain all TypeScript interfaces for Tango CMS content:

```typescript
// Base response types from Tango CMS API
export interface TangoApiResponse<T> {
  success: boolean;
  data: T[];
  count?: number;
  error?: string;
}

export interface TangoSingleResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Content type interfaces
export interface Stat {
  id: string;
  stat_text: string;
  stat_value: string;
  stat_category: string;
  year?: string;
  theme?: string;
  category?: string;
  attribution?: string;
}

export interface Wisdom {
  id: string;
  title: string;
  musing: string;
  from_the_box?: string;
  theme?: string;
  category?: string;
  attribution?: string;
}

export interface Motivational {
  id: string;
  quote: string;
  context?: string;
  theme?: string;
  category?: string;
  attribution?: string;
}

export interface Greeting {
  id: string;
  greeting_text: string;
  attribution?: string;
}
```

### Step 3: Create API Utility Functions

Create a new file: `lib/tango-api.ts`

This file will contain helper functions to fetch content from Tango CMS:

```typescript
import type {
  TangoApiResponse,
  TangoSingleResponse,
  Stat,
  Wisdom,
  Motivational,
  Greeting,
} from "./tango-types";

const TANGO_CMS_URL = process.env.TANGO_CMS_URL!;

// Generic fetch function for array responses
async function fetchFromTango<T>(
  endpoint: string,
): Promise<TangoApiResponse<T>> {
  try {
    const response = await fetch(`${TANGO_CMS_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Next.js will cache this automatically
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: TangoApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from Tango CMS (${endpoint}):`, error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Generic fetch function for single item responses (random endpoints)
async function fetchSingleFromTango<T>(
  endpoint: string,
): Promise<TangoSingleResponse<T>> {
  try {
    const response = await fetch(`${TANGO_CMS_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: TangoSingleResponse<T> = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from Tango CMS (${endpoint}):`, error);
    return {
      success: false,
      data: {} as T,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Typed fetch functions for each content type
export async function fetchStats(
  limit: number = 5,
): Promise<TangoApiResponse<Stat>> {
  return fetchFromTango<Stat>(`/api/public/stats?limit=${limit}`);
}

export async function fetchWisdom(
  limit: number = 5,
): Promise<TangoApiResponse<Wisdom>> {
  return fetchFromTango<Wisdom>(`/api/public/wisdom?limit=${limit}`);
}

export async function fetchMotivational(
  limit: number = 1,
): Promise<TangoApiResponse<Motivational>> {
  return fetchFromTango<Motivational>(
    `/api/public/motivational?limit=${limit}`,
  );
}

export async function fetchRandomMotivational(): Promise<
  TangoSingleResponse<Motivational>
> {
  return fetchSingleFromTango<Motivational>("/api/public/motivational/random");
}

export async function fetchGreeting(
  limit: number = 1,
): Promise<TangoApiResponse<Greeting>> {
  return fetchFromTango<Greeting>(`/api/public/greetings?limit=${limit}`);
}

export async function fetchRandomGreeting(): Promise<
  TangoSingleResponse<Greeting>
> {
  return fetchSingleFromTango<Greeting>("/api/public/greetings/random");
}
```

### Step 4: Create a Server Component to Display Content

Create a new file: `components/tango-content.tsx`

This will be a **Server Component** (no `'use client'` directive) that fetches and displays the content:

```typescript
import {
  fetchStats,
  fetchWisdom,
  fetchRandomMotivational,
} from '@/lib/tango-api';
import type { Stat, Wisdom, Motivational } from '@/lib/tango-types';

export async function TangoContent() {
  // Fetch all content in parallel for efficiency
  const [statsResult, wisdomResult, motivationalResult] = await Promise.all([
    fetchStats(5),
    fetchWisdom(5),
    fetchRandomMotivational(),
  ]);

  // Extract data from responses with proper typing
  const stats: Stat[] = statsResult.success ? statsResult.data : [];
  const wisdom: Wisdom[] = wisdomResult.success ? wisdomResult.data : [];
  const motivational: Motivational | null = motivationalResult.success
    ? motivationalResult.data
    : null;

  return (
    <div className="tango-content">
      {/* Stats Section */}
      <section>
        <h2>Hockey Stats</h2>
        {stats.length > 0 ? (
          <ul>
            {stats.map((stat: Stat) => (
              <li key={stat.id}>
                <p>{stat.stat_text}</p>
                {stat.attribution && <small>— {stat.attribution}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No stats available at this time.</p>
        )}
      </section>

      {/* Wisdom Section */}
      <section>
        <h2>Hockey Wisdom</h2>
        {wisdom.length > 0 ? (
          <ul>
            {wisdom.map((item: Wisdom) => (
              <li key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.musing}</p>
                {item.from_the_box && (
                  <blockquote>{item.from_the_box}</blockquote>
                )}
                {item.attribution && <small>— {item.attribution}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No wisdom available at this time.</p>
        )}
      </section>

      {/* Motivational Section */}
      <section>
        <h2>Daily Motivation</h2>
        {motivational ? (
          <div>
            <blockquote>{motivational.quote}</blockquote>
            {motivational.context && <p>{motivational.context}</p>}
            {motivational.attribution && (
              <small>— {motivational.attribution}</small>
            )}
          </div>
        ) : (
          <p>No motivational message available at this time.</p>
        )}
      </section>
    </div>
  );
}
```

### Step 5: Use the Component in Your Pages

Import and use the `TangoContent` component in any page where you want to display the content.

**Basic Usage:**

```typescript
// app/page.tsx (or any page)
import { TangoContent } from '@/components/tango-content';

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to OnlyHockey.com</h1>

      {/* Your other page content */}

      <TangoContent />

      {/* More page content */}
    </main>
  );
}
```

**Recommended: With Suspense Boundary (Better UX):**

```typescript
// app/page.tsx (or any page)
import { Suspense } from 'react';
import { TangoContent } from '@/components/tango-content';

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to OnlyHockey.com</h1>

      {/* Your other page content */}

      <Suspense
        fallback={
          <div className="loading">
            <p>Loading hockey content...</p>
          </div>
        }
      >
        <TangoContent />
      </Suspense>

      {/* More page content */}
    </main>
  );
}
```

**Benefits of using Suspense:**

- Shows loading state while content is being fetched
- Prevents layout shift when content loads
- Better user experience
- Allows rest of page to render immediately

### Step 6 (Optional): Add Error Boundary for Production

For additional error handling resilience, create an error boundary:

Create a new file: `app/error.tsx` (if you don't have one)

```typescript
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>We're having trouble loading content from our servers.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

This will catch any errors thrown by Server Components and show a user-friendly error UI.

## Important Notes

### Why Server Components?

- **Performance:** Data fetching happens on the server, so users get pre-rendered HTML
- **SEO:** Content is available immediately to search engines
- **Caching:** Next.js automatically caches the API responses, reducing load on Tango CMS
- **Security:** API URLs stay on the server, never exposed to the browser
- **No Client Bundle Size:** Fetch logic doesn't increase client-side JavaScript bundle

### Caching Strategy

The example uses `next: { revalidate: 3600 }` which means:

- Content is cached for 1 hour (3600 seconds)
- After 1 hour, Next.js will fetch fresh content on the next request
- Users see cached content immediately (no waiting)
- This is called **Incremental Static Regeneration (ISR)**

**Caching Options:**

| Revalidate Value | Behavior                             | Use Case                          |
| ---------------- | ------------------------------------ | --------------------------------- |
| `3600` (1 hour)  | Balance of freshness and performance | Recommended default               |
| `60` (1 minute)  | Very fresh content, more API calls   | Frequently updated content        |
| `86400` (1 day)  | Less fresh, minimal API calls        | Rarely updated content            |
| `false`          | No caching, always fetch fresh       | Development/testing only          |
| `0`              | Cache forever until rebuild          | Static content that never changes |

**Recommendation:** Start with 1 hour (3600) and adjust based on:

- How often content is updated in Tango CMS
- Your server capacity
- User expectations for content freshness

### Error Handling

The utility functions include basic error handling. If the API fails:

- The component will still render
- Empty arrays are returned, so you can show fallback content
- Errors are logged to the console for debugging

### Fetching Strategy: Use `limit` Parameter

**Always use the `limit` parameter** when fetching from the API. For example:

- ✅ `GET /api/public/stats?limit=5` - Fetch only 5 stats
- ❌ `GET /api/public/stats` - Fetches default 20, then filter to 5 client-side

This is more efficient because:

- Less data transferred over the network
- Faster response times
- Less memory usage
- Better performance

## Advanced Usage Patterns

### Pattern 1: Separate Components for Different Content Types

Instead of one large component, create focused components:

```typescript
// components/hockey-stats.tsx
import { fetchStats } from '@/lib/tango-api';
import type { Stat } from '@/lib/tango-types';

export async function HockeyStats({ limit = 5 }: { limit?: number }) {
  const result = await fetchStats(limit);
  const stats: Stat[] = result.success ? result.data : [];

  if (stats.length === 0) return null;

  return (
    <section className="hockey-stats">
      <h2>Hockey Stats</h2>
      <ul>
        {stats.map((stat) => (
          <li key={stat.id}>
            <p>{stat.stat_text}</p>
            {stat.attribution && <small>— {stat.attribution}</small>}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Then use with individual Suspense boundaries:

```typescript
// app/page.tsx
import { Suspense } from 'react';
import { HockeyStats } from '@/components/hockey-stats';
import { HockeyWisdom } from '@/components/hockey-wisdom';

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<div>Loading stats...</div>}>
        <HockeyStats limit={5} />
      </Suspense>

      <Suspense fallback={<div>Loading wisdom...</div>}>
        <HockeyWisdom limit={3} />
      </Suspense>
    </main>
  );
}
```

**Benefits:**

- Each component loads independently
- More granular loading states
- Easier to reuse across pages
- Better code organization

### Pattern 2: On-Demand Revalidation

For pages where you want to manually trigger content refresh:

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function refreshContent() {
  revalidatePath("/");
  return { success: true };
}
```

```typescript
// components/refresh-button.tsx
'use client';

import { refreshContent } from '@/app/actions';

export function RefreshButton() {
  return (
    <button
      onClick={async () => {
        await refreshContent();
        window.location.reload();
      }}
    >
      Refresh Content
    </button>
  );
}
```

### Pattern 3: Filtering by Theme or Category

If you want to fetch content by theme/category, extend the API functions:

```typescript
// lib/tango-api.ts (add to existing file)
export async function fetchWisdomByTheme(
  theme: string,
  limit: number = 5,
): Promise<TangoApiResponse<Wisdom>> {
  return fetchFromTango<Wisdom>(
    `/api/public/wisdom?theme=${encodeURIComponent(theme)}&limit=${limit}`,
  );
}
```

### Pattern 4: Multiple Random Items

If you want multiple random motivational messages:

```typescript
// Fetch multiple random items by calling the endpoint multiple times
const [msg1, msg2, msg3] = await Promise.all([
  fetchRandomMotivational(),
  fetchRandomMotivational(),
  fetchRandomMotivational(),
]);
```

## Testing Checklist

Before going live, verify all these items:

1. ✅ **Environment Setup**
   - `.env.local` file exists with `TANGO_CMS_URL`
   - Environment variable is accessible in Server Components
   - `.env.local.example` committed to repository

2. ✅ **Files Created**
   - `lib/tango-types.ts` with all TypeScript interfaces
   - `lib/tango-api.ts` with fetch functions
   - `components/tango-content.tsx` or individual content components

3. ✅ **API Connection**
   - API endpoint URLs are correct
   - Tango CMS is accessible from your server
   - Content is marked as `status: "published"` in Tango CMS

4. ✅ **Functionality**
   - Content displays correctly on the page
   - Error handling works (test by temporarily using wrong URL)
   - Loading states appear correctly with Suspense
   - TypeScript compilation has no errors

5. ✅ **Performance**
   - Page loads quickly (check Network tab in browser dev tools)
   - Content is being cached (check fetch requests in Network tab)
   - No unnecessary re-fetching on page navigation

6. ✅ **Production Ready**
   - Remove any `console.log` statements
   - Error boundaries are in place
   - Loading states are styled appropriately

## Troubleshooting

### Environment Variable Not Found

**Symptom:** Error: `TANGO_CMS_URL is not defined`

**Solutions:**

- Ensure `.env.local` file exists in project root
- Restart your Next.js dev server after adding environment variables
- Check there are no typos in the variable name
- For production (Vercel/other), set environment variables in hosting dashboard

**Test it:**

```typescript
// Add temporary console.log in tango-api.ts
console.log("TANGO_CMS_URL:", process.env.TANGO_CMS_URL);
```

### CORS Errors

**Symptom:** Browser console shows CORS errors like "Access-Control-Allow-Origin"

**Solutions:**

- **This should NOT happen** with Server Components (API calls are server-side)
- If you see CORS errors, you're likely using a Client Component by mistake
- Check your component does NOT have `'use client'` directive
- Verify API calls are in Server Components, not Client Components

**Incorrect (causes CORS):**

```typescript
"use client"; // ❌ This makes it a Client Component
import { fetchStats } from "@/lib/tango-api";
```

**Correct:**

```typescript
// ✅ No 'use client' - it's a Server Component
import { fetchStats } from "@/lib/tango-api";
```

### Empty Content / No Data Showing

**Symptom:** Component renders but shows "No content available"

**Debug Steps:**

1. **Check API Response:**

```typescript
// Add to tango-api.ts temporarily
const data = await response.json();
console.log("API Response:", JSON.stringify(data, null, 2));
```

2. **Verify Content Status:**

- Log into Tango CMS
- Check that content items have `status: "published"`
- Unpublished content won't appear in API responses

3. **Check API URL:**

- Verify `TANGO_CMS_URL` is correct
- Test the URL directly in browser: `https://your-tango-url.com/api/public/stats`
- Should return JSON with data array

4. **Network Tab Inspection:**

- Open browser DevTools → Network tab
- Reload page
- Look for fetch requests to Tango CMS
- Check if they return 200 status and contain data

### Slow Loading / Performance Issues

**Symptom:** Page takes a long time to load or appears to hang

**Solutions:**

1. **Verify Server Components:**

```typescript
// ✅ Correct - Server Component (no 'use client')
export async function TangoContent() {
  // ...
}

// ❌ Wrong - Client Component (will be slow)
("use client");
export function TangoContent() {
  // ...
}
```

2. **Check Parallel Fetching:**

```typescript
// ✅ Good - fetches in parallel (fast)
const [stats, wisdom] = await Promise.all([fetchStats(5), fetchWisdom(5)]);

// ❌ Bad - fetches sequentially (slow)
const stats = await fetchStats(5);
const wisdom = await fetchWisdom(5);
```

3. **Adjust Cache Settings:**

```typescript
// If Tango CMS is slow, increase cache time
next: {
  revalidate: 3600;
} // Cache for 1 hour
```

4. **Use Suspense Boundaries:**

- Wrap async components in `<Suspense>` for progressive loading
- Allows page to render while content loads

### TypeScript Errors

**Symptom:** TypeScript compilation errors about missing types

**Solutions:**

- Ensure `lib/tango-types.ts` is created with all interfaces
- Check imports use `import type { ... }` for type-only imports
- Verify `tsconfig.json` has path aliases configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Content Not Updating After Changes

**Symptom:** Made changes in Tango CMS but don't see them on website

**Cause:** Content is cached by Next.js

**Solutions:**

1. **Wait for Revalidation:**

- Default cache is 1 hour (3600 seconds)
- Wait for cache to expire naturally

2. **Force Refresh (Development):**

- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Restart Next.js dev server: `npm run dev`

3. **Clear Next.js Cache:**

```bash
# Delete Next.js cache and restart
rm -rf .next
npm run dev
```

4. **Use On-Demand Revalidation (Production):**

- Implement Pattern 2 from Advanced Usage section
- Add a refresh button for manual revalidation

### Production Build Errors

**Symptom:** Build fails when deploying to production

**Common Causes:**

1. **Missing Environment Variables:**

- Set `TANGO_CMS_URL` in production environment (Vercel/Netlify dashboard)

2. **API Endpoint Not Accessible:**

- Ensure Tango CMS is accessible from production servers
- Check firewall rules and hosting configuration

3. **Type Errors:**

- Run `npm run build` locally to catch TypeScript errors
- Fix all type issues before deploying

## Next Steps

Once basic content fetching is working, consider these enhancements:

### 1. Style Components to Match OnlyHockey Brand

Apply your brand colors and styling:

```typescript
// Example with OnlyHockey brand colors
<section className="bg-[#0a0e1a] text-white p-6 rounded-lg">
  <h2 className="text-[#4cc9f0] text-2xl font-bold mb-4">
    Hockey Stats
  </h2>
  {/* Content */}
</section>
```

### 2. Create Page-Specific Content Components

Different pages can show different content types:

- **Home Page:** Random motivational quote + latest stats
- **Stats Page:** Comprehensive stats display with filtering
- **Wisdom Page:** All wisdom content with search
- **Daily Page:** Daily greeting + daily trivia

### 3. Implement Content Rotation

Show different content on each page load:

```typescript
// Fetch more items and randomize client-side
const result = await fetchStats(20);
const randomStats = result.data.sort(() => Math.random() - 0.5).slice(0, 5);
```

### 4. Add Search and Filtering

Create filtered views by theme, category, or year:

```typescript
export async function StatsPage({
  searchParams,
}: {
  searchParams: { theme?: string };
}) {
  const stats = searchParams.theme
    ? await fetchStatsByTheme(searchParams.theme)
    : await fetchStats(20);
  // Render stats...
}
```

### 5. Analytics and Tracking

Track which content is most viewed:

```typescript
// Log content views
onClick={() => {
  trackEvent('content_view', { type: 'stat', id: stat.id });
}}
```

### 6. Social Sharing

Add share buttons for individual content items:

```typescript
<button
  onClick={() => {
    navigator.share({
      title: stat.stat_text,
      text: `${stat.stat_text} - ${stat.attribution}`,
      url: window.location.href,
    });
  }}
>
  Share
</button>
```

### 7. Personalization

Remember user preferences:

```typescript
// Store favorite content types in localStorage/cookies
const preferredTheme = cookies().get("preferred_theme")?.value;
const content = await fetchWisdomByTheme(preferredTheme || "goalie");
```

## Summary

You now have a complete, type-safe implementation for consuming Tango CMS content on OnlyHockey.com with:

✅ **Proper TypeScript types** for all content  
✅ **Server-side rendering** for optimal performance  
✅ **Automatic caching** with configurable revalidation  
✅ **Error handling** with graceful fallbacks  
✅ **Loading states** with Suspense boundaries  
✅ **Advanced patterns** for complex scenarios

The implementation follows Next.js best practices and will scale as your content grows.

---

**Need Help?** Check the Troubleshooting section or review the Advanced Usage Patterns for specific use cases.
