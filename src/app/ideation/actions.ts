'use server';

import type { IdeationFilters, IdeationSearchResult } from '@/lib/ideation';
import { runIdeationAnalysis, searchIdeationSources } from '@/lib/ideation';

function sanitizeFilters(filters: Partial<IdeationFilters>): IdeationFilters {
  return {
    themes: filters.themes?.filter(Boolean) as IdeationFilters['themes'],
    categories: filters.categories?.filter(Boolean),
    tags: filters.tags?.filter(Boolean),
    status: filters.status?.filter(Boolean),
    search: filters.search?.slice(0, 200) ?? undefined,
    limit: filters.limit && filters.limit > 0 ? Math.min(filters.limit, 200) : undefined,
    page: filters.page && filters.page > 0 ? filters.page : undefined,
    pageSize: filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 200) : undefined,
  };
}

export async function searchSourcesAction(
  filters: Partial<IdeationFilters>,
): Promise<IdeationSearchResult> {
  const sanitized = sanitizeFilters(filters);
  return searchIdeationSources(sanitized);
}

export async function runAnalysisAction(input: {
  summaries: string[];
  analysisType: 'pattern-discovery' | 'quality-scan' | 'opportunity-scan';
  promptOverride?: string;
}): Promise<Awaited<ReturnType<typeof runIdeationAnalysis>>> {
  return runIdeationAnalysis({
    summaries: input.summaries?.slice(0, 20) ?? [],
    analysisType: input.analysisType,
    promptOverride: input.promptOverride,
  });
}
