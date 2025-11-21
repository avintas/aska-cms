# Content Browser Filtering System

Technical documentation for how filtering works in the Content Browser.

## Overview

The Content Browser supports three types of filters:
1. **Theme Filtering**: Filter by one or more themes
2. **Search Filtering**: Search by title (case-insensitive)
3. **Tag Filtering**: Filter by tags (planned, currently client-side)

Filters can be combined using AND logic.

## Filter State Management

### State Structure

```typescript
interface BrowserFilters {
  themes: string[];      // Array of theme names
  search: string;        // Search query string
}
```

### State Updates

**Theme Toggle:**
```typescript
const toggleTheme = (theme: string): void => {
  setFilters((prev) => ({
    ...prev,
    themes: prev.themes.includes(theme)
      ? prev.themes.filter((t) => t !== theme)
      : [...prev.themes, theme],
  }));
};
```

**Search Update:**
```typescript
onChange={(event) => {
  const value = event.target.value;
  setFilters((prev) => ({ ...prev, search: value }));
}}
```

**Clear Filters:**
```typescript
const clearFilters = (): void => {
  setFilters({ themes: [], search: '' });
};
```

## API Query Building

### Parameter Construction

```typescript
const params = new URLSearchParams({
  limit: String(pageSize),
  offset: String(offset),
});

if (filters.themes.length > 0) {
  // Use pipe delimiter to avoid issues with commas in theme names
  params.append('themes', filters.themes.join('|'));
}

if (filters.search.trim()) {
  params.append('search', filters.search.trim());
}
```

### Example Queries

**Single Theme:**
```
GET /api/content-browser?themes=Players&limit=5&offset=0
```

**Multiple Themes:**
```
GET /api/content-browser?themes=Players|Teams%20%26%20Organizations&limit=5&offset=0
```

**Search Only:**
```
GET /api/content-browser?search=Stanley%20Cup&limit=5&offset=0
```

**Combined Filters:**
```
GET /api/content-browser?themes=Players&search=goal&limit=5&offset=0
```

## Server-Side Filtering

### Theme Filtering

**Implementation:**
```typescript
if (themesParam) {
  const themes = themesParam.split(',').filter(Boolean);
  if (themes.length > 0) {
    query = query.in('theme', themes);
  }
}
```

**SQL Generated:**
```sql
WHERE theme IN ('Players', 'Teams & Organizations')
```

**Behavior:**
- Uses SQL `IN` clause
- Matches sources where theme is in the provided list
- OR logic: matches any of the selected themes

### Search Filtering

**Implementation:**
```typescript
if (search?.trim()) {
  query = query.ilike('title', `%${search.trim()}%`);
}
```

**SQL Generated:**
```sql
WHERE title ILIKE '%Stanley Cup%'
```

**Behavior:**
- Case-insensitive matching (`ILIKE`)
- Partial match (wrapped in `%`)
- Searches only `title` field, not summary or tags

### Tag Filtering (Client-Side)

**Current Implementation:**
```typescript
if (tagsParam) {
  const tags = tagsParam.split(',').filter(Boolean);
  if (tags.length > 0) {
    filteredItems = items.filter((item) => 
      tags.some((filterTag) => item.tags.includes(filterTag))
    );
  }
}
```

**Limitations:**
- Currently filtered client-side after fetching
- Requires fetching all matching results first
- Not efficient for large datasets

**Future Improvement:**
- Move to database-level filtering
- Use PostgreSQL array operators
- Example: `WHERE tags @> ARRAY['tag1', 'tag2']`

## Filter Combination Logic

### AND Logic

All filters are combined with AND logic:
- Theme filter AND search filter AND tag filter

**Example:**
- Themes: `["Players"]`
- Search: `"goal"`
- Result: Sources that are Players theme AND have "goal" in title

### Filter Precedence

Filters are applied in this order:
1. Theme filter (SQL WHERE)
2. Search filter (SQL WHERE)
3. Tag filter (client-side, if implemented)

## Filter Effects

### On Data Fetching

**Trigger:** Filter state changes
```typescript
useEffect(() => {
  fetchContent();
}, [currentPage, pageSize, filters]);
```

**Behavior:**
- Fetches new data when filters change
- Resets to page 1 when filters change
- Shows loading state during fetch

### On Pagination

**Reset to Page 1:**
```typescript
useEffect(() => {
  setCurrentPage(1);
}, [filters.themes, filters.search]);
```

**Reason:** Filter changes may reduce total count, making current page invalid

### On Theme Stats

**Current Behavior:** Theme stats are fetched once on mount

**Future Enhancement:** Could refresh stats when filters change to show filtered counts

## Filter Validation

### Theme Validation

**Server-Side:**
```typescript
function normalizeTheme(value: string | null): IdeationTheme | null {
  if (!value) return null;
  return THEME_ORDER.find((theme) => theme === theme) ?? null;
}
```

**Behavior:**
- Invalid themes are filtered out
- Only themes in `THEME_ORDER` are accepted
- Prevents SQL injection and invalid queries

### Search Validation

**Client-Side:**
```typescript
if (filters.search.trim()) {
  params.append('search', filters.search.trim());
}
```

**Server-Side:**
```typescript
if (search?.trim()) {
  query = query.ilike('title', `%${search.trim()}%`);
}
```

**Behavior:**
- Trims whitespace
- Only applies if non-empty after trim
- Safe for SQL (parameterized query)

## Performance Considerations

### Query Optimization

**Indexes:**
- `theme` column should be indexed
- `title` column should be indexed for search
- Consider composite index for common filter combinations

**Pagination:**
- Always uses `LIMIT` and `OFFSET`
- Prevents fetching all results
- Efficient for large datasets

### Client-Side Optimization

**Debouncing Search:**
- Could debounce search input (future)
- Reduces API calls during typing
- Improves performance

**Memoization:**
- Filter parameters memoized
- Prevents unnecessary re-renders
- Optimizes component updates

## Filter UI Feedback

### Visual States

**Theme Badges:**
- Active: Green border, green background tint
- Inactive (has content): Gray border, hover effect
- Inactive (no content): Faded appearance

**Search Input:**
- Shows current search value
- Clear button when value exists
- Placeholder text when empty

**Clear Filters Button:**
- Disabled when no filters active
- Enabled when any filter active
- Resets all filters on click

### Loading States

**During Filter Application:**
- Shows "Loading..." in results section
- Disables pagination controls
- Prevents duplicate requests

## Edge Cases

### Empty Filters

**Behavior:**
- No filters → Shows all content
- Empty theme array → No theme filter applied
- Empty search → No search filter applied

### No Results

**Behavior:**
- Shows "No sources match your filters" message
- Maintains filter state
- Allows user to adjust filters

### Invalid Filters

**Theme:**
- Invalid themes filtered out server-side
- Query continues with valid themes only

**Search:**
- Empty/whitespace-only search ignored
- Special characters handled by parameterized queries

## Future Enhancements

### Planned Improvements

1. **Tag Filtering (Server-Side)**
   - Move to database-level filtering
   - Use PostgreSQL array operators
   - Improve performance

2. **Advanced Filters**
   - Date range filtering
   - Status filtering
   - Category filtering

3. **Filter Presets**
   - Save common filter combinations
   - Quick filter buttons
   - Filter history

4. **Filter Analytics**
   - Track popular filter combinations
   - Suggest related filters
   - Show filter effectiveness

## Related Documentation

- [Content Browser API](../api/content-browser-api.md)
- [Component Architecture](./component-architecture.md)
- [Using Content Browser](../guides/using-content-browser.md)

