import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

// GET /api/multiple-choice - Fetch multiple choice trivia entries with filters or stats
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
      // Get total count first
      const { count: totalCount } = await supabase
        .from('trivia_multiple_choice')
        .select('*', { count: 'exact', head: true });

      const totalRecords = totalCount || 0;

      // Fetch all records in batches to ensure accurate counts
      // Supabase has a default limit of 1000 rows per query, so we need to paginate
      const batchSize = 1000;
      const allStatuses: string[] = [];
      let offset = 0;

      while (offset < totalRecords) {
        const { data: batchData, error: batchError } = await supabase
          .from('trivia_multiple_choice')
          .select('status')
          .range(offset, offset + batchSize - 1);

        if (batchError) {
          // eslint-disable-next-line no-console
          console.error('Error fetching stats batch:', batchError);
          break;
        }

        if (batchData && batchData.length > 0) {
          allStatuses.push(...batchData.map((item) => item.status || 'null'));
        }

        // If we got fewer than batchSize, we've reached the end
        if (!batchData || batchData.length < batchSize) {
          break;
        }

        offset += batchSize;
      }

      const stats = {
        unpublished: allStatuses.filter(
          (status) => status !== 'published' && status !== 'archived',
        ).length,
        published: allStatuses.filter((status) => status === 'published').length,
        archived: allStatuses.filter((status) => status === 'archived').length,
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
      .from('trivia_multiple_choice')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filters
    if (status) {
      if (status === 'unpublished') {
        // Unpublished = anything that is NOT published and NOT archived
        // This includes NULL, "unpublished", or any other status
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
      console.error('Error fetching multiple choice trivia:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch multiple choice trivia entries' },
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
