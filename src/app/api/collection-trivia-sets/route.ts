import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type {
  CollectionTriviaSets,
  CollectionTriviaSet,
  CollectionTriviaSetEntry,
} from '@/shared/types/automated-set-builder';

/**
 * GET /api/collection-trivia-sets
 * Get all collection trivia sets, grouped by publish_date
 * 
 * Query params:
 *   - publish_date?: string (ISO date string, e.g., "2025-01-15")
 *   - limit?: number (default: 100)
 *   - offset?: number (default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    
    const publishDate = searchParams.get('publish_date');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch individual set records
    let query = supabase
      .from('collection_trivia_sets')
      .select('*')
      .order('publish_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (publishDate) {
      query = query.eq('publish_date', publishDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching collection trivia sets:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    // Group sets by publish_date
    // Each database row has a sets JSONB array with one element: [{type: "mc", set: {...}}]
    const groupedByDate = new Map<string, CollectionTriviaSetEntry[]>();
    
    (data as CollectionTriviaSet[] || []).forEach((row) => {
      const date = row.publish_date;
      // Extract the set entry from the sets array (each row has one set in the array)
      if (row.sets && Array.isArray(row.sets) && row.sets.length > 0) {
        const setEntry = row.sets[0]; // First (and only) element in the array
        if (!groupedByDate.has(date)) {
          groupedByDate.set(date, []);
        }
        groupedByDate.get(date)!.push(setEntry);
      }
    });

    // Convert to CollectionTriviaSets format (grouped by date)
    const collections: CollectionTriviaSets[] = Array.from(groupedByDate.entries()).map(
      ([publish_date, sets]) => ({
        publish_date,
        sets: sets, // Already in the correct format: CollectionTriviaSetEntry[]
        set_count: sets.length,
      }),
    );

    // Sort collections by publish_date (most recent first)
    collections.sort((a, b) => {
      return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
    });

    return NextResponse.json({
      success: true,
      data: collections,
      count: collections.length,
      totalSets: data?.length || 0,
    });
  } catch (error) {
    console.error('Unexpected error fetching collection trivia sets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}