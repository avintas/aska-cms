# Content Browser Component Architecture

Technical documentation for the Content Browser component structure and design.

## Component Hierarchy

```
ContentBrowserPage (page.tsx)
└── ContentBrowser (component)
    ├── Filters Section
    │   ├── Header
    │   ├── Search Input
    │   ├── Clear Filters Button
    │   └── Theme Badges Grid
    └── Results Section
        ├── Header (count display)
        ├── Source Cards List
        └── Pagination Controls
```

## File Structure

```
apps/cms/src/
├── app/
│   ├── content-browser/
│   │   └── page.tsx                    # Page wrapper component
│   └── api/
│       └── content-browser/
│           └── route.ts                 # API route handler
└── components/
    └── ideation/
        ├── ContentBrowser.tsx           # Main component
        └── SourceCard.tsx               # Individual source card
```

## Component Details

### ContentBrowserPage (`apps/cms/src/app/content-browser/page.tsx`)

**Purpose:** Page-level wrapper that handles initial data fetching and loading states.

**Responsibilities:**
- Fetch initial theme statistics
- Fetch initial source list
- Handle loading state
- Pass data to ContentBrowser component

**Key Features:**
- Client-side component (`'use client'`)
- Parallel data fetching (Promise.all)
- Loading state management
- Error handling

**Props:** None (fetches own data)

**State:**
- `themeStats`: IdeationThemeStat[]
- `initialSources`: IdeationSourceSummary[]
- `initialTotal`: number
- `loading`: boolean

---

### ContentBrowser (`apps/cms/src/components/ideation/ContentBrowser.tsx`)

**Purpose:** Main browsing interface with filtering and pagination.

**Responsibilities:**
- Display filters (themes, search)
- Handle filter changes
- Fetch filtered content
- Display paginated results
- Manage pagination state

**Props:**
```typescript
interface ContentBrowserProps {
  themeStats: IdeationThemeStat[];
  initialSources: IdeationSourceSummary[];
  initialTotal: number;
}
```

**State:**
- `filters`: BrowserFilters (themes, search)
- `sources`: IdeationSourceSummary[]
- `total`: number
- `loading`: boolean
- `themeStats`: IdeationThemeStat[]
- `currentPage`: number

**Key Features:**
- Filter state management
- Pagination logic
- API integration
- Responsive design
- Dark mode support

**Component Structure:**

```typescript
<div className="space-y-8">
  {/* Filters Section */}
  <section>
    <header>
      <h1>Content Browser</h1>
      <SearchInput />
      <ClearFiltersButton />
    </header>
    <ThemeBadges />
  </section>

  {/* Results Section */}
  <section>
    <header>
      <ResultsCount />
    </header>
    <SourceCardsList />
    <PaginationControls />
  </section>
</div>
```

---

### SourceCard (`apps/cms/src/components/ideation/SourceCard.tsx`)

**Purpose:** Display individual source content item.

**Responsibilities:**
- Display source metadata
- Show usage indicators
- Display status badges
- Format dates and tags

**Props:**
```typescript
interface SourceCardProps {
  source: IdeationSourceSummary;
}
```

**Display Elements:**
- Title
- Theme badge
- Category (if available)
- Summary
- Tags
- Usage badges
- Status badge
- Updated timestamp
- Process ID (if available)

---

## State Management

### Filter State

```typescript
interface BrowserFilters {
  themes: string[];      // Array of selected theme names
  search: string;        // Search query string
}
```

**Filter Updates:**
- Theme toggle: Add/remove from array
- Search: Update string value
- Clear: Reset to empty state

**Effects:**
- Filters change → Reset to page 1
- Filters change → Fetch new content
- Page change → Fetch new page

### Pagination State

```typescript
const pageSize = 5;                    // Fixed page size
const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.ceil(total / pageSize);
```

**Pagination Logic:**
- Calculate total pages from total count
- Validate current page against total pages
- Adjust current page if out of bounds
- Build pagination window for display

---

## API Integration

### Data Fetching Flow

1. **Initial Load** (ContentBrowserPage):
   ```
   GET /api/content-browser?stats=themes
   GET /api/content-browser?limit=5&offset=0
   ```

2. **Filter Change** (ContentBrowser):
   ```
   GET /api/content-browser?themes=X&search=Y&limit=5&offset=0
   ```

3. **Page Change** (ContentBrowser):
   ```
   GET /api/content-browser?themes=X&limit=5&offset=(page-1)*5
   ```

### API Client Functions

**fetchThemeStats:**
- Fetches theme statistics
- Updates themeStats state
- Optional periodic refresh

**fetchContent:**
- Builds query parameters from filters
- Calculates offset from current page
- Fetches filtered sources
- Updates sources and total count

---

## Styling Architecture

### Design System

Uses Tailwind CSS with custom design tokens:
- **Colors**: `primary-brand` (#10b981)
- **Spacing**: Consistent spacing scale
- **Typography**: System font stack
- **Borders**: Rounded corners (rounded-3xl, rounded-full)
- **Shadows**: Subtle shadow system

### Component Styles

**Filters Section:**
- White/dark background card
- Rounded corners (rounded-3xl)
- Shadow elevation
- Responsive padding

**Theme Badges:**
- Rounded-full pills
- Border and background states
- Hover effects
- Active state highlighting

**Source Cards:**
- Card-based layout
- Spacing between cards
- Responsive grid (future)

**Pagination:**
- Button-based navigation
- Active state highlighting
- Disabled state styling
- Responsive wrapping

### Dark Mode

Supports dark mode via Tailwind's `dark:` prefix:
- Dark backgrounds: `dark:bg-slate-900`
- Dark borders: `dark:border-slate-800`
- Dark text: `dark:text-slate-100`
- Dark hover states

---

## Performance Considerations

### Optimization Strategies

1. **Pagination**: Limits results per page (default: 5)
2. **Debouncing**: Search input could be debounced (future)
3. **Memoization**: Pagination window calculation memoized
4. **Parallel Fetching**: Initial data fetched in parallel
5. **Loading States**: Prevents duplicate requests

### Potential Improvements

- **Caching**: Cache theme stats (rarely change)
- **Virtual Scrolling**: For very large result sets
- **Infinite Scroll**: Alternative to pagination
- **Prefetching**: Prefetch next page on hover

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter**: Submit search
- **Space**: Toggle theme filters (future)
- **Arrow Keys**: Navigate pagination (future)

### ARIA Labels

- Search input: "Search content titles"
- Theme buttons: "Filter by {theme}"
- Pagination: "Page {number}"
- Clear filters: "Clear all filters"

### Screen Reader Support

- Semantic HTML structure
- Descriptive button labels
- Status announcements (loading, results count)
- Error messages

---

## Error Handling

### Error States

1. **API Errors**: Display error message, allow retry
2. **Network Errors**: Show connection error
3. **Empty Results**: Show "No sources match" message
4. **Invalid Filters**: Validate before API call

### Error Recovery

- Retry button for failed requests
- Fallback to cached data (future)
- Graceful degradation

---

## Testing Considerations

### Unit Tests

- Filter state management
- Pagination calculations
- API parameter building
- Theme toggle logic

### Integration Tests

- API integration
- Filter application
- Pagination navigation
- Loading states

### E2E Tests

- Full user workflow
- Filter combinations
- Pagination flow
- Error scenarios

---

## Related Documentation

- [Content Browser API](../api/content-browser-api.md)
- [Filtering System](./filtering-system.md)
- [Using Content Browser](../guides/using-content-browser.md)

