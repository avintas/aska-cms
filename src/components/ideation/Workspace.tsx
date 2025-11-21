'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type {
  CollectionInventoryCounts,
  IdeationSourceSummary,
  IdeationTagStat,
  IdeationThemeOverview,
  IdeationThemeStat,
  IdeationTheme,
} from '@/lib/ideation';
import { searchSourcesAction } from '@/app/ideation/actions';
import { MetricCard } from '@/components/ui/CollectionList';

interface IdeationWorkspaceProps {
  themeStats: IdeationThemeStat[];
  tags: IdeationTagStat[];
  overview: IdeationThemeOverview[];
  initialSources: IdeationSourceSummary[];
  collectionCounts: CollectionInventoryCounts;
}

export default function IdeationWorkspace({
  themeStats,
  tags,
  overview,
  initialSources,
  collectionCounts,
}: IdeationWorkspaceProps): JSX.Element {
  const [filters, setFilters] = useState({ themes: [] as string[] });
  const [sources, setSources] = useState<IdeationSourceSummary[]>(initialSources);
  const [isPending, startTransition] = useTransition();
  const firstRunRef = useRef(true);

  const toggleTheme = (theme: string): void => {
    setFilters((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme],
    }));
  };

  const activeTheme = filters.themes[0] ?? null;
  const activeCategories = useMemo(() => {
    if (!activeTheme) return [];
    const overviewEntry = overview.find((item) => item.theme === activeTheme);
    return overviewEntry?.categories ?? [];
  }, [activeTheme, overview]);

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    let cancelled = false;
    startTransition(() => {
      searchSourcesAction({
        themes: filters.themes as IdeationTheme[],
        pageSize: 12,
        page: 1,
      }).then((result) => {
        if (cancelled) return;
        setSources(result.items);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [filters.themes, startTransition]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Wisdom" value={collectionCounts.wisdom} tone="neutral" note="Penalty Box insights" />
          <MetricCard label="Greetings" value={collectionCounts.greetings} tone="positive" note="H.U.G.s banked" />
          <MetricCard label="Motivational" value={collectionCounts.motivational} tone="warning" note="Locker-room ammo" />
          <MetricCard label="Facts" value={collectionCounts.facts} tone="neutral" note="Verified hockey facts" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Trivia: Multiple Choice" value={collectionCounts.triviaMultipleChoice} tone="neutral" note="4-option bench quizzes" />
          <MetricCard label="Trivia: True/False" value={collectionCounts.triviaTrueFalse} tone="neutral" note="Rapid-fire statements" />
          <MetricCard label="Trivia: Who Am I?" value={collectionCounts.triviaWhoAmI} tone="neutral" note="Riddle reveals" />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                Theme Overview
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Content Landscape</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Select a theme to filter results
            </span>
          </header>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {themeStats.map((stat) => {
              const isActive = filters.themes.includes(stat.theme);
              const draftCount = stat.totalSources - stat.publishedSources;
              return (
                <button
                  key={stat.theme}
                  type="button"
                  onClick={() => toggleTheme(stat.theme)}
                  className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70 ${
                    isActive
                      ? 'border-primary-brand/70 bg-primary-brand/10 text-primary-brand'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{stat.theme}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {stat.totalSources.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {stat.publishedSources.toLocaleString()} publish-ready
                    </p>
                    {draftCount > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {draftCount.toLocaleString()} draft{draftCount === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {activeCategories.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Categories in {activeTheme}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeCategories.map((category) => (
                  <span
                    key={category.category}
                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                  >
                    {category.category} · {category.total}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Catalog</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Ingested Sources</h2>
          <p className="mt-3 text-3xl font-semibold text-primary-brand">{collectionCounts.sources.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Total normalized pieces ready for ideation. Jump into the browser to explore and tag new candidates.
          </p>
          <Link
            href="/content-browser"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-brand/60 bg-primary-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-brand/90"
          >
            Browse sources
          </Link>
        </section>
      </aside>
    </div>
  );
}
