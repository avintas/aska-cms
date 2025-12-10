import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type { CollectionTriviaSets, CollectionTriviaSet } from '@/shared/types/automated-set-builder';

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
    const groupedByDate = new Map<string, CollectionTriviaSet[]>();
    
    (data as CollectionTriviaSet[] || []).forEach((set) => {
      const date = set.publish_date;
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, []);
      }
      groupedByDate.get(date)!.push(set);
    });

    // Convert to CollectionTriviaSets format (grouped by date)
    const collections: CollectionTriviaSets[] = Array.from(groupedByDate.entries()).map(
      ([publish_date, sets]) => ({
        publish_date,
        sets: sets.map((set) => ({
          type: set.set_type,
          set: set.set_data,
        })),
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

