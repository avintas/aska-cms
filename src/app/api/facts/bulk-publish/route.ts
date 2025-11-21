import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

// POST /api/facts/bulk-publish - Bulk publish multiple facts by ID
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session and get authenticated client
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    // Validate that we have an array of IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids must be a non-empty array' },
        { status: 400 },
      );
    }

    // Validate all IDs are numbers
    const factIds = ids.map((id) => (typeof id === 'number' ? id : parseInt(String(id), 10)));
    if (factIds.some((id) => Number.isNaN(id) || !Number.isFinite(id))) {
      return NextResponse.json(
        { success: false, error: 'All ids must be valid numbers' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const updateData = {
      status: 'published',
      published_at: now,
      updated_at: now,
      // Clear archived_at if it was set
      archived_at: null,
    };

    // eslint-disable-next-line no-console
    console.log('Bulk publishing facts:', { count: factIds.length, ids: factIds });

    const { data, error } = await supabase
      .from('collection_facts')
      .update(updateData)
      .in('id', factIds)
      .select();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error bulk publishing facts:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to bulk publish facts',
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

