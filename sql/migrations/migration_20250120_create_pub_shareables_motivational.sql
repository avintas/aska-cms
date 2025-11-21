-- Migration: Create pub_shareables_motivational table
-- Date: 2025-01-20
-- Description: Creates table to store published motivational shareable collections
--              This table stores published/shareable content items

BEGIN;

-- ========================================================================
-- TABLE CREATION
-- ========================================================================

-- Create pub_shareables_motivational table
CREATE TABLE IF NOT EXISTS public.pub_shareables_motivational (
  -- Primary key: Auto-incrementing unique identifier (8 bytes)
  id BIGSERIAL NOT NULL PRIMARY KEY,
  
  -- Pre-processed collection: Complete JSONB array of motivational items ready to display
  -- Contains full content (quote, author, context, theme, etc.)
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
CREATE INDEX IF NOT EXISTS idx_pub_shareables_motivational_items 
  ON public.pub_shareables_motivational USING GIN(items);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_pub_shareables_motivational_status 
  ON public.pub_shareables_motivational(status);

-- Index for created_at queries (for sorting by date)
CREATE INDEX IF NOT EXISTS idx_pub_shareables_motivational_created_at 
  ON public.pub_shareables_motivational(created_at);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================================

-- Enable RLS on pub_shareables_motivational table
ALTER TABLE public.pub_shareables_motivational ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can select pub shareables motivational" ON public.pub_shareables_motivational;
DROP POLICY IF EXISTS "Authenticated users can insert pub shareables motivational" ON public.pub_shareables_motivational;
DROP POLICY IF EXISTS "Authenticated users can update pub shareables motivational" ON public.pub_shareables_motivational;
DROP POLICY IF EXISTS "Authenticated users can delete pub shareables motivational" ON public.pub_shareables_motivational;

-- Policy: Allow authenticated users to SELECT all published shareables
CREATE POLICY "Authenticated users can select pub shareables motivational"
ON public.pub_shareables_motivational
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT published shareables
CREATE POLICY "Authenticated users can insert pub shareables motivational"
ON public.pub_shareables_motivational
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE published shareables
CREATE POLICY "Authenticated users can update pub shareables motivational"
ON public.pub_shareables_motivational
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE published shareables
CREATE POLICY "Authenticated users can delete pub shareables motivational"
ON public.pub_shareables_motivational
FOR DELETE
TO authenticated
USING (true);

-- ========================================================================
-- COMMENTS
-- ========================================================================

COMMENT ON TABLE public.pub_shareables_motivational IS 
  'Published motivational shareable collections. Stores complete sets of motivational items ready for publication.';

COMMENT ON COLUMN public.pub_shareables_motivational.id IS 
  'Primary key - auto-incrementing unique identifier for each entry (BIGSERIAL, 8 bytes).';

COMMENT ON COLUMN public.pub_shareables_motivational.items IS 
  'Complete JSONB array of motivational items. Contains full content ready to display - quote, author, context, theme, etc.';

COMMENT ON COLUMN public.pub_shareables_motivational.status IS 
  'Status of the shareable collection: draft, published, archived, etc. Default: draft.';

COMMENT ON COLUMN public.pub_shareables_motivational.created_at IS 
  'When this entry was first created.';

COMMENT ON COLUMN public.pub_shareables_motivational.updated_at IS 
  'When this entry was last updated.';

COMMIT;

