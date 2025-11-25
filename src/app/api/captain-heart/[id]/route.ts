import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

// PATCH /api/captain-heart/[id] - Partially update Captain Heart (archive/status changes)
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
      return NextResponse.json(
        { success: false, error: 'Status is required and must be a string' },
        { status: 400 },
      );
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

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
    } else {
      return NextResponse.json(
        { success: false, error: 'No valid changes to apply' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('collection_hockey_motivate')
      .update(updateData)
      .eq('id', id)
      .eq('attribution', 'Captain Heart')
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error patching captain heart:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update captain heart status',
          details: error.message,
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

// DELETE /api/captain-heart/[id] - Delete Captain Heart entry
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

    const { error } = await supabase
      .from('collection_hockey_motivate')
      .delete()
      .eq('id', id)
      .eq('attribution', 'Captain Heart');

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting captain heart:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete captain heart entry' },
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

