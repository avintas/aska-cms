# Content Browser API Reference

Complete API documentation for the Content Browser endpoints.

## Base Endpoint

```
GET /api/content-browser
```

## Authentication

All endpoints require authenticated user session. Returns `401 Unauthorized` if not authenticated.

## Endpoints

### 1. Get Theme Statistics

Get statistics for all themes including source counts and latest ingestion dates.

**Endpoint:**
```
GET /api/content-browser?stats=themes
```

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "theme": "Players",
      "totalSources": 45,
      "publishedSources": 42,
      "latestIngestedAt": "2025-01-15T10:30:00Z"
    },
    {
      "theme": "Teams & Organizations",
      "totalSources": 32,
      "publishedSources": 30,
      "latestIngestedAt": "2025-01-14T15:20:00Z"
    }
    // ... all 13 themes
  ]
}
```

**Response Fields:**
- `theme` (string): Theme name (one of 13 predefined themes)
- `totalSources` (number): Total number of sources with this theme
- `publishedSources` (number): Number of sources with `ingestion_status = 'complete'`
- `latestIngestedAt` (string | null): ISO timestamp of most recently ingested source

**Notes:**
- Always returns all 13 themes, even if count is 0
- Themes are returned in predefined order (see Theme Order section)
- `publishedSources` counts only sources with `ingestion_status = 'complete'`

---

### 2. Get Tag Statistics

Get statistics for all tags with usage counts.

**Endpoint:**
```
GET /api/content-browser?stats=tags&limit=80
```

**Query Parameters:**
- `limit` (optional, default: 80): Maximum number of tags to return

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "tag": "Stanley Cup",
      "total": 25
    },
    {
      "tag": "NHL Draft",
      "total": 18
    }
    // ... sorted by count descending
  ]
}
```

**Response Fields:**
- `tag` (string): Tag name
- `total` (number): Number of sources using this tag

**Notes:**
- Tags are sorted by count (descending)
- Limited to top N tags by `limit` parameter
- Tags are extracted from `tags` JSONB array field

---

### 3. Fetch Sources with Filters

Get paginated list of sources with optional filtering by themes, tags, and search.

**Endpoint:**
```
GET /api/content-browser?limit=5&offset=0&themes=Players&search=goal
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 5 | Number of results per page |
| `offset` | number | No | 0 | Number of results to skip |
| `themes` | string | No | - | Comma-separated list of themes to filter |
| `tags` | string | No | - | Comma-separated list of tags to filter |
| `search` | string | No | - | Search term to match against title (case-insensitive) |

**Examples:**

Filter by single theme:
```
GET /api/content-browser?themes=Players&limit=10
```

Filter by multiple themes:
```
GET /api/content-browser?themes=Players|Teams%20%26%20Organizations&limit=10
```

Search by title:
```
GET /api/content-browser?search=Stanley%20Cup&limit=10
```

Combine filters:
```
GET /api/content-browser?themes=Players&search=goal&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Wayne Gretzky: The Great One",
      "summary": "A comprehensive look at Wayne Gretzky's career...",
      "theme": "Players",
      "category": "Player Spotlight",
      "tags": ["Wayne Gretzky", "NHL", "Records"],
      "ingestionStatus": "complete",
      "ingestionProcessId": "proc_abc123",
      "updatedAt": "2025-01-15T10:30:00Z",
      "usage": ["wisdom", "stat"]
    }
  ],
  "count": 45
}
```

**Response Fields:**

**Source Object:**
- `id` (number): Unique source content ID
- `title` (string): Source title
- `summary` (string): Source summary/description
- `theme` (string): Normalized theme name (one of 13 themes)
- `category` (string | null): Category within theme
- `tags` (string[]): Array of tags
- `ingestionStatus` (string): Status (`complete`, `pending`, `failed`, etc.)
- `ingestionProcessId` (string | null): Process ID that ingested this content
- `updatedAt` (string): ISO timestamp of last update
- `usage` (string[]): Array of usage types where content has been used:
  - `wisdom` - Used in Wisdom collection
  - `greeting` - Used in Greetings collection
  - `motivational` - Used in Motivational collection
  - `stat` - Used in Stats collection
  - `multiple-choice` - Used in Multiple Choice trivia
  - `true-false` - Used in True/False trivia
  - `who-am-i` - Used in Who Am I trivia

**Top-Level Fields:**
- `success` (boolean): Request success status
- `data` (array): Array of source objects
- `count` (number): Total count matching filters (for pagination)

**Filtering Behavior:**

1. **Theme Filtering**: Uses SQL `IN` clause - matches sources where `theme` is in the provided list
2. **Tag Filtering**: Currently filtered client-side (TODO: improve to database level). Matches sources where any tag in the filter list exists in the source's `tags` array
3. **Search Filtering**: Uses SQL `ILIKE` for case-insensitive title matching
4. **Combined Filters**: All filters are applied with AND logic

**Pagination:**
- Results are ordered by `updated_at` descending (newest first)
- Use `offset` and `limit` for pagination
- `count` field provides total matching results for pagination UI

**Error Responses:**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```
Status: `401` - User not authenticated

```json
{
  "success": false,
  "error": "Failed to fetch sources"
}
```
Status: `500` - Server error

---

## Theme Order

Themes are returned in this predefined order:

1. **Core Game Content**
   - Players
   - Teams & Organizations
   - Awards & Honors
   - Venues & Locations
   - Leadership & Staff

2. **Analysis & Performance**
   - Tactics & Advanced Analytics
   - Training, Health, & Wellness
   - Equipment & Technology

3. **Business & Media**
   - Business & Finance
   - Media, Broadcasting, & E-Sports
   - Marketing, Sponsorship, and Merchandising

4. **Culture & Community**
   - Fandom & Fan Culture
   - Social Impact & Diversity

## Usage Examples

### React Component Usage

```typescript
// Fetch theme stats
const response = await fetch('/api/content-browser?stats=themes');
const { stats } = await response.json();

// Fetch filtered sources
const params = new URLSearchParams({
  themes: 'Players,Teams & Organizations',
  search: 'Stanley Cup',
  limit: '10',
  offset: '0'
});
const response = await fetch(`/api/content-browser?${params}`);
const { data, count } = await response.json();
```

### Next.js Server Component Usage

```typescript
// In a server component
async function getSources() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/content-browser?limit=5`, {
    cache: 'no-store'
  });
  return response.json();
}
```

## Implementation Notes

### Theme Normalization
- Themes are normalized against the predefined `THEME_ORDER` array
- Invalid themes are filtered out (returned as `null`)
- Ensures consistency across the application

### Usage Tracking
Usage is determined by:
1. Querying collection tables (`collection_wisdom`, `collection_greetings`, etc.)
2. Checking `used_for` field in `source_content_ingested` table
3. Combining results and sorting by predefined usage order

### Performance Considerations
- Theme stats endpoint queries all sources (consider caching for large datasets)
- Tag filtering is currently client-side (TODO: optimize to database level)
- Pagination limits default to 5 items per page for performance

## Related Documentation

- [Component Architecture](../implementation/component-architecture.md)
- [Filtering System](../implementation/filtering-system.md)
- [Themes System](../guides/themes-system.md)

