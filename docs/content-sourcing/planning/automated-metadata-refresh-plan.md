# Automated Metadata Refresh Plan

## Overview

This plan outlines how to automate the metadata refresh process for `source_content_ingested` records, moving from manual one-by-one processing to automated batch processing.

---

## Current Manual Process

1. User navigates to `/source-content-updater`
2. System loads next unprocessed source (`metadata_refreshed_at IS NULL`)
3. User clicks "Regenerate Metadata"
4. System calls Gemini API to extract metadata
5. User reviews regenerated metadata
6. User clicks "Save & Load Next"
7. System saves metadata and marks source as processed
8. Repeat for ~200 sources

**Time Estimate**: ~2-3 minutes per source = 6-10 hours total

---

## Automation Goals

1. **Process all unprocessed sources automatically**
2. **Handle errors gracefully** (skip failed sources, log errors)
3. **Respect API rate limits** (Gemini API throttling)
4. **Provide progress tracking** (know how many processed, failed, remaining)
5. **Allow manual intervention** (pause, resume, review failures)
6. **Maintain data quality** (validate before saving)

---

## Automation Approaches

### Option 1: Background Worker Process (Recommended)
**Best for**: Large batches, long-running processes, production use

**Pros:**
- ✅ Runs independently of user session
- ✅ Can process hundreds/thousands of sources
- ✅ Can resume after interruption
- ✅ Better error handling and retry logic
- ✅ Can run on schedule

**Cons:**
- ⚠️ Requires worker infrastructure
- ⚠️ More complex to implement

### Option 2: Server Action with Progress Tracking
**Best for**: Medium batches, user-triggered, simpler implementation

**Pros:**
- ✅ Simpler implementation (no worker infrastructure)
- ✅ User can trigger and monitor
- ✅ Can pause/resume via UI
- ✅ Uses existing server actions

**Cons:**
- ⚠️ Tied to user session (may timeout on large batches)
- ⚠️ Browser must stay open

### Option 3: Hybrid: Batch Processing with Chunks
**Best for**: Best of both worlds

**Pros:**
- ✅ Process in chunks (e.g., 10-20 at a time)
- ✅ User can trigger batches
- ✅ Progress tracking per batch
- ✅ Can pause between batches

**Cons:**
- ⚠️ Still requires user interaction between batches

---

## Recommended Approach: Option 2 (Server Action with Chunks)

**Why**: 
- No new infrastructure needed
- User can monitor progress
- Can process in manageable chunks
- Easy to pause/resume

---

## Implementation Plan

### Phase 1: Batch Processing Server Action

Create a new server action that processes multiple sources in a batch.

**Pseudocode:**

```typescript
// apps/cms/src/app/source-content-updater/actions.ts

interface BatchProcessOptions {
  batchSize?: number;        // How many to process per batch (default: 10)
  maxSources?: number;       // Max total to process (default: null = all)
  delayBetweenBatches?: number; // ms delay between batches (default: 1000)
  continueOnError?: boolean; // Skip failed sources and continue (default: true)
}

interface BatchProcessResult {
  success: boolean;
  processed: number;
  failed: number;
  skipped: number;
  totalRemaining: number;
  errors: Array<{
    sourceId: number;
    error: string;
  }>;
}

async function batchRefreshMetadataAction(
  options: BatchProcessOptions = {}
): Promise<BatchProcessResult> {
  const {
    batchSize = 10,
    maxSources = null,
    delayBetweenBatches = 1000,
    continueOnError = true,
  } = options;

  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ sourceId: number; error: string }>,
  };

  let processedCount = 0;
  const maxToProcess = maxSources ?? Infinity;

  while (processedCount < maxToProcess) {
    // Fetch next batch of unprocessed sources
    const sources = await fetchNextBatchOfUnprocessedSources(batchSize);
    
    if (sources.length === 0) {
      break; // No more sources to process
    }

    // Process each source in the batch
    for (const source of sources) {
      if (processedCount >= maxToProcess) break;

      try {
        // Regenerate metadata
        const regenerateResult = await regenerateMetadataAction(source.id);
        
        if (!regenerateResult.success || !regenerateResult.metadata) {
          throw new Error(regenerateResult.error || 'Failed to regenerate metadata');
        }

        // Validate metadata
        const validation = validateExtractedMetadata(regenerateResult.metadata);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Save metadata
        const saveResult = await saveMetadataAction(source.id, regenerateResult.metadata);
        
        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Failed to save metadata');
        }

        results.processed++;
        processedCount++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          sourceId: source.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (!continueOnError) {
          // Stop processing on first error
          break;
        }
        // Otherwise, continue to next source
      }
    }

    // Delay between batches to respect API rate limits
    if (processedCount < maxToProcess) {
      await sleep(delayBetweenBatches);
    }
  }

  // Get remaining count
  const stats = await getStatsAction();
  const totalRemaining = stats.data?.remaining ?? 0;

  return {
    success: results.failed === 0,
    processed: results.processed,
    failed: results.failed,
    skipped: 0, // Could track skipped sources separately
    totalRemaining,
    errors: results.errors,
  };
}

async function fetchNextBatchOfUnprocessedSources(
  limit: number
): Promise<SourceContentItem[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('source_content_ingested')
    .select('id, title, summary, theme, category, tags, content_text, metadata_refreshed_at, created_at, updated_at')
    .is('metadata_refreshed_at', null)
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching batch:', error);
    return [];
  }

  // Transform to SourceContentItem format
  return (data || []).map(transformToSourceContentItem);
}
```

