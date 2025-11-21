# Content Library API Route + Client-Side State Pattern

## Overview

This document describes the proven pattern for implementing content library pages (Greetings, Wisdom, Stats, Motivational, Trivia) in the CMS application. This pattern uses **Next.js API Routes** with **client-side state management** for reliable, immediate UI updates.

## Why This Pattern?

### Problem with Server Actions

We initially tried using Next.js Server Actions for content library operations (publish, unpublish, delete), but encountered persistent issues:

- **UI Refresh Issues**: Actions would complete, but the UI wouldn't update immediately
- **Unreliable Redirects**: Using `redirect()` and `revalidatePath()` didn't consistently refresh the UI
- **Complex State Management**: Mixing server and client state became unwieldy
- **User Experience**: Actions felt slow and unresponsive

### Solution: API Routes + Client-Side State

By switching to:

- **API Routes** (`/api/*`) for all data operations
- **Client-side state management** with React hooks (`useState`, `useEffect`, `useCallback`)
- **Optimistic UI updates** for immediate feedback

We achieved:

- ✅ Immediate UI updates
- ✅ Reliable state synchronization
- ✅ Better error handling
- ✅ Consistent user experience
- ✅ Easier debugging

## Pattern Structure

### 1. API Routes (`apps/cms/src/app/api/{resource}/route.ts`)

**GET Handler** - Fetch content with filters and stats:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session
    const { supabase, userId } = await createApiClient();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statsOnly = searchParams.get('stats') === 'true';

    // Stats endpoint: return counts by status
    if (statsOnly) {
      const { data: allItems } = await supabase.from('table_name').select('status');
      // ... count by status
      return NextResponse.json({ success: true, stats });
    }

    // Regular fetch with filters and pagination
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('table_name')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filters
    if (status === 'unpublished') {
      query = query.or('status.is.null,and(status.not.eq.published,status.not.eq.archived)');
    } else if (status === 'published') {
      query = query.eq('status', 'published');
    } else if (status === 'archived') {
      query = query.eq('status', 'archived');
    }

    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, count: count || 0 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### 2. Item API Routes (`apps/cms/src/app/api/{resource}/[id]/route.ts`)

