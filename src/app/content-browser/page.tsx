'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  IdeationSourceSummary,
  IdeationThemeStat,
} from '@/lib/ideation';
import ContentBrowser from '@/components/ideation/ContentBrowser';

export default function ContentBrowserPage(): JSX.Element {
  const [themeStats, setThemeStats] = useState<IdeationThemeStat[]>([]);
  const [initialSources, setInitialSources] = useState<IdeationSourceSummary[]>([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [themesResponse, sourcesResponse] = await Promise.all([
        fetch('/api/content-browser?stats=themes'),
        fetch('/api/content-browser?limit=5&offset=0'),
      ]);

      const themesResult = await themesResponse.json();
      const sourcesResult = await sourcesResponse.json();

      if (themesResult.success && themesResult.stats) {
        setThemeStats(themesResult.stats);
      }
      if (sourcesResult.success) {
        setInitialSources(sourcesResult.data || []);
        setInitialTotal(sourcesResult.count || 0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ContentBrowser
        themeStats={themeStats}
        initialSources={initialSources}
        initialTotal={initialTotal}
      />
    </div>
  );
}

