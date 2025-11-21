'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import type {
  IdeationSourceSummary,
  IdeationThemeStat,
} from '@/lib/ideation';
import { SecondaryButton, TextInput } from '@/components/ui/FormKit';
import SourceCard from './SourceCard';

interface ContentBrowserProps {
  themeStats: IdeationThemeStat[];
  initialSources: IdeationSourceSummary[];
  initialTotal: number;
}

interface BrowserFilters {
  themes: string[];
  search: string;
}

export default function ContentBrowser({
  themeStats: initialThemeStats,
  initialSources,
  initialTotal,
}: ContentBrowserProps): JSX.Element {
  const [filters, setFilters] = useState<BrowserFilters>({ themes: [], search: '' });
  const [sources, setSources] = useState<IdeationSourceSummary[]>(initialSources);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [themeStats, setThemeStats] = useState<IdeationThemeStat[]>(initialThemeStats);
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  // Fetch theme stats
  const fetchThemeStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/content-browser?stats=themes`);
      const result = await response.json();
      if (result.success && result.stats) {
        setThemeStats(result.stats);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch theme stats:', error);
    }
  }, []);

  // Fetch sources with filters and pagination
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
      });

      if (filters.themes.length > 0) {
        // Use pipe delimiter to avoid issues with commas in theme names
        params.append('themes', filters.themes.join('|'));
      }
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      const response = await fetch(`/api/content-browser?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setSources(result.data || []);
        setTotal(result.count || 0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Initial fetch for stats (optional - can refresh periodically)
  useEffect(() => {
    // Optionally refresh stats periodically or on mount
    // fetchThemeStats();
  }, [fetchThemeStats]);

  // Fetch content when filters or page changes
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.themes, filters.search]);

  // Validate and adjust currentPage when total changes
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(total / pageSize);
    if (calculatedTotalPages > 0 && currentPage > calculatedTotalPages) {
      setCurrentPage(calculatedTotalPages);
    } else if (calculatedTotalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [total, pageSize, currentPage]);

  const toggleTheme = (theme: string): void => {
    setFilters((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme],
    }));
    setCurrentPage(1);
  };

  const clearFilters = (): void => {
    setFilters({ themes: [], search: '' });
    setCurrentPage(1);
  };

  const goToPage = (page: number): void => {
    const calculatedTotalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
    if (page >= 1 && page <= calculatedTotalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const paginationItems = useMemo(() => buildPaginationWindow(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Filters
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Content Browser
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Inspect processed sources, refine by theme, and gather inspiration for new plans.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:w-80">
            <TextInput
              placeholder="Search titles…"
              value={filters.search}
              onChange={(event) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, search: value }));
                setCurrentPage(1);
              }}
            />
            <SecondaryButton
              type="button"
              onClick={clearFilters}
              disabled={!filters.search && !filters.themes.length}
            >
              Clear filters
            </SecondaryButton>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Themes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {themeStats.map((stat) => {
              const isActive = filters.themes.includes(stat.theme);
              const hasContent = stat.totalSources > 0;
              return (
                <button
                  key={stat.theme}
                  type="button"
                  onClick={() => toggleTheme(stat.theme)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'border-primary-brand bg-primary-brand/10 text-primary-brand'
                      : hasContent
                        ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-brand/40 hover:text-primary-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'border-slate-200 bg-slate-50/50 text-slate-400 hover:border-slate-300 hover:text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500 dark:hover:text-slate-400'
                  }`}
                  title={!hasContent ? 'No content yet - click to filter' : undefined}
                >
                  {stat.theme} · {stat.totalSources}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Results
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {loading ? 'Loading…' : `${total.toLocaleString()} sources`}
            </h2>
          </div>
        </header>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
              No sources match your filters.
            </div>
          ) : (
            sources.map((source) => <SourceCard key={source.id} source={source} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing page {currentPage} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </button>
              {paginationItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      item === currentPage
                        ? 'bg-primary-brand text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:border-primary-brand/40 hover:text-primary-brand dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => goToPage(item)}
                    disabled={item === currentPage || loading}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function buildPaginationWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(2);
  pages.add(total - 1);
  pages.add(total);
  pages.add(current - 1);
  pages.add(current);
  pages.add(current + 1);

  const sorted = Array.from(pages)
    .filter((num) => num >= 1 && num <= total)
    .sort((a, b) => a - b);

  const result: Array<number | 'ellipsis'> = [];
  let previous = 0;

  for (const num of sorted) {
    if (previous && num - previous > 1) {
      result.push('ellipsis');
    }
    result.push(num);
    previous = num;
  }

  return result;
}
