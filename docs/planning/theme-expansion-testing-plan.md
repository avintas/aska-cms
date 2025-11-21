# Theme Expansion Testing Plan

## Overview

This document provides a comprehensive testing plan to verify the theme expansion from 5 to 13 themes works correctly across all layers of the system.

## Testing Checklist

- [ ] Database Constraints
- [ ] TypeScript Validators
- [ ] API Routes
- [ ] ContentBrowser UI
- [ ] Ingestion Pipeline
- [ ] AI Classification

---

## Phase 1: Database Level Testing

### Test 1.1: Verify Theme Constraint

**SQL Query:**

```sql
-- Test valid themes (should all succeed)
INSERT INTO source_content_ingested (content_text, theme, ingestion_status)
VALUES
  ('Test content', 'Players', 'complete'),
  ('Test content', 'Business & Finance', 'complete'),
  ('Test content', 'Tactics & Advanced Analytics', 'complete'),
  ('Test content', 'Fandom & Fan Culture', 'complete')
RETURNING id, theme;

-- Test invalid theme (should fail)
INSERT INTO source_content_ingested (content_text, theme, ingestion_status)
VALUES ('Test content', 'Invalid Theme', 'complete');
-- Expected: ERROR: new row for relation "source_content_ingested" violates check constraint "theme_check"
```

**Expected Result:** First 4 inserts succeed, last one fails with constraint violation.

### Test 1.2: Verify Category Constraint

**SQL Query:**

```sql
-- Test valid categories for new themes
INSERT INTO source_content_ingested (content_text, theme, category, ingestion_status)
VALUES
  ('Test', 'Business & Finance', 'Contracts & Salaries', 'complete'),
  ('Test', 'Tactics & Advanced Analytics', 'Game Rules', 'complete'),
  ('Test', 'Training, Health, & Wellness', 'Youth Leagues', 'complete'),
  ('Test', 'Fandom & Fan Culture', 'Fan Traditions', 'complete')
RETURNING id, theme, category;

-- Test invalid category for theme (should fail)
INSERT INTO source_content_ingested (content_text, theme, category, ingestion_status)
VALUES ('Test', 'Players', 'Invalid Category', 'complete');
-- Expected: ERROR: violates check constraint "category_check"
```

**Expected Result:** First 4 inserts succeed, last one fails.

### Test 1.3: Verify All 13 Themes Are Accepted

**SQL Query:**

```sql
-- Test all 13 themes
DO $$
DECLARE
  theme_list TEXT[] := ARRAY[
    'Players',
    'Teams & Organizations',
    'Venues & Locations',
    'Awards & Honors',
    'Leadership & Staff',
    'Business & Finance',
    'Media, Broadcasting, & E-Sports',
    'Marketing, Sponsorship, & Merchandising',
    'Equipment & Technology',
    'Training, Health, & Wellness',
    'Fandom & Fan Culture',
    'Social Impact & Diversity',
    'Tactics & Advanced Analytics'
  ];
  theme_name TEXT;
  test_id BIGINT;
BEGIN
  FOREACH theme_name IN ARRAY theme_list
  LOOP
    INSERT INTO source_content_ingested (content_text, theme, ingestion_status)
    VALUES ('Test content for ' || theme_name, theme_name, 'complete')
    RETURNING id INTO test_id;

    RAISE NOTICE 'Theme "%" accepted (ID: %)', theme_name, test_id;
  END LOOP;

  -- Cleanup test data
  DELETE FROM source_content_ingested WHERE content_text LIKE 'Test content%';

  RAISE NOTICE 'All 13 themes validated successfully!';
END $$;
```

**Expected Result:** All 13 themes insert successfully, cleanup message appears.

---

## Phase 2: TypeScript Validator Testing

### Test 2.1: Test Validator Function

Create a test script: `test-validators.ts`

```typescript
import { validateExtractedMetadata } from './apps/cms/src/lib/sourcing/validators';

// Test all 13 themes
const themes = [
  'Players',
  'Teams & Organizations',
  'Venues & Locations',
  'Awards & Honors',
  'Leadership & Staff',
  'Business & Finance',
  'Media, Broadcasting, & E-Sports',
  'Marketing, Sponsorship, & Merchandising',
  'Equipment & Technology',
  'Training, Health, & Wellness',
  'Fandom & Fan Culture',
  'Social Impact & Diversity',
  'Tactics & Advanced Analytics',
];

console.log('Testing theme validation...\n');

themes.forEach((theme) => {
  const result = validateExtractedMetadata({
    theme,
    tags: ['test', 'tag'],
    category: null,
    summary: 'Test summary for validation',
  });

  if (result.valid) {
    console.log(`✅ ${theme} - VALID`);
  } else {
    console.error(`❌ ${theme} - INVALID:`, result.errors);
  }
});

// Test invalid theme
const invalidResult = validateExtractedMetadata({
  theme: 'Invalid Theme',
  tags: ['test'],
  summary: 'Test',
});

if (!invalidResult.valid) {
  console.log('\n✅ Invalid theme correctly rejected');
} else {
  console.error('\n❌ Invalid theme was accepted (should be rejected)');
}
```

