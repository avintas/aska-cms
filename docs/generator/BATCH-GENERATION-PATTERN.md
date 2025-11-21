# Batch Generation Pattern Documentation

## Overview

This document describes the pattern for creating batch generation functionality for content types in the Main Generator workspace. This pattern allows you to process multiple source content pieces sequentially to generate content items (e.g., trivia questions, motivational messages, etc.).

## Pattern Summary

The batch generation pattern consists of three main components:

1. **Backend Functions** (`apps/cms/src/app/main-generator/actions.ts`)
   - Helper function to count unprocessed sources
   - Helper function to find next unprocessed source
   - Main batch processing action

2. **UI Component** (`apps/cms/src/components/generator/[ContentType]BatchProcessingPanel.tsx`)
   - React component that provides the user interface
   - Displays available sources count
   - Allows configuration of batch size
   - Shows progress and results

3. **Integration** (`apps/cms/src/components/generator/MainGeneratorWorkspace.tsx`)
   - Add the new panel component to the workspace
   - Position it below existing batch processing panels

## Step-by-Step Implementation Guide

### Step 1: Add Backend Functions to `actions.ts`

#### 1.1 Create Count Function

Add a function to count unprocessed sources for your content type:

```typescript
/**
 * Get count of unprocessed sources available for [CONTENT_TYPE] generation
 */
export async function getUnprocessedSourcesCountFor[ContentType](): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for [content_type]
  const { data: processedSources } = await supabase
    .from('[TARGET_TABLE_NAME]')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('[usage_key]')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}
```

**Replace:**
- `[ContentType]` - PascalCase name (e.g., `Motivational`, `Wisdom`)
- `[TARGET_TABLE_NAME]` - Database table name (e.g., `collection_motivational`, `collection_wisdom`)
- `[usage_key]` - Usage key string (e.g., `'motivational'`, `'wisdom'`)

#### 1.2 Create Find Next Source Function

Add a function to find the next unprocessed source:

```typescript
/**
 * Find next unprocessed source for [content_type] messages
 */
async function findNextUnprocessedSourceFor[ContentType](): Promise<number | null> {
  const supabase = await createServerClient();

  // Query [TARGET_TABLE_NAME] to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('[TARGET_TABLE_NAME]')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('[usage_key]')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    offset += batchSize;
  }
}
```

**Replace:**
- `[ContentType]` - PascalCase name
- `[TARGET_TABLE_NAME]` - Database table name
- `[usage_key]` - Usage key string
- `[content_type]` - lowercase description

#### 1.3 Create Batch Action Function

Add the main batch processing function:

```typescript
/**
 * Batch process multiple sources sequentially for [content_type] generation
 */
export async function batchGenerate[ContentType]Action(
  count: number,
): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceFor[ContentType]();

    if (!sourceId) {
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: '[track_key]',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, '[usage_key]');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0,
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}
```

**Replace:**
- `[ContentType]` - PascalCase name
- `[track_key]` - Generator track key (e.g., `'motivational'`, `'wisdom'`, `'trivia_multiple_choice'`)
- `[usage_key]` - Usage key string
- `[content_type]` - lowercase description

### Step 2: Create UI Component

Create a new file: `apps/cms/src/components/generator/[ContentType]BatchProcessingPanel.tsx`

Copy the structure from `AutomatedProcessingPanel.tsx` or `MotivationalBatchProcessingPanel.tsx` and update:

1. **Component name**: `[ContentType]BatchProcessingPanel`
2. **Imports**: Update to use your new functions:
   ```typescript
   import {
     batchGenerate[ContentType]Action,
     getUnprocessedSourcesCountFor[ContentType],
     type BatchProcessResult,
     type UnprocessedSourcesCount,
   } from '@/app/main-generator/actions';
   ```
3. **Title**: Update SectionCard title to match your content type
4. **Description**: Update description text
5. **Input ID**: Make input ID unique (e.g., `process-count-[content-type]`)
6. **Helper text**: Update text to reference your content type
7. **Colors**: Choose a color scheme (green for multiple-choice, blue for motivational, etc.)
   - Success states: `border-[color]-200 bg-[color]-50`
   - Success text: `text-[color]-800 dark:text-[color]-200`
   - Processed stat card: `border-[color]-200 bg-[color]-50`
   - Success badges: `bg-[color]-100 text-[color]-800`

