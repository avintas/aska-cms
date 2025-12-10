# Suitability Analysis Population Verification

## Overview
This document verifies that the `suitability_analysis` field is being properly populated in the `source_content_ingested` table.

## Database Schema

### Column Definition
```sql
ALTER TABLE public.source_content_ingested
ADD COLUMN IF NOT EXISTS suitability_analysis JSONB DEFAULT NULL;
```

### Index
```sql
CREATE INDEX IF NOT EXISTS idx_source_content_ingested_suitability_analysis 
  ON public.source_content_ingested USING GIN (suitability_analysis);
```

## Code Flow

### 1. Analysis Generation (`src/app/sourcingv3/actions.ts`)

**Location:** `runIngestionPipeline` function (lines 73-95)

```typescript
// Run content suitability analysis (non-blocking - if it fails, ingestion still succeeds)
let suitabilityAnalysis: ContentSuitabilityAnalysis | undefined;
try {
  const analysisPrompt = await getActivePromptByType('content_suitability_analysis');
  if (analysisPrompt) {
    const analysis = await analyzeContentSuitability(processedText, analysisPrompt.prompt_content);
    if (analysis.success && analysis.data) {
      suitabilityAnalysis = analysis.data;
      console.log('Content suitability analysis completed successfully:', Object.keys(suitabilityAnalysis));
    }
  }
} catch (analysisError) {
  // Log but don't fail ingestion
  console.warn('Content suitability analysis failed:', analysisError);
}
```

**Status:** ✅ Analysis is generated via `analyzeContentSuitability` function

### 2. Insert Payload Construction (`src/app/sourcingv3/actions.ts`)

**Location:** `runIngestionPipeline` function (lines 105-133)

```typescript
// Build insert payload with suitability_analysis as a separate column
const insertPayload: Record<string, unknown> = {
  content_text: processedText,
  word_count: processed.wordCount,
  char_count: processed.charCount,
  theme: meta.data.theme,
  tags: meta.data.tags,
  category: meta.data.category,
  summary: meta.data.summary,
  title: enr.data.title,
  key_phrases: enr.data.key_phrases,
  metadata: metadataObj,
  ingestion_process_id,
  ingestion_status: 'complete',
};

// Add suitability_analysis to the insert payload if it exists
if (suitabilityAnalysis && Object.keys(suitabilityAnalysis).length > 0) {
  insertPayload.suitability_analysis = suitabilityAnalysis;
  console.log('Including suitability analysis in insert payload. Content types:', Object.keys(suitabilityAnalysis));
  console.log('Full analysis data:', JSON.stringify(suitabilityAnalysis, null, 2));
} else {
  console.warn('No suitability analysis to save - analysis was not completed or is empty');
}
```

**Status:** ✅ `suitability_analysis` is added to `insertPayload` when available

### 3. Database Insert (`src/app/sourcingv3/actions.ts`)

**Location:** `runIngestionPipeline` function (lines 138-142)

```typescript
const { data, error } = await supabase
  .from('source_content_ingested')
  .insert(insertPayload)
  .select('id, metadata, suitability_analysis')
  .single();
```

**Status:** ✅ Insert includes `suitability_analysis` field and selects it back for verification

### 4. Verification (`src/app/sourcingv3/actions.ts`)

**Location:** `runIngestionPipeline` function (lines 150-164)

```typescript
// Verify what was actually saved
const savedSuitabilityAnalysis = data?.suitability_analysis as ContentSuitabilityAnalysis | null;
if (suitabilityAnalysis && Object.keys(suitabilityAnalysis).length > 0) {
  if (savedSuitabilityAnalysis) {
    console.log('✅ Suitability analysis WAS saved to database column');
    console.log('Saved analysis content types:', Object.keys(savedSuitabilityAnalysis));
  } else {
    console.error('❌ Suitability analysis was NOT saved to database column');
    console.error('Expected analysis:', JSON.stringify(suitabilityAnalysis, null, 2));
    console.error('Actual saved analysis:', savedSuitabilityAnalysis);
  }
}
```

