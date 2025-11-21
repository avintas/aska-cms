'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Stat } from '@aska/shared';
import StatCard from '@/components/stats/StatCard';

type StatusFilter = 'unpublished' | 'published' | 'archived';

export default function StatsListPage(): JSX.Element {
  const [items, setItems] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unpublished');
  const [stats, setStats] = useState({
    unpublished: 0,
    published: 0,
    archived: 0,
  });
  const limit = 5;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/stats?stats=true`);
      const result = await response.json();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const response = await fetch(
        `/api/stats?limit=${limit}&offset=${offset}&status=${statusFilter}`,
      );
      const result = await response.json();

      if (result.success) {
        setItems(result.data || []);
        setTotal(result.count || 0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch stats content:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Validate and adjust currentPage when totalPages changes (e.g., after deletions)
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(total / limit);
    if (calculatedTotalPages > 0 && currentPage > calculatedTotalPages) {
      // If current page is beyond total pages, go to last valid page
      setCurrentPage(calculatedTotalPages);
    } else if (calculatedTotalPages === 0 && currentPage > 1) {
      // If no items but we're not on page 1, reset to page 1
      setCurrentPage(1);
    }
  }, [total, limit, currentPage]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStatusChange = (id: number, _newStatus: string): void => {
    // Optimistically remove from current list
    const remainingItems = items.filter((item) => item.id !== id);
    setItems(remainingItems);

    // Decrease total - useEffect will handle page adjustment if needed
    setTotal((prev) => prev - 1);

    // Refresh stats
    fetchStats();
  };

  const handleDelete = (id: number): void => {
    // Optimistically remove from current list
    const remainingItems = items.filter((item) => item.id !== id);
    setItems(remainingItems);

    // Decrease total - useEffect will handle page adjustment if needed
    setTotal((prev) => prev - 1);

    // Refresh stats
    fetchStats();
  };

  const goToPage = (page: number): void => {
    const calculatedTotalPages = total > 0 ? Math.ceil(total / limit) : 0;
    if (page >= 1 && page <= calculatedTotalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusLabel = (status: StatusFilter): string => {
    if (status === 'unpublished') return 'Unpublished';
    if (status === 'published') return 'Published';
    return 'Archived';
  };

  const totalStats = stats.unpublished + stats.published + stats.archived;

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stats Library</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Package milestones, records, and comparisons into bite-sized hockey stat facts ready
              for sharing across the community.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Stats badges - inspired by Flow design */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{totalStats} total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500">●</span>
                <span className="font-medium">{stats.published} published</span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Hello
            </button>
          </div>
        </section>

        {/* Filter Buttons */}
        <section className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
          <button
            onClick={() => setStatusFilter('unpublished')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === 'unpublished'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Unpublished
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === 'published'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === 'archived'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Archived
          </button>
        </section>

        {/* Stats List - Card Container */}
        <section className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-gray-500 dark:text-gray-400">
                No {getStatusLabel(statusFilter).toLowerCase()} stats found.
              </p>
            </div>
          ) : (
            <>
              {items.map((stat) => (
                <StatCard
                  key={stat.id}
                  stat={stat}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 rounded-lg dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span>{' '}
                        to{' '}
                        <span className="font-medium">{Math.min(currentPage * limit, total)}</span>{' '}
                        of <span className="font-medium">{total}</span>{' '}
                        {getStatusLabel(statusFilter).toLowerCase()} items
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-slate-700 dark:hover:bg-slate-800"
                        >
                          <span className="sr-only">Previous</span>
                          <span className="text-sm">‹</span>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === currentPage
                                ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-slate-700 dark:hover:bg-slate-800"
                        >
                          <span className="sr-only">Next</span>
                          <span className="text-sm">›</span>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