### Phase 2: UI Component for Batch Processing

Create a UI component that allows users to:
- Start batch processing
- Monitor progress in real-time
- Pause/resume processing
- View errors and failed sources
- See statistics (processed, failed, remaining)

**Pseudocode:**

```typescript
// apps/cms/src/app/source-content-updater/components/BatchRefreshWorkspace.tsx

'use client';

export default function BatchRefreshWorkspace() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    processed: 0,
    failed: 0,
    totalRemaining: 0,
  });
  const [errors, setErrors] = useState<Array<{sourceId: number; error: string}>>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [maxSources, setMaxSources] = useState<number | null>(null);

  const handleStartBatch = async () => {
    setIsProcessing(true);
    setErrors([]);

    // Process in chunks with progress updates
    while (true) {
      const result = await batchRefreshMetadataAction({
        batchSize,
        maxSources: maxSources ?? undefined,
        delayBetweenBatches: 1000,
        continueOnError: true,
      });

      // Update progress
      setProgress({
        processed: result.processed,
        failed: result.failed,
        totalRemaining: result.totalRemaining,
      });

      // Add errors
      if (result.errors.length > 0) {
        setErrors(prev => [...prev, ...result.errors]);
      }

      // Check if done
      if (result.totalRemaining === 0 || result.processed === 0) {
        break;
      }

      // Small delay before next batch
      await sleep(500);
    }

    setIsProcessing(false);
  };

  return (
    <FormCard>
      <h2>Batch Metadata Refresh</h2>
      
      {/* Configuration */}
      <div className="space-y-4">
        <div>
          <label>Batch Size</label>
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            min={1}
            max={50}
            disabled={isProcessing}
          />
          <p className="text-xs text-slate-500">
            Number of sources to process per batch
          </p>
        </div>

        <div>
          <label>Max Sources (optional)</label>
          <input
            type="number"
            value={maxSources ?? ''}
            onChange={(e) => setMaxSources(e.target.value ? Number(e.target.value) : null)}
            min={1}
            disabled={isProcessing}
          />
          <p className="text-xs text-slate-500">
            Leave empty to process all remaining sources
          </p>
        </div>
      </div>

      {/* Progress Display */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span>Processed: {progress.processed}</span>
          <span>Failed: {progress.failed}</span>
          <span>Remaining: {progress.totalRemaining}</span>
        </div>
        <ProgressBar
          value={progress.processed}
          max={progress.processed + progress.totalRemaining}
        />
      </div>

      {/* Errors Display */}
      {errors.length > 0 && (
        <div className="mt-6">
          <h3>Errors ({errors.length})</h3>
          <div className="max-h-40 overflow-y-auto">
            {errors.map((error, idx) => (
              <div key={idx} className="text-xs text-rose-600">
                Source #{error.sourceId}: {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6">
        <PrimaryButton
          onClick={handleStartBatch}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Start Batch Processing'}
        </PrimaryButton>
      </div>
    </FormCard>
  );
}
```

### Phase 3: Enhanced Error Handling & Retry Logic

**Pseudocode:**

```typescript
interface ProcessSourceResult {
  sourceId: number;
  success: boolean;
  error?: string;
  retryable: boolean; // Can we retry this error?
}

async function processSourceWithRetry(
  sourceId: number,
  maxRetries: number = 3
): Promise<ProcessSourceResult> {
  let lastError: string | undefined;
  let retryable = true;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Regenerate metadata
      const regenerateResult = await regenerateMetadataAction(sourceId);
      
      if (!regenerateResult.success || !regenerateResult.metadata) {
        lastError = regenerateResult.error || 'Failed to regenerate metadata';
        retryable = true; // API errors are usually retryable
        continue; // Retry
      }

      // Validate
      const validation = validateExtractedMetadata(regenerateResult.metadata);
      if (!validation.valid) {
        lastError = `Validation failed: ${validation.errors.join(', ')}`;
        retryable = false; // Validation errors are not retryable
        break;
      }

      // Save
      const saveResult = await saveMetadataAction(sourceId, regenerateResult.metadata);
      if (!saveResult.success) {
        lastError = saveResult.error || 'Failed to save metadata';
        retryable = false; // Save errors are usually not retryable
        break;
      }

      // Success!
      return { sourceId, success: true, retryable: false };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      retryable = true; // Exceptions are usually retryable
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await sleep(1000 * attempt); // 1s, 2s, 3s
      }
    }
  }

  return {
    sourceId,
    success: false,
    error: lastError,
    retryable,
  };
}
```

