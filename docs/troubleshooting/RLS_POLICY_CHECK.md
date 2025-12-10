# RLS Policy Check for suitability_analysis

## Issue
If `suitability_analysis` is not being saved to the database, RLS (Row Level Security) policies might be blocking the insert/update of this column.

## Quick Check

Based on your Supabase policies page, you have:
- ✅ INSERT policy for authenticated users
- ✅ UPDATE policy for authenticated users

However, these policies might have **column-level restrictions** that exclude `suitability_analysis`.

## How to Check

### Option 1: Check in Supabase Dashboard
1. Go to **Authentication** → **Policies** → **source_content_ingested**
2. Click on each INSERT and UPDATE policy
3. Look at the **WITH CHECK** expression
4. If it's empty or `true` → ✅ All columns allowed
5. If it lists specific columns → ⚠️ Check if `suitability_analysis` is included

### Option 2: Run SQL Query
Run the verification script: `sql/verification/verify_suitability_analysis_rls.sql`

This will show:
- All policies for the table
- Whether policies have column restrictions
- Whether `suitability_analysis` is mentioned

## Common Issues

### Issue 1: Policy Has Column Restrictions
**Symptom:** Policy `WITH CHECK` expression lists specific columns, but `suitability_analysis` is not included.

**Solution:** Update the policy to include `suitability_analysis` or remove column restrictions:

```sql
-- Option A: Update existing policy to allow all columns
ALTER POLICY "Authenticated users can insert source content ingested"
ON public.source_content_ingested
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allows all columns

-- Option B: Create new policy specifically for suitability_analysis
CREATE POLICY "Allow insert with suitability_analysis"
ON public.source_content_ingested
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Issue 2: Policy Blocks JSONB Columns
**Symptom:** Policy explicitly excludes JSONB columns or has restrictions on JSONB fields.

**Solution:** Ensure policy allows JSONB columns:

```sql
ALTER POLICY "Authenticated users can insert source content ingested"
ON public.source_content_ingested
FOR INSERT
TO authenticated
WITH CHECK (true); -- No restrictions
```

### Issue 3: Multiple Conflicting Policies
**Symptom:** Multiple INSERT policies exist, and one might be blocking.

**Solution:** Check all INSERT policies and ensure at least one allows `suitability_analysis`:

```sql
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'source_content_ingested'
  AND cmd = 'INSERT';
```

## Recommended Policy Configuration

For `source_content_ingested` table, these policies should work:

### INSERT Policy
```sql
CREATE POLICY "Authenticated users can insert source content ingested"
ON public.source_content_ingested
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allows all columns including suitability_analysis
```

### UPDATE Policy
```sql
CREATE POLICY "Authenticated users can update source content ingested"
ON public.source_content_ingested
FOR UPDATE
TO authenticated
USING (true) -- Can update any row
WITH CHECK (true); -- Can update any column including suitability_analysis
```

## Testing

After updating policies, test with:

```sql
-- Test INSERT
INSERT INTO public.source_content_ingested (
  content_text,
  theme,
  tags,
  summary,
  ingestion_status,
  suitability_analysis
) VALUES (
  'Test content',
  'Players',
  ARRAY['test'],
  'Test summary',
  'complete',
  '{"multiple_choice_trivia": {"suitable": true, "confidence": 0.8, "reasoning": "test"}}'::jsonb
)
RETURNING id, suitability_analysis;

-- Clean up
DELETE FROM public.source_content_ingested WHERE content_text = 'Test content';
```

## Next Steps

1. ✅ Run the verification script
2. ✅ Check policy WITH CHECK expressions
3. ✅ Update policies if needed to allow `suitability_analysis`
4. ✅ Test insert/update with `suitability_analysis`
5. ✅ Verify in application that data is saving