**Status:** ✅ Code verifies that the data was saved correctly

## Expected JSON Structure

```json
{
  "multiple_choice_trivia": {
    "suitable": true,
    "confidence": 0.85,
    "reasoning": "Content contains factual information..."
  },
  "true_false_trivia": {
    "suitable": true,
    "confidence": 0.75,
    "reasoning": "Content has verifiable statements..."
  },
  "who_am_i_trivia": {
    "suitable": false,
    "confidence": 0.3,
    "reasoning": "Not enough biographical details..."
  },
  "motivational": {
    "suitable": true,
    "confidence": 0.9,
    "reasoning": "Contains inspirational themes..."
  },
  "facts": {
    "suitable": true,
    "confidence": 0.8,
    "reasoning": "Contains numerical data and statistics..."
  },
  "wisdom": {
    "suitable": false,
    "confidence": 0.2,
    "reasoning": "No philosophical insights..."
  }
}
```

## Verification Queries

### Check if column exists
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'source_content_ingested'
  AND column_name = 'suitability_analysis';
```

### Check if index exists
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'source_content_ingested'
  AND indexname = 'idx_source_content_ingested_suitability_analysis';
```

### Count records with suitability_analysis
```sql
SELECT 
  COUNT(*) as total_records,
  COUNT(suitability_analysis) as records_with_analysis,
  COUNT(*) FILTER (WHERE suitability_analysis IS NOT NULL) as non_null_count
FROM public.source_content_ingested;
```

### Find sources suitable for specific content types
```sql
-- Multiple choice trivia
SELECT id, title, theme, 
  suitability_analysis->'multiple_choice_trivia'->>'suitable' as mc_suitable,
  suitability_analysis->'multiple_choice_trivia'->>'confidence' as mc_confidence
FROM public.source_content_ingested
WHERE suitability_analysis->'multiple_choice_trivia'->>'suitable' = 'true'
LIMIT 10;

-- Who Am I trivia
SELECT id, title, theme,
  suitability_analysis->'who_am_i_trivia'->>'suitable' as wai_suitable,
  suitability_analysis->'who_am_i_trivia'->>'confidence' as wai_confidence
FROM public.source_content_ingested
WHERE suitability_analysis->'who_am_i_trivia'->>'suitable' = 'true'
LIMIT 10;
```

## Potential Issues

### 1. Analysis Not Generated
- **Symptom:** `suitabilityAnalysis` is undefined or empty
- **Check:** Console logs for "Content suitability analysis completed successfully"
- **Cause:** Prompt not found, Gemini API error, or analysis failed
- **Solution:** Check prompt exists in database, verify API key, check error logs

### 2. Analysis Not Added to Payload
- **Symptom:** Console shows "No suitability analysis to save"
- **Check:** Console logs for analysis completion
- **Cause:** Analysis returned empty or failed validation
- **Solution:** Check `analyzeContentSuitability` function and validation

### 3. Analysis Not Saved to Database
- **Symptom:** Console shows "❌ Suitability analysis was NOT saved"
- **Check:** Database RLS policies, column permissions
- **Cause:** Database permissions, RLS policy blocking insert
- **Solution:** Verify RLS policies allow insert of `suitability_analysis` column

### 4. Wrong Column Name
- **Symptom:** Data saved but in wrong column
- **Check:** Verify column name matches exactly: `suitability_analysis`
- **Cause:** Typo in column name
- **Solution:** Verify migration ran correctly

## Summary

✅ **Column Definition:** Correctly defined as JSONB  
✅ **Index:** GIN index created for efficient queries  
✅ **Analysis Generation:** Code generates analysis via Gemini  
✅ **Payload Construction:** Analysis added to insert payload  
✅ **Database Insert:** Insert includes `suitability_analysis` field  
✅ **Verification:** Code verifies data was saved  
✅ **Documentation:** Column comment updated to include all 6 content types  

**The `suitability_analysis` field IS being populated correctly in the code.**

