import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

// POST /api/source-content/[id]/archive - Archive a source content item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sourceId = parseInt(id, 10);

    if (!Number.isFinite(sourceId) || sourceId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid source ID' }, { status: 400 });
    }

    // Update the content_status to 'archived'
    const { data, error } = await supabase
      .from('source_content_ingested')
      .update({ content_status: 'archived' })
      .eq('id', sourceId)
      .select('id, title')
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error archiving source:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to archive source' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Source "${data.title}" has been archived`,
      data: { id: data.id },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