**PATCH Handler** - Update status (publish/unpublish/archive):

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createApiClient();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const body = await request.json();

    if (!body.status || typeof body.status !== 'string') {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.status === 'archived' && !body.archived_at) {
      updateData.status = 'archived';
      updateData.archived_at = new Date().toISOString();
    } else if (body.status) {
      updateData.status = body.status;
      if (body.status === 'published' && !body.published_at) {
        updateData.published_at = new Date().toISOString();
      } else if (body.status === 'unpublished') {
        updateData.published_at = null;
        updateData.archived_at = null;
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('table_name')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

**DELETE Handler** - Delete item:

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createApiClient();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    const { error } = await supabase.from('table_name').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. Page Component (`apps/cms/src/app/{resource}/page.tsx`)

**Client Component** with state management:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ResourceType } from '@aska/shared';
import ResourceCard from '@/components/{resource}/ResourceCard';

type StatusFilter = 'unpublished' | 'published' | 'archived';

export default function ResourceListPage(): JSX.Element {
  const [items, setItems] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unpublished');
  const [stats, setStats] = useState({
    unpublished: 0,
    published: 0,
    archived: 0,
  });
  const limit = 5;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  // Fetch stats counts
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/{resource}?stats=true`);
      const result = await response.json();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Fetch content with filters and pagination
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const response = await fetch(
        `/api/{resource}?limit=${limit}&offset=${offset}&status=${statusFilter}`,
      );
      const result = await response.json();

      if (result.success) {
        setItems(result.data || []);
        setTotal(result.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter]);

  // Initial stats fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch content when page or filter changes
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Validate and adjust currentPage when total changes (e.g., after deletions)
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(total / limit);
    if (calculatedTotalPages > 0 && currentPage > calculatedTotalPages) {
      setCurrentPage(calculatedTotalPages);
    } else if (calculatedTotalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [total, limit, currentPage]);

  // Optimistic status change handler
  const handleStatusChange = (id: number, _newStatus: string): void => {
    const remainingItems = items.filter((item) => item.id !== id);
    setItems(remainingItems);
    setTotal((prev) => prev - 1);
    fetchStats();
  };

  // Optimistic delete handler
  const handleDelete = (id: number): void => {
    const remainingItems = items.filter((item) => item.id !== id);
    setItems(remainingItems);
    setTotal((prev) => prev - 1);
    fetchStats();
  };

  // Pagination navigation
  const goToPage = (page: number): void => {
    const calculatedTotalPages = total > 0 ? Math.ceil(total / limit) : 0;
    if (page >= 1 && page <= calculatedTotalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950 sm:p-8">
      {/* Header, Filters, Content, Pagination */}
    </div>
  );
}
```

### 4. Card Component (`apps/cms/src/components/{resource}/ResourceCard.tsx`)

**Client Component** for individual items:

```typescript
'use client';

import type { ResourceType } from '@aska/shared';
import { StatusBadge } from '@/components/ui/CollectionList';

interface ResourceCardProps {
  resource: ResourceType;
  onStatusChange?: (id: number, newStatus: string) => void;
  onDelete?: (id: number) => void;
}

export default function ResourceCard({
  resource,
  onStatusChange,
  onDelete,
}: ResourceCardProps): JSX.Element {
  // Copy to clipboard handler
  const handleCopy = async (): Promise<void> => {
    try {
      // Format content for clipboard
      await navigator.clipboard.writeText(/* ... */);
    } catch (error) {
      alert('Failed to copy');
    }
  };

  // Status change handler (publish/unpublish/archive)
  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (!onStatusChange) return;

    try {
      const response = await fetch(`/api/{resource}/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to update status');
      }

      onStatusChange(resource.id, newStatus);
    } catch (error) {
      alert(`Failed to update status: ${error}`);
    }
  };

  // Delete handler
  const handleDelete = async (): Promise<void> => {
    if (!onDelete) return;

    try {
      const response = await fetch(`/api/{resource}/${resource.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      onDelete(resource.id);
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const status = resource.status || 'unpublished';
  const isPublished = status === 'published';
  const isArchived = status === 'archived';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Status badge, ID */}
      {/* Content */}
      {/* Metadata */}
      {/* Action buttons: Copy, Publish/Unpublish, Archive/Restore, Delete */}
    </div>
  );
}
```

### 5. RLS Migration Script (`sql/migrations/migration_YYYYMMDD_add_rls_policies_{resource}_auth.sql`)

```sql
-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can select {resource}" ON public.{table_name};
DROP POLICY IF EXISTS "Authenticated users can insert {resource}" ON public.{table_name};
DROP POLICY IF EXISTS "Authenticated users can update {resource}" ON public.{table_name};
DROP POLICY IF EXISTS "Authenticated users can delete {resource}" ON public.{table_name};

-- Create policies
CREATE POLICY "Authenticated users can select {resource}"
ON public.{table_name} FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert {resource}"
ON public.{table_name} FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update {resource}"
ON public.{table_name} FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete {resource}"
ON public.{table_name} FOR DELETE TO authenticated USING (true);
```

## Implementation Checklist

When implementing a new content library using this pattern:

### 1. API Routes

- [ ] Create `/api/{resource}/route.ts` with GET handler
- [ ] Create `/api/{resource}/[id]/route.ts` with PATCH and DELETE handlers
- [ ] Implement stats endpoint (`?stats=true`)
- [ ] Implement filtering by status (unpublished/published/archived)
- [ ] Implement pagination (limit/offset)
- [ ] Add proper error handling and logging
- [ ] Use `createApiClient()` for authentication

### 2. Page Component

- [ ] Convert to client component (`'use client'`)
- [ ] Add state: `items`, `loading`, `total`, `currentPage`, `statusFilter`, `stats`
- [ ] Implement `fetchStats()` callback
- [ ] Implement `fetchContent()` callback
- [ ] Add `useEffect` hooks for initial fetch, content fetch, filter reset, pagination validation
- [ ] Implement `handleStatusChange()` with optimistic updates
- [ ] Implement `handleDelete()` with optimistic updates
- [ ] Implement `goToPage()` for pagination
- [ ] Add UI: Header, Filter buttons, Loading state, Empty state, Card list, Pagination

### 3. Card Component

- [ ] Create card component as client component
- [ ] Display status badge and ID
- [ ] Display primary content (question_text, quote, stat_text, etc.)
- [ ] Display unique fields (correct_answer, wrong_answers, is_true, etc.)
- [ ] Display metadata (category, theme, difficulty, etc.)
- [ ] Display character/word counts
- [ ] Implement `handleCopy()` for clipboard
- [ ] Implement `handleStatusChange()` with API call
- [ ] Implement `handleDelete()` with API call
- [ ] Add action buttons: Copy, Publish/Unpublish, Archive/Restore, Delete

### 4. RLS Policies

- [ ] Create migration script
- [ ] Enable RLS on table
- [ ] Drop existing policies (if any)
- [ ] Create SELECT, INSERT, UPDATE, DELETE policies for authenticated users
- [ ] Test policies in Supabase

### 5. Testing

- [ ] Test stats display (total, published, unpublished, archived)
- [ ] Test filter buttons (switch between filters)
- [ ] Test pagination (navigation, edge cases)
- [ ] Test status changes (publish, unpublish, archive, restore)
- [ ] Test delete (with pagination edge cases)
- [ ] Test copy to clipboard
- [ ] Test error handling (network errors, API errors)
- [ ] Test RLS policies (authenticated user access)

## Pattern Conventions

### File Naming

- API routes: `/api/{resource}/route.ts` and `/api/{resource}/[id]/route.ts`
- Page: `apps/cms/src/app/{resource}/page.tsx`
- Card component: `apps/cms/src/components/{resource}/{Resource}Card.tsx`
- Migration: `sql/migrations/migration_YYYYMMDD_add_rls_policies_{resource}_auth.sql`

### API Response Format

```typescript
// Success
{ success: true, data: [...], count: 10 }
{ success: true, stats: { unpublished: 5, published: 3, archived: 2 } }

// Error
{ success: false, error: 'Error message', details?: string, code?: string }
```

### Status Values

- `'unpublished'` - Default state, content not published
- `'published'` - Content is published and visible
- `'archived'` - Content is archived (can be restored)

### Pagination

- Default limit: 5 items per page
- Use `limit` and `offset` query parameters
- Validate and adjust `currentPage` when `total` changes

### Optimistic Updates

- Remove item from list immediately on status change/delete
- Decrease `total` count
- Let `useEffect` handle pagination adjustments
- Refresh stats after action

## Examples

This pattern has been successfully implemented for:

1. **Greetings** (`collection_greetings`)
   - `/api/greetings/route.ts`
   - `/api/greetings/[id]/route.ts`
   - `apps/cms/src/app/greetings/page.tsx`
   - `apps/cms/src/components/greetings/GreetingCard.tsx`

2. **Wisdom** (`collection_wisdom`)
   - `/api/wisdom/route.ts`
   - `/api/wisdom/[id]/route.ts`
   - `apps/cms/src/app/wisdom/page.tsx`
   - `apps/cms/src/components/wisdom/WisdomCard.tsx`

3. **Stats** (`collection_stats`)
   - `/api/stats/route.ts`
   - `/api/stats/[id]/route.ts`
   - `apps/cms/src/app/stats/page.tsx`
   - `apps/cms/src/components/stats/StatCard.tsx`

4. **Motivational** (`collection_motivational`)
   - `/api/motivational/route.ts`
   - `/api/motivational/[id]/route.ts`
   - `apps/cms/src/app/motivational/page.tsx`
   - `apps/cms/src/components/motivational/MotivationalCard.tsx`

5. **Who Am I Trivia** (`trivia_who_am_i`)
   - `/api/who-am-i/route.ts`
   - `/api/who-am-i/[id]/route.ts`
   - `apps/cms/src/app/trivia-who-am-i/page.tsx`
   - `apps/cms/src/components/who-am-i/WhoAmITriviaCard.tsx`

6. **True/False Trivia** (`trivia_true_false`)
   - `/api/true-false/route.ts`
   - `/api/true-false/[id]/route.ts`
   - `apps/cms/src/app/trivia-true-false/page.tsx`
   - `apps/cms/src/components/true-false/TrueFalseTriviaCard.tsx`

7. **Multiple Choice Trivia** (`trivia_multiple_choice`)
   - `/api/multiple-choice/route.ts`
   - `/api/multiple-choice/[id]/route.ts`
   - `apps/cms/src/app/trivia-multiple-choice/page.tsx`
   - `apps/cms/src/components/multiple-choice/MultipleChoiceTriviaCard.tsx`

## Key Benefits

1. **Reliability**: API routes provide predictable behavior
2. **Performance**: Optimistic UI updates for immediate feedback
3. **Maintainability**: Clear separation of concerns (API/client)
4. **Testability**: Easy to test API routes independently
5. **Consistency**: Same pattern across all libraries
6. **Security**: RLS policies enforce authentication
7. **User Experience**: Fast, responsive interactions

## Common Issues & Solutions

### Issue: UI doesn't update after action

**Solution**: Ensure optimistic updates in `handleStatusChange`/`handleDelete` and check `fetchContent` is called

### Issue: Pagination shows wrong page after deletion

**Solution**: The `useEffect` for pagination validation should automatically adjust `currentPage` when `total` changes

### Issue: Stats don't update after action

**Solution**: Call `fetchStats()` after optimistic updates in handlers

### Issue: API returns 401 Unauthorized

**Solution**: Check RLS policies are enabled and user is authenticated. Verify `createApiClient()` is used correctly.

### Issue: API returns 500 error

**Solution**: Check server logs for details. Common issues: database connection, missing columns, RLS policy conflicts.

## Future Enhancements

Potential improvements to consider:

- **Real-time Updates**: Use Supabase Realtime for live updates across sessions
- **Caching**: Implement React Query or SWR for better caching
- **Optimistic Rollback**: Rollback optimistic updates on API errors
- **Bulk Actions**: Add support for bulk publish/unpublish/delete
- **Advanced Filtering**: Add filters for category, theme, difficulty, etc.
- **Search**: Add search functionality for content
- **Sorting**: Add sorting options (by date, title, etc.)

## References

- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- React Hooks: https://react.dev/reference/react
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Flow UI Inspiration: Modern, clean card-based design

---

**Last Updated**: 2025-01-07  
**Pattern Status**: ✅ Proven and validated across 7 content libraries  
**Maintainer**: CMS Development Team
