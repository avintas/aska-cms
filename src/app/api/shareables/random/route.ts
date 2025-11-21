import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

type ContentType = 'motivational' | 'facts';

interface RandomRequest {
  content_type: ContentType;
  count: number;
  exclude_ids?: number[]; // Optional: IDs to exclude from selection
}

/**
 * POST /api/shareables/random
 * Randomly picks items from collection_motivational or collection_facts
 * 
 * Request body:
 * {
 *   content_type: 'motivational' | 'facts',
 *   count: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   items: any[],
 *   error?: string
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: RandomRequest = await request.json();

    // Validation
    if (!body.content_type || !body.count) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: content_type, count' },
        { status: 400 }
      );
    }

    if (body.content_type !== 'motivational' && body.content_type !== 'facts') {
      return NextResponse.json(
        { success: false, error: 'Invalid content_type. Must be "motivational" or "facts"' },
        { status: 400 }
      );
    }

    if (typeof body.count !== 'number' || body.count <= 0) {
      return NextResponse.json(
        { success: false, error: 'Count must be a positive number' },
        { status: 400 }
      );
    }

    const tableName = body.content_type === 'motivational' ? 'collection_motivational' : 'collection_facts';

    // Fetch all items excluding archived
    const { data: allItems, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .neq('status', 'archived');

    if (fetchError) {
      console.error(`Error fetching ${body.content_type} items:`, fetchError);
      return NextResponse.json(
        { success: false, error: `Failed to fetch items: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!allItems || allItems.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${body.content_type} items available` },
        { status: 400 }
      );
    }

    // Filter out excluded IDs if provided
    let availableItems = allItems;
    if (body.exclude_ids && body.exclude_ids.length > 0) {
      const excludeSet = new Set(body.exclude_ids);
      availableItems = allItems.filter((item) => !excludeSet.has(item.id));
    }

    if (availableItems.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${body.content_type} items available after exclusions` },
        { status: 400 }
      );
    }

    if (availableItems.length < body.count) {
      return NextResponse.json(
        { success: false, error: `Only ${availableItems.length} items available, but ${body.count} requested` },
        { status: 400 }
      );
    }

    // Randomly shuffle and pick items
    const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, body.count);

    return NextResponse.json({
      success: true,
      items: selectedItems,
    });
  } catch (error) {
    console.error('Unexpected error in random selection:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

