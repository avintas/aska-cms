import 'server-only';

import { createServerClient } from '@/utils/supabase/server';
import type {
  IdeationFilters,
  CollectionInventoryCounts,
  IdeationSourceSummary,
  IdeationTagStat,
  IdeationTheme,
  IdeationThemeOverview,
  IdeationThemeStat,
  IdeationSearchResult,
  SourceUsageKey,
} from './types';
import type { ContentType } from '@aska/shared';

const THEME_ORDER: IdeationTheme[] = [
  // Core Themes (5 of 13 total)
  'Players',
  'Teams & Organizations',
  'Venues & Locations',
  'Awards & Honors',
  'Leadership & Staff',
  // Business, Economics, & Management (3)
  'Business & Finance',
  'Media, Broadcasting, & E-Sports',
  'Marketing, Sponsorship, and Merchandising',
  // Technology, Training, & Performance (2)
  'Equipment & Technology',
  'Training, Health, & Wellness',
  // Culture, Fandom, & Community (2)
  'Fandom & Fan Culture',
  'Social Impact & Diversity',
  // Advanced Analysis & Strategy (1)
  'Tactics & Advanced Analytics',
];

const DEFAULT_LIMIT = 50;
const USAGE_ORDER: SourceUsageKey[] = [
  'wisdom',
  'greeting',
  'bench-boss',
  'captain-heart',
  'motivational', // Legacy/fallback - will be phased out
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
      // ignore parse errors; fall back to splitting
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export async function getIdeationThemeStats(): Promise<IdeationThemeStat[]> {
  const supabase = await createServerClient();
  // Includes all active sources, including those linked to facts table (and other collection tables)
  const { data, error } = await supabase
    .from('source_content_ingested')
    .select('id, theme, ingestion_status, updated_at', { count: 'exact' })
    .eq('content_status', 'active'); // Only count active (non-archived) content

  if (error) {
    // eslint-disable-next-line no-console
    console.error('getIdeationThemeStats failed', error);
    return [];
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

  return THEME_ORDER.map((theme) => {
    const existing = statsMap.get(theme);
    return existing ?? {
      theme,
      totalSources: 0,
      publishedSources: 0,
      latestIngestedAt: null,
    };
  });
}

export async function getIdeationThemeOverview(): Promise<IdeationThemeOverview[]> {
  const supabase = await createServerClient();
  // Includes all active sources, including those linked to facts table (and other collection tables)
  const { data, error } = await supabase
    .from('source_content_ingested')
    .select('theme, category')
    .eq('content_status', 'active'); // Only count active (non-archived) content

  if (error) {
    // eslint-disable-next-line no-console
    console.error('getIdeationThemeOverview failed', error);
    return [];
  }

  const categoryMap = new Map<IdeationTheme, Map<string, number>>();

  for (const row of data ?? []) {
    const theme = normalizeTheme((row as { theme: string | null }).theme);
    if (!theme) continue;
    const category = ((row as { category?: string | null }).category ?? '').trim();
    if (!category) continue;
    const catMap = categoryMap.get(theme) ?? new Map<string, number>();
    catMap.set(category, (catMap.get(category) ?? 0) + 1);
    categoryMap.set(theme, catMap);
  }

  return THEME_ORDER.map((theme) => ({
    theme,
    categories: Array.from(categoryMap.get(theme)?.entries() ?? []).map(([category, total]) => ({
      category,
      total,
    })),
  }));
}

export async function getIdeationTags(limit = 100): Promise<IdeationTagStat[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('source_content_ingested')
    .select('tags')
    .eq('content_status', 'active'); // Only count tags from active (non-archived) content

  if (error) {
    // eslint-disable-next-line no-console
    console.error('getIdeationTags failed', error);
    return [];
  }

  const tagCounts = new Map<string, number>();

  for (const row of data ?? []) {
    const tags = coerceTags((row as { tags?: unknown }).tags);
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, total]) => ({ tag, total }));
}

