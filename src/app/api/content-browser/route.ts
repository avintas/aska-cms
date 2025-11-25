import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';
import type { IdeationTheme, IdeationThemeStat, IdeationTagStat, IdeationSourceSummary, SourceUsageKey } from '@/lib/ideation/types';

const THEME_ORDER: IdeationTheme[] = [
  // Group 1: Core Game Content
  'Players',
  'Teams & Organizations',
  'Awards & Honors',
  'Venues & Locations',
  'Leadership & Staff',
  // Group 2: Analysis & Performance
  'Tactics & Advanced Analytics',
  'Training, Health, & Wellness',
  'Equipment & Technology',
  // Group 3: Business & Media
  'Business & Finance',
  'Media, Broadcasting, & E-Sports',
  'Marketing, Sponsorship, and Merchandising',
  // Group 4: Culture & Community
  'Fandom & Fan Culture',
  'Social Impact & Diversity',
];

const DEFAULT_LIMIT = 5;
const USAGE_ORDER: SourceUsageKey[] = [
  'wisdom',
  'greeting',
  'motivational',
  'stat',
  'fact',
  'multiple-choice',
  'true-false',
  'who-am-i',
];

const SOURCE_USAGE_TABLES: Array<{ table: string; key: SourceUsageKey; attributionField?: string; attributionValue?: string }> = [
  { table: 'collection_wisdom', key: 'wisdom' },
  { table: 'collection_hockey_wisdom', key: 'wisdom' }, // W-Gen route uses this table
  { table: 'collection_greetings', key: 'greeting' },
  { table: 'collection_motivational', key: 'motivational' }, // Legacy table
  // collection_hockey_motivate uses attribution field to determine character-specific badges
  { table: 'collection_hockey_motivate', key: 'bench-boss', attributionField: 'attribution', attributionValue: 'Bench Boss' },
  { table: 'collection_hockey_motivate', key: 'captain-heart', attributionField: 'attribution', attributionValue: 'Captain Heart' },
  { table: 'collection_stats', key: 'stat' },
  { table: 'collection_facts', key: 'fact' },
  { table: 'collection_hockey_facts', key: 'fact' }, // F-Gen route uses this table
  { table: 'trivia_multiple_choice', key: 'multiple-choice' },
  { table: 'trivia_true_false', key: 'true-false' },
  { table: 'trivia_who_am_i', key: 'who-am-i' },
];

function normalizeTheme(value: string | null): IdeationTheme | null {
  if (!value) return null;
  return THEME_ORDER.find((theme) => theme === value) ?? null;
}

function coerceTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((tag): tag is string => typeof tag === 'string');
      }
    } catch {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function sortUsage(keys: Iterable<SourceUsageKey>): SourceUsageKey[] {
  const unique = Array.from(new Set(keys));
  return USAGE_ORDER.filter((key) => unique.includes(key));
}

async function buildSourceUsageMap(
  supabase: Awaited<ReturnType<typeof createApiClient>>['supabase'],
  sourceIds: number[],
): Promise<Map<number, SourceUsageKey[]>> {
  const usageMap = new Map<number, SourceUsageKey[]>();
  if (sourceIds.length === 0) {
    return usageMap;
  }

  await Promise.all(
    SOURCE_USAGE_TABLES.map(async ({ table, key, attributionField, attributionValue }) => {
      let query = supabase
        .from(table)
        .select('source_content_id')
        .in('source_content_id', sourceIds);

      // If attributionField is specified, filter by attribution value (for character-specific badges)
      if (attributionField && attributionValue) {
        query = query.eq(attributionField, attributionValue);
      }

      const { data, error } = await query;
      if (error) return;
      for (const row of data ?? []) {
        const sourceId = (row as { source_content_id?: number | null }).source_content_id;
        if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
          const current = usageMap.get(sourceId) ?? [];
          if (!current.includes(key)) {
            usageMap.set(sourceId, sortUsage([...current, key]));
          }
        }
      }
    }),
  );

  const usedForResponse = await supabase
    .from('source_content_ingested')
    .select('id,used_for')
    .in('id', sourceIds)
    .not('used_for', 'is', null);

  if (!usedForResponse.error) {
    for (const row of usedForResponse.data ?? []) {
      const id = (row as { id?: number }).id;
      if (!id) continue;
      const raw = (row as { used_for?: string[] | null }).used_for ?? [];
      const mapped = raw
        .map((value) => {
          const normalized = value.toLowerCase();
          if (USAGE_ORDER.includes(normalized as SourceUsageKey)) {
            return normalized as SourceUsageKey;
          }
          return null;
        })
        .filter((value): value is SourceUsageKey => Boolean(value));
      if (mapped.length === 0) continue;
      const current = usageMap.get(id) ?? [];
      usageMap.set(id, sortUsage([...current, ...mapped]));
    }
  }

  return usageMap;
}

