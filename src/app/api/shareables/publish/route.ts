import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

type ContentType = 'motivational' | 'facts';
type Status = 'unpublished' | 'published' | 'archived';

interface PublishRequest {
  content_type: ContentType;
  items: any[];
  status: Status;
}

/**
 * POST /api/shareables/publish
 * Creates a new published shareable collection
 * 
 * Request body:
 * {
 *   content_type: 'motivational' | 'facts',
 *   items: any[],
 *   status: 'unpublished' | 'published' | 'archived'
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   id?: number,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: PublishRequest = await request.json();

    // Validation
    if (!body.content_type || !body.items || !body.status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: content_type, items, status' },
        { status: 400 }
      );
    }

    if (body.content_type !== 'motivational' && body.content_type !== 'facts') {
      return NextResponse.json(
        { success: false, error: 'Invalid content_type. Must be "motivational" or "facts"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!['unpublished', 'published', 'archived'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "unpublished", "published", or "archived"' },
        { status: 400 }
      );
    }

    const tableName = body.content_type === 'motivational' ? 'pub_shareables_motivational' : 'pub_shareables_facts';

    console.log(`Creating published set in table: ${tableName}`);
    console.log(`Items count: ${body.items.length}`);
    console.log(`Status: ${body.status}`);

    // Prepare items with display_order
    const itemsWithOrder = body.items.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));

    console.log(`Prepared ${itemsWithOrder.length} items with display_order`);

    // Insert into database
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        items: itemsWithOrder,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Error creating ${body.content_type} shareable:`, error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { success: false, error: `Failed to create shareable: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully created published set with ID: ${data.id}`);

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error) {
    console.error('Unexpected error in publish:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

