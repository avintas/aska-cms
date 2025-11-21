import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

/**
 * GET /api/shareables/available
 * Gets available items from collection_motivational or collection_facts
 * 
 * Query params:
 *   type: 'motivational' | 'facts'
 * 
 * Response:
 * {
 *   success: boolean,
 *   items: any[],
 *   error?: string
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || (type !== 'motivational' && type !== 'facts')) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "motivational" or "facts"' },
        { status: 400 }
      );
    }

    const tableName = type === 'motivational' ? 'collection_motivational' : 'collection_facts';

    const { data: items, error } = await supabase.from(tableName).select('*').order('id');

    if (error) {
      console.error(`Error fetching ${type} items:`, error);
      return NextResponse.json(
        { success: false, error: `Failed to fetch ${type} items: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: items || [],
    });
  } catch (error) {
    console.error('Unexpected error in available items:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

