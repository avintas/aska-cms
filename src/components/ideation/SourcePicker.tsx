'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { IdeationSourceSummary, IdeationTagStat, IdeationThemeStat, IdeationTheme } from '@/lib/ideation';
import { searchSourcesAction } from '@/app/ideation/actions';
import { SecondaryButton, TextInput } from '@/components/ui/FormKit';

interface SourcePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (source: IdeationSourceSummary) => void;
  themeStats: IdeationThemeStat[];
  tags: IdeationTagStat[];
  initialSources: IdeationSourceSummary[];
  initialTotal: number;
}

interface SourcePickerFilters {
  themes: string[];
  search: string;
}

export default function SourcePicker({
  open,
  onClose,
  onSelect,
  themeStats,
  tags,
  initialSources,
  initialTotal,
}: SourcePickerProps): JSX.Element | null {
  const [filters, setFilters] = useState<SourcePickerFilters>({ themes: [], search: '' });
  const [sources, setSources] = useState<IdeationSourceSummary[]>(initialSources);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const firstRun = useRef(true);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const pageSize = 6;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!open) return;

    let cancelled = false;
    startTransition((): void => {
      searchSourcesAction({
        themes: filters.themes as IdeationTheme[],
        search: filters.search,
        page,
        pageSize,
      }).then((result) => {
        if (cancelled) return;
        setSources(result.items);
        setTotal(result.total);
      });
    });

    return (): void => {
      cancelled = true;
    };
  }, [filters.themes, filters.search, open, page, pageSize]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelector<HTMLElement>('button,input,textarea,select,a[href]');
      focusable?.focus();
    }
  }, [open]);

  const toggleTheme = (theme: string): void => {
    setFilters((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme) ? prev.themes.filter((t) => t !== theme) : [...prev.themes, theme],
    }));
    setPage(1);
  };

  const clearFilters = (): void => {
    setFilters({ themes: [], search: '' });
    setPage(1);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950/90"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Source Picker
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Stage a source for Main Generator</h2>
          </div>
          <div className="flex items-center gap-2">
            <SecondaryButton type="button" onClick={clearFilters} className="px-3">
              Clear filters
            </SecondaryButton>
            <SecondaryButton type="button" onClick={onClose} className="px-3">
              Close
            </SecondaryButton>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="w-full max-w-sm border-b border-slate-200 bg-slate-50/40 p-6 dark:border-slate-800 dark:bg-slate-950/60 lg:h-full lg:border-b-0 lg:border-r lg:p-6">
            <div className="space-y-6">
              <div>
                <TextInput
                  placeholder="Search titles…"
                  value={filters.search}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, search: event.target.value }));
                    setPage(1);
                  }}
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Filters apply instantly. Showing {sources.length} of {total.toLocaleString()} results.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  Themes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {themeStats.map((stat) => {
                    const isActive = filters.themes.includes(stat.theme);
                    return (
                      <button
                        key={stat.theme}
                        type="button"
                        onClick={() => toggleTheme(stat.theme)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? 'border-primary-brand bg-primary-brand/10 text-primary-brand'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary-brand/40 hover:text-primary-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {stat.theme} · {stat.totalSources}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => {
                    onSelect(source);
                    onClose();
                  }}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary-brand/50 hover:bg-primary-brand/5 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/60 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{source.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center rounded-full bg-primary-brand/10 px-2 py-0.5 font-semibold text-primary-brand">
                            {source.theme}
                          </span>
                          {source.category && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                              {source.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {new Date(source.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{source.summary}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {source.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {source.tags.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                          +{source.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
                      {(source.usage ?? []).length === 0 ? (
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          Unused
                        </span>
                      ) : (
                        (source.usage ?? []).map((usage) => (
                          <span
                            key={usage}
                            className="rounded-full border border-primary-brand/40 px-2 py-0.5 text-primary-brand dark:border-primary-brand/60"
                          >
                            {usage}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {sources.length === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                {isPending ? 'Searching…' : 'No sources match your filters yet.'}
              </div>
            )}
          </main>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
          <p>
            Showing page {page} of {totalPages} ({total.toLocaleString()} total)
          </p>
          <div className="flex items-center gap-2">
            <SecondaryButton
              type="button"
              className="px-3"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || isPending}
            >
              Previous
            </SecondaryButton>
            <SecondaryButton
              type="button"
              className="px-3"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || isPending}
            >
              Next
            </SecondaryButton>
          </div>
        </footer>
      </div>
    </div>
  );
}