**Run:** `npx tsx test-validators.ts` (or similar)

**Expected Result:** All 13 themes validate successfully, invalid theme is rejected.

### Test 2.2: Test Category Validation

```typescript
// Test categories for new themes
const categoryTests = [
  { theme: 'Business & Finance', category: 'Contracts & Salaries', shouldPass: true },
  { theme: 'Tactics & Advanced Analytics', category: 'Game Rules', shouldPass: true },
  { theme: 'Training, Health, & Wellness', category: 'Youth Leagues', shouldPass: true },
  { theme: 'Players', category: 'Invalid Category', shouldPass: false },
];

categoryTests.forEach(({ theme, category, shouldPass }) => {
  const result = validateExtractedMetadata({
    theme,
    tags: ['test'],
    category,
    summary: 'Test summary',
  });

  const passed = result.valid === shouldPass;
  console.log(
    `${passed ? '✅' : '❌'} ${theme} + ${category}: ${result.valid ? 'VALID' : 'INVALID'}`,
  );
});
```

---

## Phase 3: API Route Testing

### Test 3.1: Test Theme Stats Endpoint

**API Call:**

```bash
# Using curl or browser
GET /api/content-browser?stats=themes
```

**Expected Response:**

```json
{
  "success": true,
  "stats": [
    { "theme": "Players", "totalSources": X, "publishedSources": Y, "latestIngestedAt": "..." },
    { "theme": "Teams & Organizations", ... },
    // ... all 13 themes should appear
    { "theme": "Tactics & Advanced Analytics", ... }
  ]
}
```

**Verify:**

- All 13 themes appear in response
- Themes are in the correct order (as defined in THEME_ORDER)
- No duplicate themes
- Stats are accurate

### Test 3.2: Test Content Filtering by Theme

**API Calls:**

```bash
# Test filtering by each new theme
GET /api/content-browser?themes=Business%20%26%20Finance&limit=5
GET /api/content-browser?themes=Tactics%20%26%20Advanced%20Analytics&limit=5
GET /api/content-browser?themes=Fandom%20%26%20Fan%20Culture&limit=5

# Test multiple themes
GET /api/content-browser?themes=Players,Business%20%26%20Finance&limit=5
```

**Expected:** Each query returns content filtered by the specified theme(s).

### Test 3.3: Test Theme Normalization

**API Call:**

```bash
# Test that theme normalization works
GET /api/content-browser?themes=Players&limit=1
```

**Verify:** Response includes normalized theme values (not raw database values).

---

## Phase 4: UI Testing (ContentBrowser)

### Test 4.1: Verify Theme Display

**Steps:**

1. Navigate to `/content-browser` in CMS
2. Check the Themes section

**Expected:**

- All 13 theme buttons are displayed
- Themes are grouped logically (as per THEME_ORDER)
- Each theme shows count (e.g., "Players · 171")
- Theme buttons are clickable

**Screenshot:** Take a screenshot to verify layout

### Test 4.2: Test Theme Filtering

**Steps:**

1. Click on "Business & Finance" theme button
2. Verify content filters correctly
3. Click on "Tactics & Advanced Analytics" theme button
4. Verify content filters correctly
5. Click multiple themes
6. Verify multiple theme filtering works

**Expected:**

- Content updates when theme is selected
- Selected theme button is highlighted (green border)
- Results count updates
- Multiple themes can be selected simultaneously

### Test 4.3: Test Clear Filters

**Steps:**

1. Select multiple themes
2. Click "Clear filters" button
3. Verify all filters are cleared

**Expected:**

- All theme selections cleared
- Content returns to unfiltered state
- Clear filters button becomes disabled

---

## Phase 5: Ingestion Pipeline Testing

### Test 5.1: Manual Ingestion Test

**Steps:**

1. Navigate to sourcing/ingestion page
2. Paste sample content for each new theme category:

**Sample Content Examples:**

**Business & Finance:**

```
The NHL salary cap for the 2024-25 season is set at $88 million per team.
Player contracts are negotiated under the Collective Bargaining Agreement (CBA)
between the NHL and NHLPA. Revenue sharing helps smaller market teams compete.
```

**Tactics & Advanced Analytics:**

