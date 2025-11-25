import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

// GET /api/pbp - Fetch PBP (Penalty Box Philosopher) entries with filters or stats
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session and get authenticated client
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const statsOnly = searchParams.get('stats') === 'true';

    // If stats requested, return counts by status
    if (statsOnly) {
      // Get all items and count by status
      const { data: allItems } = await supabase.from('collection_hockey_wisdom').select('status');

      if (!allItems) {
        return NextResponse.json({
          success: true,
          stats: { unpublished: 0, published: 0, archived: 0 },
        });
      }

      const stats = {
        unpublished: allItems.filter(
          (item) => item.status !== 'published' && item.status !== 'archived',
        ).length,
        published: allItems.filter((item) => item.status === 'published').length,
        archived: allItems.filter((item) => item.status === 'archived').length,
      };

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Regular fetch with filters
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('collection_hockey_wisdom')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filters
    if (status) {
      if (status === 'unpublished') {
        // Unpublished = anything that is NOT published and NOT archived
        query = query.or('status.is.null,and(status.not.eq.published,status.not.eq.archived)');
      } else if (status === 'published') {
        query = query.eq('status', 'published');
      } else if (status === 'archived') {
        query = query.eq('status', 'archived');
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching PBP:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch PBP entries' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: count || 0,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

