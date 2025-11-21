-- Migration: Create pub_shareables_facts table
-- Date: 2025-01-20
-- Description: Creates table to store published facts shareable collections
--              This table stores published/shareable content items

BEGIN;

-- ========================================================================
-- TABLE CREATION
-- ========================================================================

-- Create pub_shareables_facts table
CREATE TABLE IF NOT EXISTS public.pub_shareables_facts (
  -- Primary key: Auto-incrementing unique identifier (8 bytes)
  id BIGSERIAL NOT NULL PRIMARY KEY,
  
  -- Pre-processed collection: Complete JSONB array of facts items ready to display
  -- Contains full content (fact, context, theme, etc.)
  items JSONB NOT NULL,
  
  -- Status field: Published, Draft, Archived, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  
  -- Timestamps for tracking when entry was created/updated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================================================
-- INDEXES
-- ========================================================================

-- Index for JSONB queries (if we need to search within items later)
CREATE INDEX IF NOT EXISTS idx_pub_shareables_facts_items 
  ON public.pub_shareables_facts USING GIN(items);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_pub_shareables_facts_status 
  ON public.pub_shareables_facts(status);

-- Index for created_at queries (for sorting by date)
CREATE INDEX IF NOT EXISTS idx_pub_shareables_facts_created_at 
  ON public.pub_shareables_facts(created_at);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================================

-- Enable RLS on pub_shareables_facts table
ALTER TABLE public.pub_shareables_facts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select pub shareables facts" ON public.pub_shareables_facts;
DROP POLICY IF EXISTS "Authenticated users can insert pub shareables facts" ON public.pub_shareables_facts;
DROP POLICY IF EXISTS "Authenticated users can update pub shareables facts" ON public.pub_shareables_facts;
DROP POLICY IF EXISTS "Authenticated users can delete pub shareables facts" ON public.pub_shareables_facts;

-- Policy: Allow authenticated users to SELECT all published shareables
CREATE POLICY "Authenticated users can select pub shareables facts"
ON public.pub_shareables_facts
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT published shareables
CREATE POLICY "Authenticated users can insert pub shareables facts"
ON public.pub_shareables_facts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE published shareables
CREATE POLICY "Authenticated users can update pub shareables facts"
ON public.pub_shareables_facts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE published shareables
CREATE POLICY "Authenticated users can delete pub shareables facts"
ON public.pub_shareables_facts
FOR DELETE
TO authenticated
USING (true);

-- ========================================================================
-- COMMENTS
-- ========================================================================

COMMENT ON TABLE public.pub_shareables_facts IS 
  'Published facts shareable collections. Stores complete sets of facts items ready for publication.';

COMMENT ON COLUMN public.pub_shareables_facts.id IS 
  'Primary key - auto-incrementing unique identifier for each entry (BIGSERIAL, 8 bytes).';

COMMENT ON COLUMN public.pub_shareables_facts.items IS 
  'Complete JSONB array of facts items. Contains full content ready to display - fact, context, theme, etc.';

COMMENT ON COLUMN public.pub_shareables_facts.status IS 
  'Status of the shareable collection: draft, published, archived, etc. Default: draft.';

COMMENT ON COLUMN public.pub_shareables_facts.created_at IS 
  'When this entry was first created.';

COMMENT ON COLUMN public.pub_shareables_facts.updated_at IS 
  'When this entry was last updated.';

COMMIT;

