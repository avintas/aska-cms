-- Migration: Copy collection_stats table to collection_facts table
-- Date: 2025-11-19
-- Description: 
--   Creates collection_facts table with the same structure as collection_stats
--   Copies all data from collection_stats to collection_facts
--   Copies indexes, constraints, and sequences
--   Preserves all table definitions and relationships

BEGIN;

-- ========================================================================
-- STEP 1: Create collection_facts table with same structure as collection_stats
-- ========================================================================

-- Check if collection_stats table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'collection_stats'
  ) THEN
    RAISE EXCEPTION 'Source table collection_stats does not exist';
  END IF;
END $$;

-- Drop collection_facts table if it already exists (to allow re-running migration)
DROP TABLE IF EXISTS public.collection_facts CASCADE;

-- Create collection_facts table with same structure as collection_stats
-- INCLUDING ALL copies: columns, data types, NOT NULL constraints, defaults, 
--                       indexes, constraints, storage parameters, and comments
CREATE TABLE public.collection_facts (LIKE public.collection_stats INCLUDING ALL);

-- ========================================================================
-- STEP 2: Copy all data from collection_stats to collection_facts
-- ========================================================================

INSERT INTO public.collection_facts
SELECT * FROM public.collection_stats;

-- ========================================================================
-- STEP 3: Rename constraints and indexes (optional - for cleaner naming)
-- ========================================================================

-- Note: INCLUDING ALL already copied indexes and constraints, but they may
-- have the same names. We can optionally rename them for clarity.
-- This step is optional - uncomment if you want to rename constraints/indexes

-- Rename primary key constraint if it exists and has a different name
DO $$
DECLARE
  pk_name TEXT;
BEGIN
  SELECT conname INTO pk_name
  FROM pg_constraint
  WHERE conrelid = 'public.collection_facts'::regclass
    AND contype = 'p';
  
  IF pk_name IS NOT NULL AND pk_name != 'collection_facts_pkey' THEN
    EXECUTE format('ALTER TABLE public.collection_facts RENAME CONSTRAINT %I TO collection_facts_pkey', pk_name);
  END IF;
END $$;

-- ========================================================================
-- STEP 4: Handle sequences (if using SERIAL/BIGSERIAL)
-- ========================================================================

-- Update sequence ownership for any SERIAL columns
DO $$
DECLARE
  seq_record RECORD;
BEGIN
  FOR seq_record IN
    SELECT 
      column_name,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'collection_stats'
      AND column_default LIKE 'nextval%'
  LOOP
    -- Extract sequence name from default value
    -- Format: nextval('sequence_name'::regclass)
    DECLARE
      seq_name TEXT;
      new_seq_name TEXT;
    BEGIN
      seq_name := (regexp_match(seq_record.column_default, '''([^'']+)'''))[1];
      new_seq_name := REPLACE(seq_name, 'collection_stats', 'collection_facts');
      
      -- Update sequence owner if sequence exists
      IF EXISTS (SELECT FROM pg_sequences WHERE schemaname = 'public' AND sequencename = seq_name) THEN
        -- Create new sequence for collection_facts table if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_sequences WHERE schemaname = 'public' AND sequencename = new_seq_name) THEN
          EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I OWNED BY public.collection_facts.%I', new_seq_name, seq_record.column_name);
          -- Set sequence value to match current max value from collection_facts table
          EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM public.collection_facts), 1), true)', new_seq_name, seq_record.column_name);
        END IF;
        -- Update column default to use new sequence
        EXECUTE format('ALTER TABLE public.collection_facts ALTER COLUMN %I SET DEFAULT nextval(%L)', seq_record.column_name, new_seq_name);
      END IF;
    END;
  END LOOP;
END $$;

-- ========================================================================
-- STEP 5: Copy RLS policies (if RLS is enabled)
-- ========================================================================
-- Note: INCLUDING ALL does NOT copy RLS policies, so we need to do this manually

-- Check if RLS is enabled on collection_stats
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_class 
    WHERE relname = 'collection_stats' 
    AND relrowsecurity = true
  ) THEN
    -- Enable RLS on collection_facts table
    ALTER TABLE public.collection_facts ENABLE ROW LEVEL SECURITY;
    
    -- Copy RLS policies
    DECLARE
      policy_record RECORD;
      policy_sql TEXT;
      new_policy_name TEXT;
    BEGIN
      FOR policy_record IN
        SELECT 
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'collection_stats'
      LOOP
        -- Generate new policy name (replace 'collection_stats' with 'collection_facts')
        new_policy_name := REPLACE(policy_record.policyname, 'collection_stats', 'collection_facts');
        
        -- Build policy SQL
        policy_sql := format(
          'CREATE POLICY %I ON public.collection_facts AS %s FOR %s',
          new_policy_name,
          policy_record.permissive,
          policy_record.cmd
        );
        
        -- Add roles
        IF array_length(policy_record.roles, 1) > 0 THEN
          policy_sql := policy_sql || format(' TO %s', array_to_string(policy_record.roles, ', '));
        END IF;
        
        -- Add USING clause
        IF policy_record.qual IS NOT NULL THEN
          policy_sql := policy_sql || format(' USING (%s)', policy_record.qual);
        END IF;
        
        -- Add WITH CHECK clause
        IF policy_record.with_check IS NOT NULL THEN
          policy_sql := policy_sql || format(' WITH CHECK (%s)', policy_record.with_check);
        END IF;
        
        -- Execute policy creation
        EXECUTE policy_sql;
      END LOOP;
    END;
  END IF;
END $$;

-- ========================================================================
-- VERIFICATION
-- ========================================================================

-- Verify row count matches
DO $$
DECLARE
  source_count BIGINT;
  target_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO source_count FROM public.collection_stats;
  SELECT COUNT(*) INTO target_count FROM public.collection_facts;
  
  IF source_count != target_count THEN
    RAISE WARNING 'Row count mismatch: collection_stats has % rows, collection_facts has % rows', source_count, target_count;
  ELSE
    RAISE NOTICE 'Migration successful: Copied % rows from collection_stats to collection_facts', source_count;
  END IF;
END $$;

COMMIT;

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify table structure matches
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'collection_facts'
-- ORDER BY ordinal_position;

-- Verify row counts match
-- SELECT 
--   'collection_stats' as table_name, 
--   COUNT(*) as row_count 
-- FROM public.collection_stats
-- UNION ALL
-- SELECT 
--   'collection_facts' as table_name, 
--   COUNT(*) as row_count 
-- FROM public.collection_facts;

-- Verify indexes were copied
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'collection_facts'
-- ORDER BY indexname;

-- Verify constraints were copied
-- SELECT 
--   conname as constraint_name,
--   contype as constraint_type,
--   pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'public.collection_facts'::regclass
-- ORDER BY contype, conname;

