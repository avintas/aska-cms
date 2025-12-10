-- Verification Script: Check RLS Policies for suitability_analysis Column
-- This script verifies that RLS policies allow INSERT and UPDATE of suitability_analysis column
-- Date: 2025-12-09

-- ========================================================================
-- STEP 1: Check if RLS is enabled on the table
-- ========================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'source_content_ingested';

-- Expected: rls_enabled should be true

-- ========================================================================
-- STEP 2: List all RLS policies for source_content_ingested
-- ========================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command, -- SELECT, INSERT, UPDATE, DELETE, or ALL
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'source_content_ingested'
ORDER BY cmd, policyname;

-- ========================================================================
-- STEP 3: Check for column-level restrictions in INSERT policies
-- ========================================================================

-- This query shows if any INSERT policies have column restrictions
SELECT 
  p.policyname,
  p.cmd,
  p.qual,
  p.with_check,
  CASE 
    WHEN p.with_check LIKE '%suitability_analysis%' THEN '✅ Explicitly mentions suitability_analysis'
    WHEN p.with_check = 'true' OR p.with_check IS NULL THEN '✅ No column restrictions (allows all columns including suitability_analysis)'
    WHEN p.with_check LIKE '%column%' OR p.with_check LIKE '%%' THEN '⚠️ May have column restrictions (check expression)'
    ELSE '⚠️ Has WITH CHECK expression (review manually)'
  END as column_restrictions,
  CASE 
    WHEN p.with_check = 'true' OR p.with_check IS NULL THEN '✅ ALLOWED'
    WHEN p.with_check LIKE '%suitability_analysis%' THEN '✅ ALLOWED'
    ELSE '❓ CHECK MANUALLY'
  END as suitability_analysis_status
FROM pg_policies p
WHERE p.schemaname = 'public' 
  AND p.tablename = 'source_content_ingested'
  AND p.cmd IN ('INSERT', 'ALL');

-- ========================================================================
-- STEP 4: Check for column-level restrictions in UPDATE policies
-- ========================================================================

-- This query shows if any UPDATE policies have column restrictions
SELECT 
  p.policyname,
  p.cmd,
  p.qual,
  p.with_check,
  CASE 
    WHEN p.with_check LIKE '%suitability_analysis%' THEN '✅ Explicitly mentions suitability_analysis'
    WHEN p.with_check = 'true' OR p.with_check IS NULL THEN '✅ No column restrictions (allows all columns including suitability_analysis)'
    WHEN p.with_check LIKE '%column%' OR p.with_check LIKE '%%' THEN '⚠️ May have column restrictions (check expression)'
    ELSE '⚠️ Has WITH CHECK expression (review manually)'
  END as column_restrictions,
  CASE 
    WHEN p.with_check = 'true' OR p.with_check IS NULL THEN '✅ ALLOWED'
    WHEN p.with_check LIKE '%suitability_analysis%' THEN '✅ ALLOWED'
    ELSE '❓ CHECK MANUALLY'
  END as suitability_analysis_status
FROM pg_policies p
WHERE p.schemaname = 'public' 
  AND p.tablename = 'source_content_ingested'
  AND p.cmd IN ('UPDATE', 'ALL');

-- ========================================================================
-- STEP 5: Test INSERT with suitability_analysis (as authenticated user)
-- ========================================================================

-- This test should be run as an authenticated user
-- Uncomment and run to test if suitability_analysis can be inserted

/*
BEGIN;

-- Test insert with suitability_analysis
INSERT INTO public.source_content_ingested (
  content_text,
  theme,
  tags,
  summary,
  ingestion_status,
  suitability_analysis
) VALUES (
  'TEST: Verify suitability_analysis insert',
  'Players',
  ARRAY['test'],
  'Test summary',
  'complete',
  '{
    "multiple_choice_trivia": {
      "suitable": true,
      "confidence": 0.8,
      "reasoning": "Test reasoning"
    }
  }'::jsonb
)
RETURNING id, suitability_analysis;

-- Clean up test record
DELETE FROM public.source_content_ingested 
WHERE content_text = 'TEST: Verify suitability_analysis insert';

COMMIT;
*/

-- ========================================================================
-- STEP 6: Test UPDATE with suitability_analysis (as authenticated user)
-- ========================================================================

-- This test should be run as an authenticated user
-- Uncomment and run to test if suitability_analysis can be updated

/*
BEGIN;

-- First, create a test record
INSERT INTO public.source_content_ingested (
  content_text,
  theme,
  tags,
  summary,
  ingestion_status
) VALUES (
  'TEST: Verify suitability_analysis update',
  'Players',
  ARRAY['test'],
  'Test summary',
  'complete'
)
RETURNING id;

-- Then try to update with suitability_analysis
UPDATE public.source_content_ingested
SET suitability_analysis = '{
  "multiple_choice_trivia": {
    "suitable": true,
    "confidence": 0.8,
    "reasoning": "Test reasoning"
  }
}'::jsonb
WHERE content_text = 'TEST: Verify suitability_analysis update'
RETURNING id, suitability_analysis;

-- Clean up test record
DELETE FROM public.source_content_ingested 
WHERE content_text = 'TEST: Verify suitability_analysis update';

COMMIT;
*/

-- ========================================================================
-- INTERPRETATION GUIDE
-- ========================================================================

-- ✅ GOOD: with_check = 'true' or NULL
--   → No column restrictions, ALL columns including suitability_analysis can be inserted/updated
--
-- ✅ GOOD: with_check mentions 'suitability_analysis'
--   → Explicitly allows suitability_analysis column
--
-- ⚠️ CHECK: with_check has complex expression
--   → Review the expression to ensure suitability_analysis is not excluded
--   → Look for patterns like: "column_name IN (...)" or "column_name IS NOT NULL"
--   → If suitability_analysis is not in the allowed list, it will be blocked
--
-- ❌ PROBLEM: with_check excludes suitability_analysis
--   → Need to update policy to include suitability_analysis column
--
-- Based on your query result showing with_check = 'true':
-- ✅ This policy ALLOWS all columns including suitability_analysis!

-- ========================================================================
-- RECOMMENDED POLICY FOR INSERT (if column restrictions exist)
-- ========================================================================

-- If you need to create a policy that explicitly allows suitability_analysis:
/*
CREATE POLICY "Allow insert with suitability_analysis"
ON public.source_content_ingested
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allows all columns including suitability_analysis
*/

-- ========================================================================
-- RECOMMENDED POLICY FOR UPDATE (if column restrictions exist)
-- ========================================================================

-- If you need to create a policy that explicitly allows updating suitability_analysis:
/*
CREATE POLICY "Allow update of suitability_analysis"
ON public.source_content_ingested
FOR UPDATE
TO authenticated
USING (true) -- Can update any row
WITH CHECK (true); -- Can update any column including suitability_analysis
*/

