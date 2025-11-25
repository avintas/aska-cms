import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';

interface StatsResponse {
  success: boolean;
  stats?: {
    total: number;
    published: number;
    archived: number;
    unpublished: number;
    publishedSets: number;
  };
  error?: string;
}

/**
 * GET /api/shareables/stats
 * Gets statistics for collection items and published sets
 *
 * Query params:
 *   type: 'motivational' | 'facts' | 'wisdom'
 *
 * Response:
 * {
 *   success: boolean,
 *   stats: {
 *     total: number,
 *     published: number,
 *     archived: number,
 *     unpublished: number,
 *     publishedSets: number  // Count from pub_shareables_motivational, pub_shareables_facts, or pub_shareables_wisdom
 *   },
 *   error?: string
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse<StatsResponse>> {
  try {
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || (type !== 'motivational' && type !== 'facts' && type !== 'wisdom')) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "motivational", "facts", or "wisdom"' },
        { status: 400 },
      );
    }

    const tableName =
      type === 'motivational'
        ? 'collection_motivational'
        : type === 'facts'
          ? 'collection_facts'
          : 'collection_wisdom';
    const pubTableName =
      type === 'motivational'
        ? 'pub_shareables_motivational'
        : type === 'facts'
          ? 'pub_shareables_facts'
          : 'pub_shareables_wisdom';

    console.log(`Fetching stats for table: ${tableName}`);

    // Fetch all items and count by status in memory (same pattern as other collection APIs)
    const { data: allItems, error: fetchError } = await supabase.from(tableName).select('status');

    if (fetchError) {
      console.error(`Error fetching items for ${type}:`, fetchError);
      console.error('Error details:', fetchError.message, fetchError.details, fetchError.hint);
      return NextResponse.json(
        { success: false, error: `Failed to fetch stats: ${fetchError.message}` },
        { status: 500 },
      );
    }

    // Count published sets
    const { count: publishedSetsCount, error: setsError } = await supabase
      .from(pubTableName)
      .select('*', { count: 'exact', head: true });

    if (setsError) {
      console.error(`Error counting published sets for ${type}:`, setsError);
      // Don't fail, just log and continue
    }

    if (!allItems) {
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          published: 0,
          archived: 0,
          unpublished: 0,
          publishedSets: publishedSetsCount || 0,
        },
      });
    }

    // Count by status
    const total = allItems.length;
    const published = allItems.filter((item) => item.status === 'published').length;
    const archived = allItems.filter((item) => item.status === 'archived').length;
    const unpublished = allItems.filter(
      (item) => item.status !== 'published' && item.status !== 'archived',
    ).length;

    console.log(`Stats for ${tableName}:`, { total, published, archived, unpublished, publishedSets: publishedSetsCount || 0 });

    return NextResponse.json({
      success: true,
      stats: {
        total: total || 0,
        published: published || 0,
        archived: archived || 0,
        unpublished: unpublished || 0,
        publishedSets: publishedSetsCount || 0,
      },
    });
  } catch (error) {
    console.error('Unexpected error in stats:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