```
The offside rule prevents players from entering the offensive zone before the puck.
Teams use advanced metrics like Corsi and Fenwick to analyze shot attempts.
Power play strategies focus on creating high-danger scoring chances.
```

**Training, Health, & Wellness:**

```
Professional hockey players follow rigorous off-season training programs.
Nutrition plans are tailored to support performance and recovery.
Youth development programs focus on skill development and character building.
```

**Fandom & Fan Culture:**

```
Hockey fans have unique traditions like throwing octopuses in Detroit.
Watch parties bring communities together during playoff runs.
Rivalry games create intense atmospheres in arenas.
```

**Social Impact & Diversity:**

```
The NHL's Hockey is for Everyone initiative promotes diversity and inclusion.
Teams participate in charitable foundations supporting local communities.
Environmental initiatives focus on reducing the carbon footprint of arenas.
```

**Expected:**

- Content ingests successfully
- AI correctly classifies theme
- Appropriate category is assigned
- Content appears in ContentBrowser with correct theme

### Test 5.2: Verify AI Classification Accuracy

**Steps:**

1. Ingest 3-5 pieces of content for each new theme
2. Review AI classification results
3. Check if themes are correctly assigned

**Expected:**

- At least 80% accuracy in theme classification
- Categories are appropriately assigned
- If accuracy is low, AI prompt may need refinement

---

## Phase 6: Edge Cases & Error Handling

### Test 6.1: Invalid Theme Handling

**Test:** Try to insert content with invalid theme via API

**Expected:** Validation error returned, content not saved

### Test 6.2: Invalid Category Handling

**Test:** Try to insert content with invalid category for theme

**Expected:** Validation error returned, content not saved

### Test 6.3: Empty Theme Handling

**Test:** Try to insert content without theme

**Expected:** Database constraint violation (theme is NOT NULL)

### Test 6.4: Case Sensitivity

**Test:** Try themes with different casing (e.g., "PLAYERS", "players")

**Expected:** Only exact matches work (case-sensitive)

---

## Phase 7: Performance Testing

### Test 7.1: ContentBrowser Load Time

**Steps:**

1. Open ContentBrowser with many sources
2. Measure load time
3. Test with all 13 themes selected

**Expected:** Load time remains reasonable (< 2 seconds)

### Test 7.2: Theme Stats Query Performance

**SQL:**

```sql
EXPLAIN ANALYZE
SELECT theme, COUNT(*) as total
FROM source_content_ingested
GROUP BY theme;
```

**Expected:** Query uses index efficiently

---

## Quick Verification Script

Create a simple Node.js script to run quick checks:

```typescript
// scripts/verify-themes.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verifyThemes() {
  // Test 1: Try inserting each theme
  const themes = [
    'Players',
    'Teams & Organizations',
    'Venues & Locations',
    'Awards & Honors',
    'Leadership & Staff',
    'Business & Finance',
    'Media, Broadcasting, & E-Sports',
    'Marketing, Sponsorship, & Merchandising',
    'Equipment & Technology',
    'Training, Health, & Wellness',
    'Fandom & Fan Culture',
    'Social Impact & Diversity',
    'Tactics & Advanced Analytics',
  ];

  console.log('Testing theme constraints...\n');

  for (const theme of themes) {
    const { error } = await supabase.from('source_content_ingested').insert({
      content_text: `Test for ${theme}`,
      theme,
      ingestion_status: 'complete',
    });

    if (error) {
      console.error(`❌ ${theme}: ${error.message}`);
    } else {
      console.log(`✅ ${theme}: OK`);
    }
  }

  // Cleanup
  await supabase.from('source_content_ingested').delete().like('content_text', 'Test for %');

  console.log('\n✅ Theme verification complete!');
}

verifyThemes();
```

---

## Success Criteria

✅ **All tests pass** when:

- All 13 themes are accepted by database
- All categories validate correctly
- API returns all themes in stats
- ContentBrowser displays all themes
- Ingestion pipeline accepts new themes
- AI classification works (80%+ accuracy)

---

## Troubleshooting

### Issue: Theme not appearing in ContentBrowser

**Check:** API route THEME_ORDER array includes the theme

### Issue: Validation fails for valid theme

**Check:** Validators.ts THEMES array includes the theme

### Issue: Database constraint violation

**Check:** Migration script ran successfully, constraint exists

### Issue: AI misclassifies themes

**Solution:** Update AI prompt with better examples for new themes

---

## Next Steps After Testing

1. **If all tests pass:** System is ready for production use
2. **If AI classification is poor:** Refine AI prompts with more examples
3. **If performance issues:** Check indexes, optimize queries
4. **If UI issues:** Adjust theme display order or grouping

---

**Status:** Ready for Testing
**Created:** 2025-01-15