---

## Implementation Steps

### Step 1: Create Batch Processing Server Action
- Add `batchRefreshMetadataAction()` to `actions.ts`
- Add `fetchNextBatchOfUnprocessedSources()` helper
- Add retry logic with exponential backoff
- Add error tracking

### Step 2: Create Batch Processing UI Component
- Create `BatchRefreshWorkspace.tsx` component
- Add configuration options (batch size, max sources)
- Add progress tracking display
- Add error display
- Add start/pause/resume controls

### Step 3: Add to Source Content Updater Page
- Add new section for batch processing
- Keep manual one-by-one option available
- Add toggle between manual and batch modes

### Step 4: Add Rate Limiting & Safety
- Add delay between batches (respect Gemini API limits)
- Add max batch size limit (prevent overwhelming API)
- Add progress persistence (can resume if interrupted)

### Step 5: Testing
- Test with small batches (5-10 sources)
- Test error handling (simulate API failures)
- Test pause/resume functionality
- Test with full batch (~200 sources)

---

## Safety Considerations

### 1. Rate Limiting
- **Delay between batches**: 1-2 seconds minimum
- **Delay between individual sources**: 500ms-1s within batch
- **Max batch size**: 10-20 sources per batch
- **Total processing time**: ~200 sources × 2s = ~7 minutes (reasonable)

### 2. Error Handling
- **Continue on error**: Default to `true` (don't stop entire batch on one failure)
- **Log all errors**: Track which sources failed and why
- **Retry logic**: Retry transient errors (API timeouts, rate limits)
- **Skip validation errors**: Don't retry validation failures (data issue, not transient)

### 3. Data Integrity
- **Validate before save**: Always validate metadata before saving
- **Transaction safety**: Each source save is independent (no rollback needed)
- **Idempotent**: Can re-run on already-processed sources (will skip)

### 4. User Control
- **Manual override**: User can still process manually if needed
- **Pause/Resume**: Can stop batch processing and resume later
- **Selective processing**: Can choose to process specific sources

---

## Alternative: Fully Automated Background Job

If you want fully automated (no user interaction):

```typescript
// Background job that runs automatically
async function automatedMetadataRefreshJob() {
  // Run every hour or on schedule
  const stats = await getStatsAction();
  
  if (stats.data?.remaining === 0) {
    return; // Nothing to process
  }

  // Process in batches automatically
  await batchRefreshMetadataAction({
    batchSize: 10,
    maxSources: 50, // Process 50 per hour
    delayBetweenBatches: 2000,
    continueOnError: true,
  });

  // Log results
  console.log(`Processed batch. Remaining: ${stats.data?.remaining}`);
}
```

**Schedule**: Run every hour via cron job or scheduled task

---

## Recommended Implementation

**Start with**: Option 2 (Server Action with Chunks) - User-triggered batch processing

**Why**:
- ✅ No new infrastructure needed
- ✅ User can monitor and control
- ✅ Can test incrementally
- ✅ Easy to pause/resume
- ✅ Can process all 200 sources in ~10-15 minutes

**Future Enhancement**: Add fully automated background job if needed

---

## Estimated Implementation Time

- **Batch processing server action**: 2-3 hours
- **UI component**: 2-3 hours
- **Error handling & retry logic**: 1-2 hours
- **Testing**: 1-2 hours

**Total**: 6-10 hours

---

## Questions to Consider

1. **Batch size**: How many sources per batch? (Recommend: 10-20)
2. **Rate limiting**: How much delay between batches? (Recommend: 1-2 seconds)
3. **Error handling**: Stop on first error or continue? (Recommend: Continue)
4. **User control**: Allow pause/resume or just start/stop? (Recommend: Start/stop is sufficient)
5. **Progress tracking**: Real-time updates or batch completion? (Recommend: Real-time per batch)

---

## Next Steps

1. Review this plan
2. Decide on batch size and rate limiting
3. Implement batch processing server action
4. Create UI component
5. Test with small batch (5-10 sources)
6. Scale up to full batch (~200 sources)