**Example color replacements:**
- Green: `emerald`
- Blue: `blue`
- Purple: `purple`
- Orange: `orange`
- Teal: `teal`

### Step 3: Integrate into MainGeneratorWorkspace

In `apps/cms/src/components/generator/MainGeneratorWorkspace.tsx`:

1. **Add import**:
   ```typescript
   import [ContentType]BatchProcessingPanel from './[ContentType]BatchProcessingPanel';
   ```

2. **Add component** after existing batch processing panels:
   ```typescript
   <AutomatedProcessingPanel />
   <MotivationalBatchProcessingPanel />
   <[ContentType]BatchProcessingPanel />
   ```

## Key Information to Gather Before Starting

Before implementing, you need to know:

1. **Content Type Name** (PascalCase and lowercase)
   - Example: `Motivational` / `motivational`

2. **Database Table Name**
   - Example: `collection_motivational`, `trivia_multiple_choice`

3. **Generator Track Key**
   - Check `apps/cms/src/lib/generator/tracks.ts`
   - Example: `'motivational'`, `'trivia_multiple_choice'`, `'wisdom'`

4. **Usage Key**
   - Check how it's stored in `source_content_ingested.used_for` array
   - Example: `'motivational'`, `'multiple-choice'`, `'wisdom'`

5. **Color Scheme**
   - Choose a distinct color for visual differentiation
   - Available Tailwind colors: `emerald`, `blue`, `purple`, `orange`, `teal`, `indigo`, `pink`, etc.

## Example: Motivational Messages Implementation

**Content Type**: Motivational
**Table**: `collection_motivational`
**Track Key**: `'motivational'`
**Usage Key**: `'motivational'`
**Color**: Blue

**Files Created/Modified:**
- `apps/cms/src/app/main-generator/actions.ts` - Added 3 functions
- `apps/cms/src/components/generator/MotivationalBatchProcessingPanel.tsx` - New component
- `apps/cms/src/components/generator/MainGeneratorWorkspace.tsx` - Added import and component

## Testing Checklist

After implementation:

- [ ] Component renders on Main Generator page
- [ ] Available sources count displays correctly
- [ ] Input field accepts number of sources to process
- [ ] "Start Processing" button triggers batch action
- [ ] Progress indicator shows during processing
- [ ] Results display with correct color scheme
- [ ] Success/failure counts are accurate
- [ ] Detailed results list shows each source processed
- [ ] Sources are marked as processed in database
- [ ] `used_for` array is updated correctly
- [ ] No linter errors

## Common Patterns

### Color Schemes Used
- **Multiple Choice Trivia**: Green (`emerald`)
- **Motivational Messages**: Blue (`blue`)

### Naming Conventions
- Function names: `getUnprocessedSourcesCountFor[ContentType]`, `findNextUnprocessedSourceFor[ContentType]`, `batchGenerate[ContentType]Action`
- Component names: `[ContentType]BatchProcessingPanel`
- File names: `[ContentType]BatchProcessingPanel.tsx` (PascalCase)

### Database Patterns
- All content types use `source_content_id` field to track source relationships
- `used_for` array in `source_content_ingested` tracks which content types have used each source
- Active sources have `content_status = 'active'`

## Notes

- The 2-second cooldown between requests prevents API rate limiting
- Sources are processed sequentially, not in parallel
- Failed sources are tracked but don't stop the batch process
- The batch stops early if no more unprocessed sources are available
- All generated items are saved with `status = 'draft'` by default

## Reference Files

- **Example Implementation**: `apps/cms/src/components/generator/MotivationalBatchProcessingPanel.tsx`
- **Backend Functions**: `apps/cms/src/app/main-generator/actions.ts` (lines 125-521)
- **Workspace Integration**: `apps/cms/src/components/generator/MainGeneratorWorkspace.tsx`
- **Track Definitions**: `apps/cms/src/lib/generator/tracks.ts`

