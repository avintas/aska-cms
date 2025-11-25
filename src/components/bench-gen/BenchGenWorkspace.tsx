'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { FormCard, PrimaryButton, SecondaryButton, SectionCard } from '@/components/ui/FormKit';
import SourceCard from '@/components/ideation/SourceCard';
import {
  generateBenchBossAction,
  analyzeSourceContent,
  getGeneratedBenchBossItems,
  searchSourcesForBenchBoss,
  type BenchBossPrompt,
  type ContentAnalysis,
  type GeneratedMotivateItem,
} from '@/app/bench-gen/actions';
import type { IdeationSourceSummary } from '@/lib/ideation';

interface BenchGenWorkspaceProps {
  prompt: BenchBossPrompt | null;
  initialSources: IdeationSourceSummary[];
  initialTotal: number;
  initialError: string | null;
}

export default function BenchGenWorkspace({
  prompt,
  initialSources,
  initialTotal,
  initialError,
}: BenchGenWorkspaceProps): JSX.Element {
  const [sources, setSources] = useState<IdeationSourceSummary[]>(initialSources);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [systemMessages, setSystemMessages] = useState<string[]>(() => {
    if (initialError) {
      return [`❌ ${initialError}`];
    }
    if (!prompt) {
      return ['⚠️ No Bench Boss prompt found. Please ensure Bench Boss prompt exists in collection_prompts.'];
    }
    return ['✨ Ready to generate Bench Boss directives!'];
  });
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedMotivateItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [justGeneratedSourceId, setJustGeneratedSourceId] = useState<number | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const selectedSource = sources[currentSourceIndex] || null;
  const currentSourceId = selectedSource?.id ?? null;
  const pageSize = 6;

  // Fetch sources with pagination
  const fetchSources = useCallback(async (page: number) => {
    setIsLoadingSources(true);
    try {
      const result = await searchSourcesForBenchBoss({ page, pageSize });
      setSources(result.items);
      setTotal(result.total);
      // Reset index if out of bounds
      if (result.items.length > 0 && currentSourceIndex >= result.items.length) {
        setCurrentSourceIndex(0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch sources:', error);
    } finally {
      setIsLoadingSources(false);
    }
  }, [pageSize, currentSourceIndex]);

  // Fetch sources when page changes
  useEffect(() => {
    if (currentPage !== 1 || sources.length === 0) {
      fetchSources(currentPage);
    }
  }, [currentPage, fetchSources]);


  // Navigate to next source
  const handleNextSource = (): void => {
    if (currentSourceIndex < sources.length - 1) {
      setCurrentSourceIndex((prev) => prev + 1);
    } else if (currentPage < Math.ceil(total / pageSize)) {
      // Load next page
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchSources(nextPage).then(() => {
        setCurrentSourceIndex(0);
      });
    }
  };

  // Navigate to previous source
  const handlePreviousSource = (): void => {
    if (currentSourceIndex > 0) {
      setCurrentSourceIndex((prev) => prev - 1);
    } else if (currentPage > 1) {
      // Load previous page
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchSources(prevPage).then(() => {
        // Set to last item of previous page
        setCurrentSourceIndex(pageSize - 1);
      });
    }
  };

  // Analyze content when source changes
  useEffect(() => {
    if (currentSourceId) {
      setIsAnalyzing(true);
      analyzeSourceContent(currentSourceId).then((result) => {
        setIsAnalyzing(false);
        if (result.success && result.analysis) {
          setContentAnalysis(result.analysis);
        } else {
          setContentAnalysis(null);
        }
      });

      // Load existing generated items (unless we just generated for this source)
      if (currentSourceId !== justGeneratedSourceId) {
        setIsLoadingItems(true);
        getGeneratedBenchBossItems(currentSourceId).then((result) => {
          setIsLoadingItems(false);
          if (result.success && result.items) {
            setGeneratedItems(result.items);
          } else {
            setGeneratedItems([]);
          }
        });
      }
    } else {
      setContentAnalysis(null);
      if (!justGeneratedSourceId) {
        setGeneratedItems([]);
      }
    }
  }, [currentSourceId, justGeneratedSourceId]);

  const handleGenerate = (): void => {
    if (!currentSourceId) {
      setSystemMessages((prev) => [...prev, '⚠️ Please select a source first.']);
      return;
    }

    if (!prompt) {
      setSystemMessages((prev) => [...prev, '❌ No Bench Boss prompt available. Cannot generate.']);
      return;
    }

    setSystemMessages((prev) => [
      ...prev,
      `🚀 Starting Bench Boss generation with source: "${selectedSource?.title || `ID ${currentSourceId}`}"...`,
    ]);

    startTransition(() => {
      generateBenchBossAction(currentSourceId).then((result) => {
        setLastResult(result);
        if (result.success) {
          setSystemMessages((prev) => [
            ...prev,
            `✅ ${result.message}`,
            `📊 Generated ${result.itemCount || 0} directive(s)`,
          ]);

          // Refresh sources to update badges
          setTimeout(() => {
            fetchSources(currentPage);
          }, 500);

          // Mark this source as just generated
          setJustGeneratedSourceId(currentSourceId);

          // Update generated items list
          if (result.generatedItems && result.generatedItems.length > 0) {
            setGeneratedItems(result.generatedItems);
          } else {
            getGeneratedBenchBossItems(currentSourceId).then((itemsResult) => {
              if (itemsResult.success && itemsResult.items) {
                setGeneratedItems(itemsResult.items);
              }
            });
          }
        } else {
          setSystemMessages((prev) => [...prev, `❌ ${result.message}`]);
        }
      });
    });
  };

  const getPromptPreview = (prompt: BenchBossPrompt | null): string => {
    if (!prompt) return 'No prompt available';
    const lines = prompt.prompt_content.split('\n').filter((line) => line.trim());
    return lines.slice(0, 3).join('\n');
  };

  return (
    <div className="space-y-10">
      {/* Main Generator Section */}
      <SectionCard
        eyebrow="THE GAME PLAN"
        title="Bench Boss Gen"
        description="The Head. Strategy, grit, and directives. Generate tough, fair, disciplinarian directives."
        action={
          <div className="flex flex-col items-end gap-2">
            {prompt && (
              <SecondaryButton
                type="button"
                onClick={() => setIsPromptModalOpen(true)}
                className="px-4 py-2 text-sm"
              >
                📋 Review Prompt
              </SecondaryButton>
            )}
            {lastResult?.success && (
              <div className="rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-3 py-2 dark:border-emerald-800 dark:from-emerald-900/30 dark:to-emerald-900/20">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  ✅ {lastResult.message}
                </p>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-8">
          {/* Step 1: Source Selection & Analysis - Two Column Gallery Layout */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-brand/10 text-sm font-bold text-primary-brand">
                1
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Select Source & Analyze
              </h3>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column: Source Gallery with Carousel Controls */}
              <FormCard>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                      📚 Source Gallery
                    </label>
                    {total > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {currentSourceIndex + 1 + (currentPage - 1) * pageSize} of {total}
                      </span>
                    )}
                  </div>

                  {isLoadingSources ? (
                    <div className="flex items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 p-12 dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-center">
                        <div className="mb-2 text-2xl">⏳</div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Loading sources...
                        </p>
                      </div>
                    </div>
                  ) : sources.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No sources available
                      </p>
                    </div>
                  ) : selectedSource ? (
                    <div className="space-y-4">
                      {/* Current Source Display */}
                      <div className="rounded-2xl border-2 border-primary-brand bg-gradient-to-br from-primary-brand/10 to-primary-brand/5 p-6 shadow-lg ring-2 ring-primary-brand ring-offset-2 dark:ring-offset-slate-900">
                        <SourceCard source={selectedSource} />
                        <div className="mt-4 flex items-center justify-center">
                          <span className="rounded-full bg-primary-brand px-4 py-2 text-xs font-bold text-white shadow-sm">
                            ✓ CURRENT SOURCE
                          </span>
                        </div>
                      </div>

                      {/* Carousel Controls */}
                      <div className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={handlePreviousSource}
                          disabled={
                            (currentSourceIndex === 0 && currentPage === 1) ||
                            isLoadingSources ||
                            isPending
                          }
                          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                          <span className="text-lg">←</span>
                          Previous
                        </button>
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-medium">
                            Page {currentPage} / {Math.ceil(total / pageSize)}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-medium">
                            Source {currentSourceIndex + 1} / {sources.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleNextSource}
                          disabled={
                            (currentSourceIndex >= sources.length - 1 &&
                              currentPage >= Math.ceil(total / pageSize)) ||
                            isLoadingSources ||
                            isPending
                          }
                          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                          Next
                          <span className="text-lg">→</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No source selected
                      </p>
                    </div>
                  )}
                </div>
              </FormCard>

              {/* Right Column: Content Analysis + Generate Button */}
              {currentSourceId && (
                <FormCard>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        🔍 Content Analysis
                      </h3>
                      {isAnalyzing ? (
                        <div className="flex items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800">
                          <div className="text-center">
                            <div className="mb-2 text-2xl">⏳</div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              Analyzing content...
                            </p>
                          </div>
                        </div>
                      ) : contentAnalysis ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Extraction Potential:
                              </span>
                              <span
                                className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                                  contentAnalysis.assessment === 'excellent'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : contentAnalysis.assessment === 'good'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                      : contentAnalysis.assessment === 'fair'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                }`}
                              >
                                {contentAnalysis.assessment.toUpperCase()} ({contentAnalysis.extractionScore}/100)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
                                <span className="text-slate-500 dark:text-slate-400">Words:</span>{' '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{contentAnalysis.wordCount}</span>
                              </div>
                              <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
                                <span className="text-slate-500 dark:text-slate-400">Sentences:</span>{' '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{contentAnalysis.sentenceCount}</span>
                              </div>
                              <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
                                <span className="text-slate-500 dark:text-slate-400">Indicators:</span>{' '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{contentAnalysis.wisdomIndicators}</span>
                              </div>
                              <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
                                <span className="text-slate-500 dark:text-slate-400">Avg Length:</span>{' '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{contentAnalysis.averageSentenceLength.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          {contentAnalysis.insights.length > 0 && (
                            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 dark:border-blue-800 dark:from-blue-900/30 dark:to-blue-900/20">
                              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-900 dark:text-blue-200">
                                💡 Insights:
                              </p>
                              <ul className="space-y-1.5 text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                                {contentAnalysis.insights.map((insight, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0">•</span>
                                    <span>{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Unable to analyze content.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <PrimaryButton
                        onClick={handleGenerate}
                        disabled={isPending || !currentSourceId || !prompt}
                        className="w-full px-6 py-3 text-base font-bold shadow-lg transition-all hover:scale-105 disabled:hover:scale-100"
                      >
                        {isPending ? (
                          <>
                            <span className="mr-2 text-lg">⏳</span>
                            Generating...
                          </>
                        ) : (
                          <>
                            <span className="mr-2 text-lg">🏒</span>
                            Generate Bench Boss Directives
                          </>
                        )}
                      </PrimaryButton>
                    </div>
                  </div>
                </FormCard>
              )}
            </div>
          </div>

          {/* Step 2: Generated Items */}
          {currentSourceId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  📝 Generated Directives
                </h3>
                {generatedItems.length > 0 && (
                  <span className="rounded-full bg-primary-brand/20 px-4 py-1.5 text-sm font-bold text-primary-brand">
                    {generatedItems.length} {generatedItems.length === 1 ? 'directive' : 'directives'}
                  </span>
                )}
              </div>
              {isLoadingItems ? (
                <div className="flex items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 p-12 dark:border-slate-700 dark:bg-slate-800">
                  <div className="text-center">
                    <div className="mb-2 text-3xl">⏳</div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Loading items...
                    </p>
                  </div>
                </div>
              ) : generatedItems.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No directives generated yet. Click "Generate Bench Boss Directives" to create some!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {generatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all hover:border-primary-brand/50 hover:shadow-lg dark:border-slate-700 dark:from-slate-900 dark:to-slate-800"
                    >
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed font-semibold text-slate-700 dark:text-slate-300">
                          "{item.quote}"
                        </p>
                        {item.attribution && (
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              — {item.attribution}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && (
                            <span className="rounded-full bg-primary-brand/20 px-3 py-1 text-xs font-semibold text-primary-brand">
                              {item.category}
                            </span>
                          )}
                          {item.theme && (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {item.theme}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </SectionCard>

      {/* Prompt Review Modal */}
      {prompt && (
        <PromptReviewModal
          open={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          prompt={prompt}
        />
      )}
    </div>
  );
}

function PromptReviewModal({
  open,
  onClose,
  prompt,
}: {
  open: boolean;
  onClose: () => void;
  prompt: BenchBossPrompt;
}): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus management
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
        className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950/90"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-brand/20 text-2xl">
              🏒
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                Prompt Review
              </p>
              <h2 id="prompt-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {prompt.prompt_name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                The Head. Strategy, grit, and directives.
              </p>
            </div>
          </div>
          <SecondaryButton type="button" onClick={onClose} className="px-3">
            Close
          </SecondaryButton>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              {prompt.prompt_content}
            </pre>
          </div>
        </div>
        <footer className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex justify-end">
            <SecondaryButton type="button" onClick={onClose} className="px-4">
              Close
            </SecondaryButton>
          </div>
        </footer>
      </div>
    </div>
  );
}

