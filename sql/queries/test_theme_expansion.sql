-- Quick Theme Expansion Verification Script
-- Run this after migration to verify all 13 themes work correctly

-- ========================================================================
-- Test 1: Verify all 13 themes can be inserted
-- ========================================================================

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
  success_count INT := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Theme Expansion (13 themes)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  FOREACH theme_name IN ARRAY theme_list
  LOOP
    BEGIN
      INSERT INTO source_content_ingested (content_text, theme, ingestion_status)
      VALUES ('TEST: ' || theme_name, theme_name, 'complete')
      RETURNING id INTO test_id;
      
      RAISE NOTICE '✅ Theme "%" - ACCEPTED (ID: %)', theme_name, test_id;
      success_count := success_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Theme "%" - FAILED: %', theme_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Results: %/13 themes accepted', success_count;
  RAISE NOTICE '========================================';
  
  -- Cleanup test data
  DELETE FROM source_content_ingested WHERE content_text LIKE 'TEST: %';
  RAISE NOTICE 'Test data cleaned up.';
END $$;

-- ========================================================================
-- Test 2: Verify categories for new themes
-- ========================================================================

DO $$
DECLARE
  category_tests RECORD;
  test_id BIGINT;
  success_count INT := 0;
  total_tests INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Categories for New Themes';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  FOR category_tests IN
    SELECT 'Business & Finance' as theme, 'Contracts & Salaries' as category
    UNION ALL SELECT 'Tactics & Advanced Analytics', 'Game Rules'
    UNION ALL SELECT 'Training, Health, & Wellness', 'Youth Leagues'
    UNION ALL SELECT 'Fandom & Fan Culture', 'Fan Traditions'
    UNION ALL SELECT 'Social Impact & Diversity', 'Diversity & Inclusion'
    UNION ALL SELECT 'Equipment & Technology', 'Safety Technology'
    UNION ALL SELECT 'Media, Broadcasting, & E-Sports', 'Video Games'
    UNION ALL SELECT 'Marketing, Sponsorship, & Merchandising', 'Sponsorships'
  LOOP
    total_tests := total_tests + 1;
    BEGIN
      INSERT INTO source_content_ingested (
        content_text, 
        theme, 
        category, 
        ingestion_status
      )
      VALUES (
        'TEST CATEGORY: ' || category_tests.theme || ' - ' || category_tests.category,
        category_tests.theme,
        category_tests.category,
        'complete'
      )
      RETURNING id INTO test_id;
      
      RAISE NOTICE '✅ % + % - ACCEPTED', category_tests.theme, category_tests.category;
      success_count := success_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ % + % - FAILED: %', category_tests.theme, category_tests.category, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Results: %/% category tests passed', success_count, total_tests;
  RAISE NOTICE '========================================';
  
  -- Cleanup
  DELETE FROM source_content_ingested WHERE content_text LIKE 'TEST CATEGORY: %';
END $$;

-- ========================================================================
-- Test 3: Verify invalid theme is rejected
-- ========================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Invalid Theme Rejection';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  BEGIN
    INSERT INTO source_content_ingested (content_text, theme, ingestion_status)
    VALUES ('TEST INVALID', 'Invalid Theme Name', 'complete');
    
    RAISE NOTICE '❌ Invalid theme was accepted (should be rejected!)';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ Invalid theme correctly rejected';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Unexpected error: %', SQLERRM;
  END;
END $$;

-- ========================================================================
-- Test 4: Check current theme distribution
-- ========================================================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'Current Theme Distribution';
RAISE NOTICE '========================================';
RAISE NOTICE '';

SELECT 
  theme,
  COUNT(*) as total_sources,
  COUNT(*) FILTER (WHERE ingestion_status = 'complete') as published_sources
FROM source_content_ingested
GROUP BY theme
ORDER BY 
  CASE theme
    WHEN 'Players' THEN 1
    WHEN 'Teams & Organizations' THEN 2
    WHEN 'Venues & Locations' THEN 3
    WHEN 'Awards & Honors' THEN 4
    WHEN 'Leadership & Staff' THEN 5
    WHEN 'Business & Finance' THEN 6
    WHEN 'Media, Broadcasting, & E-Sports' THEN 7
    WHEN 'Marketing, Sponsorship, & Merchandising' THEN 8
    WHEN 'Equipment & Technology' THEN 9
    WHEN 'Training, Health, & Wellness' THEN 10
    WHEN 'Fandom & Fan Culture' THEN 11
    WHEN 'Social Impact & Diversity' THEN 12
    WHEN 'Tactics & Advanced Analytics' THEN 13
    ELSE 99
  END;

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'Verification Complete!';
RAISE NOTICE '========================================';