// GET /api/content-browser - Fetch sources with filters, or theme/tag stats
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session and get authenticated client
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statsType = searchParams.get('stats');

    // Stats endpoints
    if (statsType === 'themes') {
      const { data, error } = await supabase
        .from('source_content_ingested')
        .select('id, theme, ingestion_status, updated_at', { count: 'exact' })
        .eq('content_status', 'active'); // Only count active (non-archived) content

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching theme stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch theme stats' }, { status: 500 });
      }

      const statsMap = new Map<IdeationTheme, IdeationThemeStat>();

      for (const row of data ?? []) {
        const theme = normalizeTheme((row as { theme: string | null }).theme);
        if (!theme) continue;
        const stat = statsMap.get(theme) ?? {
          theme,
          totalSources: 0,
          publishedSources: 0,
          latestIngestedAt: null,
        };
        stat.totalSources += 1;
        if ((row as { ingestion_status?: string }).ingestion_status === 'complete') {
          stat.publishedSources += 1;
        }
        const updatedAt = (row as { updated_at?: string }).updated_at ?? null;
        if (updatedAt) {
          const prev = stat.latestIngestedAt ? new Date(stat.latestIngestedAt).getTime() : 0;
          const current = new Date(updatedAt).getTime();
          if (current > prev) {
            stat.latestIngestedAt = updatedAt;
          }
        }
        statsMap.set(theme, stat);
      }

      // Ensure all themes are included, even with 0 sources
      const themeStats = THEME_ORDER.map((theme) => {
        const existing = statsMap.get(theme);
        if (existing) {
          return existing;
        }
        // Return theme with 0 counts if not in database
        return {
          theme,
          totalSources: 0,
          publishedSources: 0,
          latestIngestedAt: null,
        };
      });

      return NextResponse.json({
        success: true,
        stats: themeStats,
      });
    }

    if (statsType === 'tags') {
      const limit = parseInt(searchParams.get('limit') || '80', 10);
      const { data, error } = await supabase
        .from('source_content_ingested')
        .select('tags')
        .eq('content_status', 'active'); // Only count tags from active (non-archived) content

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching tag stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch tag stats' }, { status: 500 });
      }

      const tagCounts = new Map<string, number>();

      for (const row of data ?? []) {
        const tags = coerceTags((row as { tags?: unknown }).tags);
        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }

      const tagStats: IdeationTagStat[] = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, total]) => ({ tag, total }));

      return NextResponse.json({
        success: true,
        stats: tagStats,
      });
    }

    // Regular fetch with filters and pagination
    const themesParam = searchParams.get('themes');
    const tagsParam = searchParams.get('tags');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('source_content_ingested')
      .select('id,title,summary,theme,category,tags,ingestion_status,ingestion_process_id,updated_at', {
        count: 'exact',
      })
      .eq('content_status', 'active') // Only show active (non-archived) content
      .order('updated_at', { ascending: false });

    // Apply filters
    if (themesParam) {
      // Use pipe delimiter to avoid issues with commas in theme names
      // Support both pipe (new) and comma (legacy) for backward compatibility
      const themes = themesParam.includes('|')
        ? themesParam.split('|').filter(Boolean)
        : themesParam.split(',').filter(Boolean);
      if (themes.length > 0) {
        query = query.in('theme', themes);
      }
    }

    if (tagsParam) {
      const tags = tagsParam.split(',').filter(Boolean);
      if (tags.length > 0) {
        // For tags, we need to check if the tag is in the tags array
        // This requires a more complex query - for now, filter client-side
        // TODO: Improve tag filtering at database level
      }
    }

    if (search?.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching sources:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sources' },
        { status: 500 },
      );
    }

    const rows = (data ?? []).filter((row) => Boolean(row));
    const sourceIds = rows
      .map((row) => (row as { id?: number }).id)
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
    const usageMap = await buildSourceUsageMap(supabase, sourceIds);

    const items: IdeationSourceSummary[] = rows
      .map((row) => {
        const theme = normalizeTheme((row as { theme: string | null }).theme);
        if (!theme) return null;
        const id = (row as { id: number }).id;
        return {
          id,
          title: (row as { title?: string }).title ?? 'Untitled source',
          summary: (row as { summary?: string | null }).summary ?? '',
          theme,
          category: (row as { category?: string | null }).category ?? null,
          tags: coerceTags((row as { tags?: unknown }).tags),
          ingestionStatus: (row as { ingestion_status?: string }).ingestion_status ?? 'unknown',
          ingestionProcessId: (row as { ingestion_process_id?: string | null }).ingestion_process_id ?? null,
          updatedAt: (row as { updated_at?: string }).updated_at ?? new Date().toISOString(),
          usage: usageMap.get(id) ?? [],
        };
      })
      .filter((row): row is IdeationSourceSummary => Boolean(row));

    // Filter by tags client-side if needed (TODO: improve to database level)
    let filteredItems = items;
    if (tagsParam) {
      const tags = tagsParam.split(',').filter(Boolean);
      if (tags.length > 0) {
        filteredItems = items.filter((item) => tags.some((filterTag) => item.tags.includes(filterTag)));
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredItems,
      count: count ?? filteredItems.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

