import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';
import {
  generateConsecutiveDates,
  calculateEndDate,
  isValidISODate,
  getDayOfWeekName,
  getWeekOfYear,
  getSpecialOccasion,
  getSpecialSeason,
} from '@aska/shared';
import {
  selectItemsWithFrequencyControl,
  createUsageTracker,
} from '@aska/shared';
import type {
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  DailyShareableItem,
} from '@aska/shared';

/**
 * POST /api/shareables/generate
 * Generates a schedule of daily shareables for the specified date range
 * 
 * Request body:
 * {
 *   start_date: string (ISO date: YYYY-MM-DD),
 *   days: number,
 *   content_type: 'motivational'
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   dates_generated: number,
 *   date_range: { start: string, end: string },
 *   error?: string
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      console.error('No user ID found - user not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', userId);

    // Parse request body
    const body: GenerateScheduleRequest = await request.json();

    // Validate input
    if (!body.start_date || !body.days || body.days <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: start_date and days (positive number) are required',
        },
        { status: 400 }
      );
    }

    if (!isValidISODate(body.start_date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (body.content_type !== 'motivational') {
      return NextResponse.json(
        { success: false, error: 'Phase 1: Only motivational content type is supported' },
        { status: 400 }
      );
    }

    // Calculate date range
    const dates = generateConsecutiveDates(body.start_date, body.days);
    const endDate = calculateEndDate(body.start_date, body.days);

    // Fetch all available motivational content
    console.log('Fetching motivational content from collection_motivational...');
    const { data: motivationalItems, error: fetchError } = await supabase
      .from('collection_motivational')
      .select('*')
      .order('id');

    if (fetchError) {
      console.error('Error fetching motivational content:', fetchError);
      console.error('Error code:', fetchError.code);
      console.error('Error message:', fetchError.message);
      console.error('Error details:', fetchError.details);
      console.error('Error hint:', fetchError.hint);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch motivational content: ${fetchError.message || 'Unknown error'}. Code: ${fetchError.code || 'N/A'}` 
        },
        { status: 500 }
      );
    }

    console.log(`Found ${motivationalItems?.length || 0} motivational items`);
    
    // Log first item to see actual column names
    if (motivationalItems && motivationalItems.length > 0) {
      console.log('Sample item columns:', Object.keys(motivationalItems[0]));
      console.log('Sample item:', JSON.stringify(motivationalItems[0], null, 2));
    }

    if (!motivationalItems || motivationalItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No motivational content available. Please add some motivational content first.' },
        { status: 400 }
      );
    }

    // Determine items per day (flexible, default to 10)
    const itemsPerDay = 10; // Can be made configurable later
    const totalSlots = dates.length * itemsPerDay;

    // Create usage tracker for frequency control
    const tracker = createUsageTracker(motivationalItems.length, totalSlots);

    // Generate schedule for each date
    let successCount = 0;
    const errors: string[] = [];

    for (const date of dates) {
      try {
        // Select items with frequency control
        // Note: selectItemsWithFrequencyControl adds display_order property
        // Map database fields to expected structure (handle whatever column names exist)
        const mappedItems = motivationalItems.map((item: any) => ({
          id: item.id,
          quote: item.quote || '',
          author: item.author || item.author_name || null,
          context: item.context || null,
          theme: item.theme || null,
          category: item.category || null,
          attribution: item.attribution || null,
        }));

        const selectedItems = selectItemsWithFrequencyControl<{
          id: number;
          quote: string;
          author: string | null;
          context: string | null;
          theme: string | null;
          category: string | null;
          attribution: string | null;
        }>(mappedItems, itemsPerDay, tracker);

        // Package as DailyShareableItem
        // display_order is already added by selectItemsWithFrequencyControl
        const items: DailyShareableItem[] = selectedItems.map((item: any) => ({
          id: item.id,
          quote: item.quote,
          author: item.author || null,
          context: item.context || null,
          theme: item.theme || null,
          category: item.category || null,
          attribution: item.attribution || null,
          display_order: item.display_order,
        }));

        // Calculate metadata fields
        const dayOfWeek = getDayOfWeekName(date);
        const weekOfYear = getWeekOfYear(date);
        const specialOccasion = getSpecialOccasion(date);
        const specialSeason = getSpecialSeason(date);

        // Upsert into database (overwrites if date exists)
        // Note: id is auto-generated, we use publish_date for conflict resolution
        const upsertData = {
          publish_date: date,
          items: items,
          day_of_week: dayOfWeek,
          week_of_year: weekOfYear,
          special_occasion: specialOccasion,
          special_season: specialSeason,
          updated_at: new Date().toISOString(),
        };

        console.log(`Upserting date ${date} with ${items.length} items`);
        const { error: upsertError } = await supabase
          .from('daily_shareables_motivational')
          .upsert(upsertData, {
            onConflict: 'publish_date', // Uses unique constraint on publish_date
          });

        if (upsertError) {
          console.error(`Error upserting schedule for ${date}:`, upsertError);
          console.error('Error code:', upsertError.code);
          console.error('Error message:', upsertError.message);
          console.error('Error details:', upsertError.details);
          console.error('Error hint:', upsertError.hint);
          errors.push(`Failed to save schedule for ${date}: ${upsertError.message || 'Unknown error'}`);
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing date ${date}:`, error);
        errors.push(`Failed to process ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return response
    if (successCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate any schedules. Errors: ${errors.join('; ')}`,
        },
        { status: 500 }
      );
    }

    const response: GenerateScheduleResponse = {
      success: true,
      dates_generated: successCount,
      date_range: {
        start: body.start_date,
        end: endDate,
      },
    };

    if (errors.length > 0) {
      response.error = `Generated ${successCount} dates, but encountered errors: ${errors.join('; ')}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in generate schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

