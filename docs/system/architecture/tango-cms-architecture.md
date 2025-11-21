# Tango CMS Architecture Documentation

## Overview

Tango CMS is a Next.js-based content management system that serves as the backend for content generation and management, providing content to external sites like OnlyHockey.com through a public-facing API.

## Data Storage

- **Database:** Supabase (PostgreSQL)
- **Content Tables:**
  - `collection_greetings` - Greeting messages
  - `collection_stats` - Hockey statistics
  - `collection_wisdom` - Wisdom quotes and musings
  - `collection_motivational` - Motivational quotes
  - `trivia_multiple_choice` - Multiple choice trivia questions
  - `trivia_true_false` - True/false trivia questions
  - `trivia_who_am_i` - "Who Am I" trivia questions
- **Content Status:** Content items have a `status` field, with `published` status required for public access

## API Architecture

### Internal CMS API (`/api/...`)

**Purpose:** Full CRUD operations for content management within the CMS.

**Structure:**

- `/api/greetings` - Manage greetings
- `/api/stats` - Manage stats
- `/api/wisdom` - Manage wisdom
- `/api/motivational` - Manage motivational messages
- Each endpoint has `[id]` sub-routes for individual item operations

**Access:** Protected, requires authentication (used by CMS admin interface)

### Public-Facing API (`/api/public/...`)

**Purpose:** Read-only endpoints for external consumption (e.g., OnlyHockey.com)

**Structure:**

- `/api/public/greetings` - Get published greetings
- `/api/public/stats` - Get published stats
- `/api/public/wisdom` - Get published wisdom
- `/api/public/motivational` - Get published motivational messages
- `/api/public/multiple-choice-trivia` - Get published multiple choice trivia questions
- `/api/public/true-false-trivia` - Get published true/false trivia questions
- `/api/public/who-am-i-trivia` - Get published "Who Am I" trivia questions
- `/api/public/trivia-questions` - Get aggregated count of all published trivia questions (all types combined)

**Special Endpoints:**

- `/api/public/{content-type}/latest` - Get the most recently published item
- `/api/public/{content-type}/random` - Get a random published item

**Features:**

- **CORS Enabled:** All endpoints include `Access-Control-Allow-Origin: *` headers
- **Pagination:** Supports `limit` and `offset` query parameters
- **Filtering:** Supports filtering by `theme`, `category`, `stat_category`, `year` (where applicable)
- **Maximum Limit:** Capped at 100 items per request to prevent abuse
- **Default Limit:** Returns 20 items if no limit specified

**Response Format:**

```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

**Special Response Format for `/api/public/trivia-questions`:**
This endpoint returns aggregated counts rather than individual items:

```json
{
  "success": true,
  "data": {
    "total": 15892,
    "multipleChoice": 8234,
    "trueFalse": 5123,
    "whoAmI": 2535
  },
  "count": 15892
}
```

**Error Format:**

```json
{
  "success": false,
  "error": "Error message"
}
```

## Content Generation

- **AI Integration:** Gemini API integration for generating content
- **Endpoints:** `/api/gemini/generate-{content-type}` - Generate new content via AI
- **Content Processing:** Content flows through generation → saving → publishing workflow

## Publishing Strategy

**Current Model:** Dynamic API consumption

- Content is stored in Supabase with `published` status
- External sites consume via public API endpoints
- Content is always fresh (no static pre-building on Tango side)
- The consuming site (OnlyHockey.com) decides on caching/publishing strategy

## Key Design Decisions

1. **Separation of Concerns:** Internal CMS API separate from public API
2. **Security:** Public API is read-only, only serves published content
3. **Scalability:** Pagination and limits prevent abuse
4. **Flexibility:** Query parameters allow filtering and customization
5. **CORS:** Explicitly enabled for cross-origin requests

## External Consumption Pattern

External sites (like OnlyHockey.com) should:

1. Use Server Components in Next.js to fetch from public API
2. Leverage Next.js caching for performance
3. Make parallel requests using `Promise.all` for efficiency
4. Handle errors gracefully with fallback content
