# Trivia Statistics System

## Overview

The Trivia Statistics System provides pre-calculated metadata counts for trivia questions, eliminating the need to recalculate counts on every page load. This system uses PostgreSQL materialized views to store aggregated statistics that can be refreshed periodically or on-demand.

## Architecture

### Materialized Views

Three materialized views store pre-calculated statistics:

1. **`trivia_category_statistics`** - Category counts by trivia type, theme, and category
2. **`trivia_theme_statistics`** - Theme-level counts by trivia type
3. **`trivia_difficulty_statistics`** - Difficulty level counts by theme and trivia type

### Key Features

- **Fast Reads**: No calculation overhead on page load
- **Concurrent Refresh**: Views can be refreshed without blocking reads
- **Indexed**: Optimized indexes for common query patterns
- **Reusable**: Works across all trivia types (MC, TF, Who Am I)
- **Extensible**: Easy to add new dimensions or statistics

## Usage

### TypeScript Library

Import the statistics library:

```typescript
import { 
  getCategories, 
  getThemes, 
  getDifficulties,
  type TriviaType 
} from '@/lib/trivia-statistics';
```

### Get Categories for a Theme

```typescript
const categories = await getCategories('multiple_choice', 'Players');
// Returns: [{ category: 'Seasonal', published_count: 45, total_count: 50 }, ...]
```

### Get All Themes

```typescript
const themes = await getThemes('multiple_choice');
// Returns: [{ theme: 'Players', published_count: 120, category_count: 5 }, ...]
```

### Get Difficulty Breakdown

```typescript
const difficulties = await getDifficulties('multiple_choice', 'Players');
// Returns: [{ difficulty: 'Easy', published_count: 40, total_count: 45 }, ...]
```

## Refresh Strategy

### Manual Refresh

```typescript
import { refreshStatistics } from '@/lib/trivia-statistics';

await refreshStatistics();
```

### Scheduled Refresh

Set up a cron job or scheduled task to refresh statistics:

```sql
-- Refresh every hour
SELECT refresh_trivia_statistics();
```

### Trigger-Based Refresh (Optional)

You can add triggers to refresh statistics when questions are inserted/updated:

```sql
CREATE OR REPLACE FUNCTION trigger_refresh_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh in background (non-blocking)
  PERFORM pg_notify('refresh_statistics', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_stats_on_insert
AFTER INSERT ON trivia_multiple_choice
FOR EACH ROW EXECUTE FUNCTION trigger_refresh_statistics();
```

## Reusing for Other Flows

### Pattern for New Metadata Counts

1. **Create Materialized View**: Define the aggregation you need
2. **Add Indexes**: Optimize for your query patterns
3. **Create Helper Functions**: TypeScript functions for easy access
4. **Set Refresh Strategy**: Schedule or trigger-based refresh

### Example: Adding Tag Statistics

```sql
-- Create view for tag counts
CREATE MATERIALIZED VIEW ideation_tag_statistics AS
SELECT 
  tag,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE ingestion_status = 'completed') as completed_count
FROM source_content_ingested,
LATERAL unnest(tags) as tag
GROUP BY tag;

-- Add index
CREATE INDEX idx_ideation_tag_stats_tag ON ideation_tag_statistics (tag);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_ideation_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ideation_tag_statistics;
END;
$$ LANGUAGE plpgsql;
```

### Example: Adding Source Statistics

```sql
-- Create view for source counts by theme
CREATE MATERIALIZED VIEW ideation_source_statistics AS
SELECT 
  theme,
  COUNT(*) as total_sources,
  COUNT(*) FILTER (WHERE ingestion_status = 'completed') as completed_sources
FROM source_content_ingested
WHERE theme IS NOT NULL
GROUP BY theme;

-- Add index
CREATE INDEX idx_ideation_source_stats_theme ON ideation_source_statistics (theme);
```

## Performance Considerations

### When to Refresh

- **After Bulk Updates**: Refresh after importing large batches of questions
- **Scheduled**: Hourly or daily refresh for normal operations
- **On-Demand**: Manual refresh when counts seem stale

### Refresh Frequency

- **High Traffic**: Refresh every 15-30 minutes
- **Normal Traffic**: Refresh hourly
- **Low Traffic**: Refresh daily

### Monitoring

Monitor refresh times and adjust frequency as needed:

```sql
-- Check last refresh time (if you add a last_refreshed column)
SELECT * FROM trivia_category_statistics LIMIT 1;
```

## Migration

Run the migration to create the views:

```bash
# In Supabase SQL Editor or via psql
psql -f sql/migrations/migration_20251114_create_trivia_statistics_views.sql
```

Or execute the SQL file in your Supabase dashboard.

## Best Practices

1. **Always Use Published Count**: Use `published_count` for user-facing displays
2. **Cache Results**: Consider caching results in your application layer for very high-traffic pages
3. **Monitor Performance**: Track query times and adjust indexes as needed
4. **Document New Views**: When adding new materialized views, document their purpose and refresh strategy
5. **Test Refresh**: Ensure refresh functions work correctly before deploying

## Troubleshooting

### Counts Seem Stale

```sql
-- Manually refresh
SELECT refresh_trivia_statistics();
```

### Slow Queries

Check if indexes are being used:

```sql
EXPLAIN ANALYZE 
SELECT * FROM trivia_category_statistics 
WHERE trivia_type = 'multiple_choice' AND theme = 'Players';
```

### View Not Found

Ensure the migration has been run:

```sql
SELECT * FROM pg_matviews WHERE matviewname LIKE 'trivia_%';
```

## Future Enhancements

- Add cooldown-aware counts (exclude recently used questions)
- Add time-based statistics (counts by date ranges)
- Add user-specific statistics (counts per user/creator)
- Add export functionality for analytics