export async function getIdeationSourceById(id: number): Promise<IdeationSourceSummary | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('source_content_ingested')
    .select('id,title,summary,theme,category,tags,ingestion_status,ingestion_process_id,updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error('getIdeationSourceById failed', error);
    return null;
  }

  const theme = normalizeTheme((data as { theme: string | null }).theme);
  if (!theme) {
    return null;
  }

  const sourceId = (data as { id: number }).id;
  const usageMap = await buildSourceUsageMap(supabase, [sourceId]);

  return {
    id: sourceId,
    title: (data as { title?: string }).title ?? 'Untitled source',
    summary: (data as { summary?: string | null }).summary ?? '',
    theme,
    category: (data as { category?: string | null }).category ?? null,
    tags: coerceTags((data as { tags?: unknown }).tags),
    ingestionStatus: (data as { ingestion_status?: string }).ingestion_status ?? 'unknown',
    ingestionProcessId: (data as { ingestion_process_id?: string | null }).ingestion_process_id ?? null,
    updatedAt: (data as { updated_at?: string }).updated_at ?? new Date().toISOString(),
    usage: usageMap.get(sourceId) ?? [],
  };
}

export async function searchIdeationSources(filters: IdeationFilters = {}): Promise<IdeationSearchResult> {
  const supabase = await createServerClient();
  const pageSize = Math.max(1, filters.pageSize ?? filters.limit ?? DEFAULT_LIMIT);
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('source_content_ingested')
    .select('id,title,summary,theme,category,tags,ingestion_status,ingestion_process_id,updated_at', {
      count: 'exact',
    })
    .eq('content_status', 'active') // Only show active (non-archived) content
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (filters.themes?.length) {
    query = query.in('theme', filters.themes);
  }
  if (filters.categories?.length) {
    query = query.in('category', filters.categories);
  }
  if (filters.status?.length) {
    query = query.in('ingestion_status', filters.status);
  }
  if (filters.search?.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    // eslint-disable-next-line no-console
    console.error('searchIdeationSources failed', error);
    return { items: [], total: 0 };
  }

  const rows = (data ?? []).filter((row) => Boolean(row));
  const sourceIds = rows
    .map((row) => (row as { id?: number }).id)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
  const usageMap = await buildSourceUsageMap(supabase, sourceIds);

  const items = rows
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
      } satisfies IdeationSourceSummary;
    })
    .filter((row): row is IdeationSourceSummary => Boolean(row));

  return {
    items,
    total: count ?? items.length,
  };
}

export async function getCollectionInventoryCounts(): Promise<CollectionInventoryCounts> {
  const supabase = await createServerClient();

  const [
    { count: wisdomCount },
    { count: greetingsCount },
    { count: motivationalCount },
    { count: factsCount },
    { count: sourcesCount },
    { count: mcqCount },
    { count: tfCount },
    { count: whoAmICount },
  ] = await Promise.all([
    supabase.from('collection_wisdom').select('id', { count: 'exact', head: true }),
    supabase.from('collection_greetings').select('id', { count: 'exact', head: true }),
    supabase.from('collection_motivational').select('id', { count: 'exact', head: true }),
    supabase.from('collection_facts').select('id', { count: 'exact', head: true }),
    supabase.from('source_content_ingested').select('id', { count: 'exact', head: true }),
    supabase.from('trivia_multiple_choice').select('id', { count: 'exact', head: true }),
    supabase.from('trivia_true_false').select('id', { count: 'exact', head: true }),
    supabase.from('trivia_who_am_i').select('id', { count: 'exact', head: true }),
  ]);

  return {
    wisdom: wisdomCount ?? 0,
    greetings: greetingsCount ?? 0,
    motivational: motivationalCount ?? 0,
    facts: factsCount ?? 0,
    sources: sourcesCount ?? 0,
    triviaMultipleChoice: mcqCount ?? 0,
    triviaTrueFalse: tfCount ?? 0,
    triviaWhoAmI: whoAmICount ?? 0,
  };
}

function sortUsage(keys: Iterable<SourceUsageKey>): SourceUsageKey[] {
  const unique = Array.from(new Set(keys));
  return USAGE_ORDER.filter((key) => unique.includes(key));
}

function mapUsageFromContentType(value: string | null | undefined): SourceUsageKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase() as ContentType;
  if (
    normalized === 'wisdom' ||
    normalized === 'greeting' ||
    normalized === 'motivational' ||
    normalized === 'fact' ||
    normalized === 'multiple-choice' ||
    normalized === 'true-false' ||
    normalized === 'who-am-i'
  ) {
    return normalized;
  }
  return null;
}

async function buildSourceUsageMap(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
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

  // Attempt to read legacy used_for array if present
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
        .map((value) => mapUsageFromContentType(value))
        .filter((value): value is SourceUsageKey => Boolean(value));
      if (mapped.length === 0) continue;
      const current = usageMap.get(id) ?? [];
      usageMap.set(id, sortUsage([...current, ...mapped]));
    }
  }

  return usageMap;
}
