import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';
import { isValidISODate } from '@aska/shared';
import type { GetScheduleParams } from '@aska/shared';

/**
 * GET /api/shareables
 * Fetches scheduled shareables with optional filters
 * 
 * Query parameters:
 * - date: Get specific date (ISO: YYYY-MM-DD)
 * - start_date: Start of date range (ISO: YYYY-MM-DD)
 * - end_date: End of date range (ISO: YYYY-MM-DD)
 * - content_type: Content type filter (Phase 1: only 'motivational')
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: DailyShareableMotivational[],
 *   count?: number,
 *   error?: string
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const params: GetScheduleParams = {
      date: searchParams.get('date') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      content_type: (searchParams.get('content_type') as 'motivational') || undefined,
    };

    // Validate date formats if provided
    if (params.date && !isValidISODate(params.date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (params.start_date && !isValidISODate(params.start_date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid start_date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (params.end_date && !isValidISODate(params.end_date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid end_date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('daily_shareables_motivational')
      .select('*', { count: 'exact' })
      .order('publish_date', { ascending: true });

    // Apply filters
    if (params.date) {
      // Single date lookup
      query = query.eq('publish_date', params.date);
    } else if (params.start_date && params.end_date) {
      // Date range
      query = query
        .gte('publish_date', params.start_date)
        .lte('publish_date', params.end_date);
    } else if (params.start_date) {
      // Start date only
      query = query.gte('publish_date', params.start_date);
    } else if (params.end_date) {
      // End date only
      query = query.lte('publish_date', params.end_date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching shareables:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shareables' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

