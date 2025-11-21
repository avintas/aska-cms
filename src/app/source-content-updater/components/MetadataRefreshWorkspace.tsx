'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  fetchNextSourceAction,
  regenerateMetadataAction,
  saveMetadataAction,
  skipSourceAction,
  deleteSourceAction,
  getStatsAction,
  type SourceContentItem,
  type SourceContentStats,
  type RegenerateMetadataResult,
} from '../actions';
import { FormCard, PrimaryButton, SecondaryButton, SectionCard, TextArea } from '@/components/ui/FormKit';
import type { ExtractedMetadata } from '@/lib/sourcing/validators';

interface MetadataRefreshWorkspaceProps {
  initialStats: SourceContentStats;
}

export default function MetadataRefreshWorkspace({
  initialStats,
}: MetadataRefreshWorkspaceProps): JSX.Element {
  const [stats, setStats] = useState<SourceContentStats>(initialStats);
  const [currentSource, setCurrentSource] = useState<SourceContentItem | null>(null);
  const [regeneratedMetadata, setRegeneratedMetadata] = useState<ExtractedMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load first source on mount
  useEffect(() => {
    loadNextSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNextSource = (): void => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setRegeneratedMetadata(null);

    startTransition(() => {
      fetchNextSourceAction().then((result) => {
        setIsLoading(false);
        if (result.success) {
          if (result.data) {
            setCurrentSource(result.data);
          } else {
            setCurrentSource(null);
            setSuccessMessage('All sources have been processed! 🎉');
          }
        } else {
          setError(result.error || 'Failed to load next source');
        }
      });
    });
  };

  const handleRegenerate = (): void => {
    if (!currentSource) return;

    setIsRegenerating(true);
    setError(null);
    setRegeneratedMetadata(null);

    startTransition(() => {
      regenerateMetadataAction(currentSource.id).then((result: RegenerateMetadataResult) => {
        setIsRegenerating(false);
        if (result.success && result.metadata) {
          setRegeneratedMetadata(result.metadata);
        } else {
          setError(result.error || 'Failed to regenerate metadata');
        }
      });
    });
  };

  const handleSave = (): void => {
    if (!currentSource || !regeneratedMetadata) return;

    setIsSaving(true);
    setError(null);

    startTransition(() => {
      saveMetadataAction(currentSource.id, regeneratedMetadata).then((result) => {
        setIsSaving(false);
        if (result.success) {
          setSuccessMessage('Metadata saved successfully!');
          // Refresh stats
          getStatsAction().then((statsResult) => {
            if (statsResult.success && statsResult.data) {
              setStats(statsResult.data);
            }
          });
          // Load next source after a brief delay
          setTimeout(() => {
            loadNextSource();
          }, 1000);
        } else {
          setError(result.error || 'Failed to save metadata');
        }
      });
    });
  };

  const handleSkip = (): void => {
    if (!currentSource) return;

    setIsSaving(true);
    setError(null);

    startTransition(() => {
      skipSourceAction(currentSource.id).then((result) => {
        setIsSaving(false);
        if (result.success) {
          setSuccessMessage('Source skipped');
          // Refresh stats
          getStatsAction().then((statsResult) => {
            if (statsResult.success && statsResult.data) {
              setStats(statsResult.data);
            }
          });
          // Load next source
          setTimeout(() => {
            loadNextSource();
          }, 500);
        } else {
          setError(result.error || 'Failed to skip source');
        }
      });
    });
  };

  const handleDelete = (): void => {
    if (!currentSource) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete source #${currentSource.id}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    startTransition(() => {
      deleteSourceAction(currentSource.id).then((result) => {
        setIsDeleting(false);
        if (result.success) {
          setSuccessMessage('Source deleted successfully');
          // Refresh stats
          getStatsAction().then((statsResult) => {
            if (statsResult.success && statsResult.data) {
              setStats(statsResult.data);
            }
          });
          // Load next source
          setTimeout(() => {
            loadNextSource();
          }, 500);
        } else {
          setError(result.error || 'Failed to delete source');
        }
      });
    });
  };

  const isProcessing = isLoading || isRegenerating || isSaving || isDeleting || isPending;

  return (
    <div className="space-y-6">
      {/* Container 1: Progress Tracker */}
      <SectionCard
        eyebrow="Source Content Updater"
        title="Refresh Source Metadata"
        description="Manually refresh metadata (theme, tags, category, summary) for ingested sources using updated Gemini prompts. Process one source at a time with confirmation."
      >
        <div className="mt-6 flex items-center gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Progress
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {stats.processed} / {stats.total}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.remaining} remaining
            </p>
          </div>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-primary-brand transition-all duration-300"
                style={{ width: `${stats.total > 0 ? (stats.processed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          <p className="font-semibold">Success</p>
          <p>{successMessage}</p>
        </div>
      )}

      {isLoading && !currentSource ? (
        <FormCard>
          <div className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">Loading next source...</p>
          </div>
        </FormCard>
      ) : currentSource ? (
        <>
          {/* Container 2: Regenerated Metadata */}
          <SectionCard
            eyebrow="Regenerated Metadata"
            title={regeneratedMetadata ? 'New AI-Generated Values' : 'Awaiting Regeneration'}
            description={
              regeneratedMetadata
                ? 'Review the regenerated metadata below. Changes are highlighted in blue.'
                : 'Click "Regenerate Metadata" to generate new metadata using Gemini.'
            }
          >
            {regeneratedMetadata ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Theme</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                      <span
                        className={
                          regeneratedMetadata.theme !== currentSource.theme
                            ? 'font-semibold text-primary-brand'
                            : ''
                        }
                      >
                        {regeneratedMetadata.theme}
                      </span>
                      {regeneratedMetadata.theme !== currentSource.theme && (
                        <span className="ml-2 text-xs text-slate-500">
                          (was: {currentSource.theme || 'none'})
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                      <span
                        className={
                          regeneratedMetadata.category !== currentSource.category
                            ? 'font-semibold text-primary-brand'
                            : ''
                        }
                      >
                        {regeneratedMetadata.category || (
                          <span className="text-slate-400">Not set</span>
                        )}
                      </span>
                      {regeneratedMetadata.category !== currentSource.category && (
                        <span className="ml-2 text-xs text-slate-500">
                          (was: {currentSource.category || 'none'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {regeneratedMetadata.tags.length > 0 ? (
                      regeneratedMetadata.tags.map((tag) => {
                        const isNew = !currentSource.tags.includes(tag);
                        return (
                          <span
                            key={tag}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isNew
                                ? 'bg-primary-brand/10 text-primary-brand'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {tag}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-slate-400">No tags</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Summary</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {regeneratedMetadata.summary}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <SecondaryButton
                    onClick={() => setRegeneratedMetadata(null)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton onClick={handleSave} disabled={isProcessing} className="flex-1">
                    {isSaving ? 'Saving...' : 'Save & Load Next'}
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex gap-3">
                  <PrimaryButton
                    onClick={handleRegenerate}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Metadata'}
                  </PrimaryButton>
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <SecondaryButton onClick={handleSkip} disabled={isProcessing}>
                    Skip
                  </SecondaryButton>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Container 3: Current Source Details */}
          <FormCard>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                Current Source
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {currentSource.title || `Source #${currentSource.id}`}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 border-t border-slate-200 pt-6 dark:border-slate-700 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Theme</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {currentSource.theme || <span className="text-slate-400">Not set</span>}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {currentSource.category || <span className="text-slate-400">Not set</span>}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentSource.tags.length > 0 ? (
                    currentSource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No tags</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Summary</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {currentSource.summary || <span className="text-slate-400">No summary</span>}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Content Text
                </p>
                <TextArea
                  value={currentSource.content_text}
                  readOnly
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </FormCard>
        </>
      ) : (
        <FormCard>
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              All sources processed!
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              All {stats.total} sources have been refreshed.
            </p>
          </div>
        </FormCard>
      )}
    </div>
  );
}
