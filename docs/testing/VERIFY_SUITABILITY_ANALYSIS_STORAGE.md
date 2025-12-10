# Verifying Suitability Analysis Storage

## Where Suitability Analysis is Stored

**Table:** `source_content_ingested`  
**Column:** `suitability_analysis` (JSONB)

This is **metadata** about the source - it tells us which content types the source is suitable for. It is NOT the generated content itself.

## How to Verify It's Being Saved

### 1. Check Console Logs During Ingestion

When you ingest content, you should see these logs:
- `"Including suitability analysis in insert payload. Content types: [...]"`
- `"Inserting payload with suitability_analysis: YES"`
- `"✅ Suitability analysis WAS saved to database column"`

If you see `"❌ Suitability analysis was NOT saved"`, there's a problem.

### 2. Query the Database Directly

```sql
-- Check if suitability_analysis column exists and has data
SELECT 
  id,
  title,
  suitability_analysis IS NOT NULL as has_analysis,
  jsonb_object_keys(suitability_analysis) as content_types
FROM source_content_ingested
WHERE suitability_analysis IS NOT NULL
ORDER BY id DESC
LIMIT 5;
```

### 3. Check a Specific Record

```sql
-- View full suitability_analysis for a specific record
SELECT 
  id,
  title,
  suitability_analysis
FROM source_content_ingested
WHERE id = YOUR_RECORD_ID;
```

### 4. Count Records with Analysis

```sql
-- See how many sources have suitability analysis
SELECT 
  COUNT(*) as total_sources,
  COUNT(suitability_analysis) as sources_with_analysis,
  COUNT(*) FILTER (WHERE suitability_analysis IS NOT NULL) as non_null_count
FROM source_content_ingested;
```

## Expected Structure

The `suitability_analysis` column should contain JSONB like:

```json
{
  "multiple_choice_trivia": {
    "suitable": true,
    "confidence": 0.8,
    "reasoning": "Content contains factual information..."
  },
  "true_false_trivia": {
    "suitable": true,
    "confidence": 0.7,
    "reasoning": "Content has verifiable statements..."
  },
  "who_am_i_trivia": {
    "suitable": false,
    "confidence": 0.3,
    "reasoning": "Not enough identifying details..."
  },
  "motivational": {
    "suitable": true,
    "confidence": 0.6,
    "reasoning": "Contains inspirational themes..."
  },
  "facts": {
    "suitable": true,
    "confidence": 0.9,
    "reasoning": "Rich in statistical data..."
  },
  "wisdom": {
    "suitable": false,
    "confidence": 0.2,
    "reasoning": "Lacks philosophical depth..."
  }
}
```

## Troubleshooting

### If suitability_analysis is NULL:

1. **Check if analysis ran:**
   - Look for console logs: `"Content suitability analysis completed successfully"`
   - Check if prompt exists: `SELECT * FROM ai_extraction_prompts WHERE prompt_type = 'content_suitability_analysis' AND is_active = true;`

2. **Check if column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'source_content_ingested' 
     AND column_name = 'suitability_analysis';
   ```

3. **Check for errors:**
   - Look for: `"Content suitability analysis failed"`
   - Check if analysis prompt is active

### If suitability_analysis exists but is empty:

- The analysis might have failed silently (non-blocking)
- Check console logs for warnings
- Verify the prompt includes all 6 content types

## Important Notes

- **Suitability analysis is metadata** - it's stored with the source, not in collection tables
- **Collection tables are separate** - they store the actual generated content (facts, trivia, etc.)
- **Suitability analysis tells us** which content types we CAN generate from a source
- **Collection tables store** the actual generated content AFTER we generate it

## Next Steps After Verification

Once suitability analysis is confirmed to be saving:
1. Use it to filter sources for multi-type processing
2. Query sources by suitability: `WHERE suitability_analysis->'facts'->>'suitable' = 'true'`
3. Process sources for all suitable content types automatically

