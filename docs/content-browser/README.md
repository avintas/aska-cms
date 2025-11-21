# Content Browser Documentation

Complete documentation for the Content Browser feature - a powerful tool for browsing, filtering, and exploring ingested content by themes, categories, and tags.

## Quick Links

- [API Documentation](./api/) - API endpoints and usage
- [Implementation Guides](./implementation/) - Component architecture and implementation details
- [Usage Guides](./guides/) - How to use the Content Browser
- [Themes System](./guides/themes-system.md) - Theme definitions and organization

## Overview

The Content Browser is a central feature of the Ideation Module that provides:

- **Content Exploration**: Browse all ingested content from `source_content_ingested` table
- **Theme Filtering**: Filter content by 13 predefined themes
- **Search**: Search content by title
- **Pagination**: Efficient pagination for large content sets
- **Usage Tracking**: See where content has been used (Wisdom, Greetings, Trivia, etc.)
- **Status Indicators**: View ingestion status and metadata

## Key Features

### Theme-Based Filtering

- Filter by one or multiple themes
- See source counts per theme
- Visual theme badges with counts

### Search & Discovery

- Search content by title
- Combine search with theme filters
- Clear filters easily

### Content Display

- Source cards showing title, summary, theme, category, tags
- Usage indicators (where content has been used)
- Ingestion status badges
- Updated timestamps

### Pagination

- Configurable page size (default: 5)
- Smart pagination window display
- Smooth scrolling to top on page change

## Related Domains

- **[Content Sourcing](../content-sourcing/)** - How content is ingested and processed
- **[Process Builders](../process-builders/)** - Uses Content Browser selections for generation
- **[Collections](../collections/)** - Collections created from Content Browser content
- **[Ideation Module](../archive/status/ideation-module-summary.md)** - Parent module context

## Architecture

### Components

- **ContentBrowser Component**: Main browsing interface (`apps/cms/src/components/ideation/ContentBrowser.tsx`)
- **ContentBrowserPage**: Page wrapper (`apps/cms/src/app/content-browser/page.tsx`)
- **SourceCard**: Individual content card display

### API Routes

- **GET `/api/content-browser`**: Fetch sources with filters and pagination
- **GET `/api/content-browser?stats=themes`**: Get theme statistics
- **GET `/api/content-browser?stats=tags`**: Get tag statistics

### Data Flow

1. Page loads → Fetches theme stats and initial sources
2. User applies filters → Fetches filtered content
3. User changes page → Fetches paginated results
4. Content displayed → Shows usage, status, metadata

## Key Documents

### API

- [Content Browser API](./api/content-browser-api.md) - Complete API reference

### Implementation

- [Component Architecture](./implementation/component-architecture.md) - Component structure and design
- [Filtering System](./implementation/filtering-system.md) - How filtering works

### Guides

- [Using Content Browser](./guides/using-content-browser.md) - User guide
- [Themes System](./guides/themes-system.md) - Theme definitions and usage
- [Content Selection](./guides/content-selection.md) - How to select and use content

## Theme System

The Content Browser uses a comprehensive 13-theme system organized into four groups:

1. **Core Game Content** (5 themes)
   - Players
   - Teams & Organizations
   - Awards & Honors
   - Venues & Locations
   - Leadership & Staff

2. **Analysis & Performance** (3 themes)
   - Tactics & Advanced Analytics
   - Training, Health, & Wellness
   - Equipment & Technology

3. **Business & Media** (3 themes)
   - Business & Finance
   - Media, Broadcasting, & E-Sports
   - Marketing, Sponsorship, and Merchandising

4. **Culture & Community** (2 themes)
   - Fandom & Fan Culture
   - Social Impact & Diversity

See [Themes System Guide](./guides/themes-system.md) for complete details.
