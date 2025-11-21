import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

// PATCH /api/multiple-choice/[id] - Partially update multiple choice trivia (archive/status changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Validate user session and get authenticated client
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const body = await request.json();

    // Validate that we have a status to update
    if (!body.status || typeof body.status !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Status is required and must be a string' },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    // Handle archive status
    if (body.status === 'archived' && !body.archived_at) {
      updateData.status = 'archived';
      updateData.archived_at = new Date().toISOString();
    } else if (body.status) {
      updateData.status = body.status;
      if (body.status === 'published' && !body.published_at) {
        updateData.published_at = new Date().toISOString();
      } else if (body.status === 'unpublished') {
        updateData.published_at = null;
        // Clear archived_at when unpublishing
        updateData.archived_at = null;
      }
    }

    // Only update updated_at if we have actual changes
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
    } else {
      return NextResponse.json(
        { success: false, error: 'No valid changes to apply' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line no-console
    console.log('Updating multiple choice trivia:', { id, updateData });

    const { data, error } = await supabase
      .from('trivia_multiple_choice')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error patching multiple choice trivia:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update multiple choice trivia status',
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/multiple-choice/[id] - Delete multiple choice trivia entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Validate user session and get authenticated client
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    const { error } = await supabase.from('trivia_multiple_choice').delete().eq('id', id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting multiple choice trivia:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete multiple choice trivia entry' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

