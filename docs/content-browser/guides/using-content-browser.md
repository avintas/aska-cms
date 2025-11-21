# Using Content Browser

User guide for navigating and using the Content Browser feature.

## Accessing Content Browser

The Content Browser is accessible from:

1. **Main Navigation**: Click "Content Browser" in the CMS navigation menu
2. **URL**: Navigate directly to `/content-browser`
3. **Ideation Workspace**: Click "Open Content Browser" button from the Ideation module

## Interface Overview

The Content Browser consists of two main sections:

### 1. Filters Section

Located at the top, this section contains:

- **Search Bar**: Search content by title
- **Clear Filters Button**: Reset all filters
- **Theme Badges**: Clickable theme filters with source counts

### 2. Results Section

Displays filtered content with:
- **Source Count**: Total number of matching sources
- **Source Cards**: Individual content items
- **Pagination**: Navigate through multiple pages

## Filtering Content

### By Theme

1. **View Available Themes**: All 13 themes are displayed as badges
2. **Theme Badges Show**:
   - Theme name
   - Source count (e.g., "Players · 45")
   - Visual state (active/inactive)
3. **Activate Theme Filter**: Click a theme badge to filter by that theme
4. **Multiple Themes**: Click multiple badges to filter by multiple themes (OR logic)
5. **Deactivate**: Click an active badge again to remove the filter

**Visual Indicators:**
- **Active**: Green border, green background tint, green text
- **Inactive (has content)**: Gray border, light background, hover effect
- **Inactive (no content)**: Gray border, faded appearance

### By Search

1. **Enter Search Term**: Type in the search bar
2. **Search Matches**: Case-insensitive search against source titles
3. **Combine with Themes**: Search works alongside theme filters
4. **Clear Search**: Click "Clear filters" or delete text

**Search Tips:**
- Searches only titles, not summaries or tags
- Case-insensitive matching
- Partial matches supported (e.g., "Stanley" matches "Stanley Cup")

### Clearing Filters

Click the **"Clear filters"** button to:
- Remove all theme filters
- Clear search text
- Reset to show all content
- Reset to page 1

## Understanding Source Cards

Each source card displays:

### Header Information
- **Title**: Source content title
- **Theme Badge**: Theme with color coding
- **Category**: Category within theme (if available)
- **Status Badge**: Ingestion status

### Content Details
- **Summary**: Brief description of the content
- **Tags**: Clickable tags (future: filter by tag)
- **Updated**: Last update timestamp

### Usage Indicators
- **Usage Badges**: Shows where content has been used:
  - Wisdom
  - Greeting
  - Motivational
  - Stat
  - Multiple Choice
  - True/False
  - Who Am I

### Metadata
- **Process ID**: Ingestion process identifier
- **Updated At**: Timestamp of last update

## Pagination

### Navigation
- **Page Numbers**: Click page numbers to jump to specific page
- **Previous/Next**: Navigate sequentially
- **Ellipsis**: Indicates more pages available

### Page Information
- **Current Page**: Shows "Showing page X of Y"
- **Page Size**: Default 5 items per page
- **Auto-Reset**: Returns to page 1 when filters change

### Pagination Window
The pagination shows:
- First 2 pages
- Pages around current page (±1)
- Last 2 pages
- Ellipsis for gaps

**Example:** If on page 5 of 10:
```
[Previous] 1 2 ... 4 5 6 ... 9 10 [Next]
```

## Content Status Indicators

### Ingestion Status

- **Complete**: Content fully processed and ready
- **Pending**: Content being processed
- **Failed**: Processing encountered errors
- **Unknown**: Status not determined

### Usage Status

Shows badges for each collection/trivia type where content has been used:
- **Wisdom**: Used in Wisdom collection
- **Greeting**: Used in Greetings collection
- **Motivational**: Used in Motivational collection
- **Stat**: Used in Stats collection
- **Multiple Choice**: Used in Multiple Choice trivia
- **True/False**: Used in True/False trivia
- **Who Am I**: Used in Who Am I trivia

**No Usage**: If no badges appear, content hasn't been used yet.

## Best Practices

### Finding Content

1. **Start Broad**: Begin with theme filters to narrow down
2. **Refine with Search**: Use search to find specific content within themes
3. **Check Usage**: Look at usage badges to see what's already been used
4. **Review Status**: Check ingestion status to ensure content is ready

### Filtering Strategy

1. **Single Theme**: Use one theme for focused browsing
2. **Multiple Themes**: Combine related themes (e.g., Players + Awards & Honors)
3. **Search First**: If you know the title, search first, then refine with themes
4. **Clear Often**: Clear filters to see full catalog periodically

### Content Selection

1. **Read Summaries**: Review summaries to understand content
2. **Check Tags**: Tags provide additional context
3. **Verify Status**: Ensure content is "complete" before using
4. **Review Usage**: See where content has been used to avoid duplication

## Keyboard Shortcuts

Currently, the Content Browser supports:
- **Tab**: Navigate between interactive elements
- **Enter**: Submit search (when focused on search bar)
- **Escape**: Clear search (future enhancement)

## Loading States

- **Initial Load**: Shows "Loading..." while fetching data
- **Filter Changes**: Shows "Loading..." while applying filters
- **Page Changes**: Shows "Loading..." while fetching new page

## Error Handling

If an error occurs:
- **Network Error**: Check connection and try again
- **No Results**: Adjust filters or search terms
- **Empty State**: "No sources match your filters" message appears

## Related Features

### From Content Browser

- **Ideation Workspace**: Select content for ideation plans
- **Process Builders**: Use content for generation workflows
- **Collections**: Content can be used in various collections

### To Content Browser

- **Sourcing Page**: "View in Content Browser" links filter by theme
- **Ingestion Logs**: Quick links to view content in browser

## Future Enhancements

Planned improvements:
- Tag filtering (currently search only)
- Content detail pages
- Bulk selection
- Export functionality
- Advanced filters (date range, status)
- Sort options (date, title, usage)

## Related Documentation

- [Themes System](./themes-system.md) - Understanding themes
- [Content Browser API](../api/content-browser-api.md) - API reference
- [Component Architecture](../implementation/component-architecture.md) - Technical details

