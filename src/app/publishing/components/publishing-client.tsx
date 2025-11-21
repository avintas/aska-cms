'use client';

import { useState, useEffect } from 'react';
import ShareableItemCard from './ShareableItemCard';

type ContentType = 'motivational' | 'facts';

interface Stats {
  total: number;
  published: number;
  archived: number;
  unpublished: number;
  publishedSets: number;
}

interface ShareableItem {
  id: number;
  quote?: string;
  fact?: string;
  stat_text?: string;
  author?: string | null;
  context?: string | null;
  status?: string;
  [key: string]: unknown;
}

export default function PublishingClient(): JSX.Element {
  const [contentType, setContentType] = useState<ContentType>('motivational');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [itemCount, setItemCount] = useState<string>('10');
  const [selectedItems, setSelectedItems] = useState<ShareableItem[]>([]);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats when content type changes
  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      setLoadingStats(true);
      try {
        const response = await fetch(`/api/shareables/stats?type=${contentType}`);
        const data = await response.json();

        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [contentType]);

  const handleGenerateRandom = async (): Promise<void> => {
    setLoadingRandom(true);
    setError(null);
    setSelectedItems([]);

    const count = parseInt(itemCount, 10);
    if (isNaN(count) || count <= 0) {
      setError('Please enter a valid number of items');
      setLoadingRandom(false);
      return;
    }

    try {
      const response = await fetch('/api/shareables/random', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          count: count,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate random set');
      }

      setSelectedItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoadingRandom(false);
    }
  };

  const handleStatusChange = (id: number, newStatus: string): void => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
    );
    // Note: Stats will be refreshed when component re-renders or user changes content type
  };

  const fetchRandomReplacement = async (excludeIds: number[]): Promise<ShareableItem | null> => {
    try {
      const response = await fetch('/api/shareables/random', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          count: 1,
          exclude_ids: excludeIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.items || data.items.length === 0) {
        return null;
      }

      return data.items[0] as ShareableItem;
    } catch (err) {
      console.error('Failed to fetch replacement item:', err);
      return null;
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    const currentIds = selectedItems.map((item) => item.id);
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));

    // Automatically fetch a replacement
    const replacement = await fetchRandomReplacement(currentIds.filter((itemId) => itemId !== id));
    if (replacement) {
      setSelectedItems((prev) => [...prev, replacement]);
    }
  };

  const handleRemoveFromSet = async (id: number): Promise<void> => {
    const currentIds = selectedItems.map((item) => item.id);
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));

    // Automatically fetch a replacement
    const replacement = await fetchRandomReplacement(currentIds.filter((itemId) => itemId !== id));
    if (replacement) {
      setSelectedItems((prev) => [...prev, replacement]);
    }
  };

  const handlePublishSet = async (): Promise<void> => {
    if (selectedItems.length === 0) {
      setError('No items in set to publish');
      return;
    }

    setLoadingRandom(true);
    setError(null);

    try {
      // First, create a published set record
      console.log('Publishing set with items:', selectedItems.length);
      const publishSetResponse = await fetch('/api/shareables/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          items: selectedItems,
          status: 'published',
        }),
      });

      const publishSetData = await publishSetResponse.json();
      console.log('Publish set response:', publishSetData);

      if (!publishSetResponse.ok || !publishSetData.success) {
        console.error('Failed to create published set:', publishSetData);
        throw new Error(publishSetData.error || 'Failed to create published set');
      }

      console.log('Published set created successfully with ID:', publishSetData.id);

      // Then, update individual items to published status
      const publishPromises = selectedItems.map((item) => {
        const apiEndpoint =
          contentType === 'motivational' ? `/api/motivational/${item.id}` : `/api/facts/${item.id}`;
        return fetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        });
      });

      const results = await Promise.all(publishPromises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to publish ${failed.length} item(s)`);
      }

      // Clear selected items after successful publish
      setSelectedItems([]);

      // Refresh stats
      const statsResponse = await fetch(`/api/shareables/stats?type=${contentType}`);
      const statsData = await statsResponse.json();
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish set');
    } finally {
      setLoadingRandom(false);
    }
  };

  const handleRegenerate = async (): Promise<void> => {
    // Clear current selection and generate new set
    setSelectedItems([]);
    await handleGenerateRandom();
  };

  return (
    <div className="space-y-6">
      {/* Eyebrow */}
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Operations
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Publishing</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create and manage published shareable collections for your content.
        </p>
      </div>

      {/* Content Type Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label
          htmlFor="content-type"
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          Content Type
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Select the type of content to manage
        </p>
        <select
          id="content-type"
          value={contentType}
          onChange={(e) => setContentType(e.target.value as ContentType)}
          className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="motivational">Motivational</option>
          <option value="facts">Facts</option>
        </select>
      </div>

      {/* Stats Panel */}
      {contentType && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {contentType === 'motivational' ? 'Motivational' : 'Facts'} Statistics
            </div>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="h-6 w-6 animate-spin text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Total Records */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Records
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.total}
                </div>
              </div>

              {/* Published */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Published
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {stats.published}
                </div>
              </div>

              {/* Unpublished */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Unpublished
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {stats.unpublished}
                </div>
              </div>

              {/* Archived */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Archived
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.archived}
                </div>
              </div>

              {/* Published Sets */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Published Sets
                </div>
                <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.publishedSets || 0}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-sm text-slate-500 dark:text-slate-400">
              No statistics available
            </div>
          )}
        </div>
      )}

      {/* Random Set Generator */}
      {contentType && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Generate Random Set
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label
                htmlFor="item-count"
                className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Number of Items
              </label>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                How many items to include in the set
              </p>
              <input
                type="number"
                id="item-count"
                value={itemCount}
                onChange={(e) => setItemCount(e.target.value)}
                min="1"
                max={stats?.total || 100}
                className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateRandom}
              disabled={loadingRandom || !stats || stats.total === 0}
              className="rounded-lg bg-primary-brand px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-brand/90 focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingRandom ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Set'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Selected Items ({selectedItems.length})
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Review and approve each item in the set
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loadingRandom}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={handlePublishSet}
                disabled={loadingRandom}
                className="rounded-lg bg-primary-brand px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-brand/90 focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingRandom ? 'Publishing...' : 'Publish Set'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {selectedItems.map((item) => (
              <ShareableItemCard
                key={item.id}
                item={item}
                contentType={contentType}
                onStatusChange={(id, newStatus) => {
                  handleStatusChange(id, newStatus);
                  // If archived, remove from set
                  if (newStatus === 'archived') {
                    handleRemoveFromSet(id);
                  }
                }}
                onDelete={(id) => {
                  handleDelete(id);
                  handleRemoveFromSet(id);
                }}
                onRemove={handleRemoveFromSet}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
