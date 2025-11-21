# Shared Utilities

## Rules

**Only add utilities here if:**

1. Used by 3+ process builders
2. Generic enough to be reusable
3. Not builder-specific logic

## Before Adding

Ask yourself:

- Is this used by 3+ builders? → YES: Add here
- Is this builder-specific? → NO: Add here
- Is this only used by 1-2 builders? → NO: Keep in builder folders

## Examples

✅ **Good additions:**

- Database query helpers
- Caching utilities
- Logging utilities
- Retry logic

❌ **Bad additions:**

- Theme matching (only specific builders)
- Question selection (only trivia sets)
- Content formatting (only 2 builders)

