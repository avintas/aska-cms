import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';
import type { ScheduleReport } from '@aska/shared';

/**
 * GET /api/shareables/report
 * Returns content release report data
 * 
 * Query parameters:
 * - start_date: Optional start date filter (ISO: YYYY-MM-DD)
 * - end_date: Optional end date filter (ISO: YYYY-MM-DD)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: ScheduleReport,
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
    const startDateFilter = searchParams.get('start_date') || undefined;
    const endDateFilter = searchParams.get('end_date') || undefined;

    // Fetch all scheduled dates
    let query = supabase
      .from('daily_shareables_motivational')
      .select('publish_date')
      .order('publish_date', { ascending: true });

    // Apply date filters if provided
    if (startDateFilter) {
      query = query.gte('publish_date', startDateFilter);
    }
    if (endDateFilter) {
      query = query.lte('publish_date', endDateFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching report data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch report data' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      const report: ScheduleReport = {
        total_days: 0,
        date_range: {
          start: startDateFilter || '',
          end: endDateFilter || '',
        },
        scheduled_dates: [],
        gaps: [],
        stats: {
          earliest_date: null,
          latest_date: null,
          total_items: 0,
        },
      };

      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    // Extract scheduled dates
    const scheduledDates = data.map((row) => row.publish_date as string).sort();

    // Calculate date range
    const earliestDate = scheduledDates[0];
    const latestDate = scheduledDates[scheduledDates.length - 1];

    // Calculate gaps (simplified - assumes continuous range)
    // For Phase 1, we'll just note if there are gaps
    const gaps: string[] = [];
    if (scheduledDates.length > 1) {
      const start = new Date(earliestDate);
      const end = new Date(latestDate);
      const allDates: string[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().split('T')[0]);
      }

      // Find gaps
      allDates.forEach((date) => {
        if (!scheduledDates.includes(date)) {
          gaps.push(date);
        }
      });
    }

    // Get total items count (need to fetch full data for this)
    const { data: fullData, error: fullError } = await supabase
      .from('daily_shareables_motivational')
      .select('items')
      .in('publish_date', scheduledDates);

    let totalItems = 0;
    if (!fullError && fullData) {
      fullData.forEach((row) => {
        const items = row.items as any[];
        if (Array.isArray(items)) {
          totalItems += items.length;
        }
      });
    }

    const report: ScheduleReport = {
      total_days: scheduledDates.length,
      date_range: {
        start: earliestDate,
        end: latestDate,
      },
      scheduled_dates: scheduledDates,
      gaps: gaps,
      stats: {
        earliest_date: earliestDate,
        latest_date: latestDate,
        total_items: totalItems,
      },
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

