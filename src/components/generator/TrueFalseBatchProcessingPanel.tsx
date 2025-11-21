'use client';

import { useEffect, useState, useTransition } from 'react';
import { FormCard, PrimaryButton, SecondaryButton, SectionCard } from '@/components/ui/FormKit';
import {
  batchGenerateTrueFalseAction,
  getUnprocessedSourcesCountForTrueFalse,
  type BatchProcessResult,
  type UnprocessedSourcesCount,
} from '@/app/main-generator/actions';

export default function TrueFalseBatchProcessingPanel(): JSX.Element {
  const [count, setCount] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchProcessResult | null>(null);
  const [sourcesCount, setSourcesCount] = useState<UnprocessedSourcesCount | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Fetch available sources count on mount and after processing
  useEffect(() => {
    const fetchCount = async (): Promise<void> => {
      setIsLoadingCount(true);
      try {
        const countData = await getUnprocessedSourcesCountForTrueFalse();
        setSourcesCount(countData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch sources count:', error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchCount();
  }, []);

  // Refresh count after processing completes
  useEffect(() => {
    if (result && !isProcessing) {
      const refreshCount = async (): Promise<void> => {
        try {
          const countData = await getUnprocessedSourcesCountForTrueFalse();
          setSourcesCount(countData);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to refresh sources count:', error);
        }
      };
      refreshCount();
    }
  }, [result, isProcessing]);

  const handleStartProcessing = (): void => {
    if (isProcessing || count < 1) return;

    setIsProcessing(true);
    setResult(null);

    startTransition(() => {
      batchGenerateTrueFalseAction(count).then((batchResult) => {
        setIsProcessing(false);
        setResult(batchResult);
      });
    });
  };

  const isDisabled =
    isProcessing || isPending || count < 1 || (sourcesCount !== null && sourcesCount.available === 0);

  return (
    <SectionCard
      eyebrow="Automated Processing"
      title="Batch Generate True/False Trivia"
      description="Process multiple source content pieces sequentially to generate true/false trivia questions. Each source is processed one-by-one with a 2-second cooldown between requests."
      collapsible={true}
    >
      <div className="mt-6 space-y-6">
        {/* Available Sources Indicator */}
        {sourcesCount !== null && (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary-brand/10 via-primary-brand/5 to-transparent px-6 py-4 dark:border-slate-800 dark:from-primary-brand/20 dark:via-primary-brand/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Available Sources
                </p>
                <p className="mt-1 text-3xl font-bold text-primary-brand">
                  {isLoadingCount ? '...' : sourcesCount.available.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {sourcesCount.total > 0 && (
                    <>
                      out of {sourcesCount.total.toLocaleString()} total active sources
                    </>
                  )}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-brand/20 dark:bg-primary-brand/30">
                <svg
                  className="h-8 w-8 text-primary-brand"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="process-count-true-false"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Number of Sources to Process
              </label>
              {sourcesCount !== null && sourcesCount.available > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Max: {sourcesCount.available}
                </span>
              )}
            </div>
            <input
              id="process-count-true-false"
              type="number"
              min="1"
              max={sourcesCount?.available ?? 100}
              value={count}
              onChange={(e) => {
                const newCount = Number.parseInt(e.target.value, 10) || 1;
                const maxCount = sourcesCount?.available ?? 100;
                setCount(Math.min(newCount, maxCount));
              }}
              disabled={isDisabled}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-primary-brand focus:outline-none focus:ring focus:ring-primary-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-primary-brand"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Process sources sequentially, one at a time. Each source will be skipped if already
              processed for true/false trivia.
            </p>
            {sourcesCount !== null && sourcesCount.available === 0 && (
              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                ⚠️ No unprocessed sources available. All active sources have been processed for
                true/false trivia.
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-3">
          <PrimaryButton onClick={handleStartProcessing} disabled={isDisabled} className="flex-1">
            {isProcessing || isPending ? 'Processing...' : `Start Processing ${count} Source(s)`}
          </PrimaryButton>
        </div>

        {/* Progress Display */}
        {isProcessing && (
          <div className="rounded-2xl border border-primary-brand/30 bg-primary-brand/5 px-6 py-4">
            <p className="text-sm font-semibold text-primary-brand">Processing...</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Processing sources one-by-one. This may take a few minutes. Please do not close this
              page.
            </p>
          </div>
        )}

        {/* Results Display */}
        {result && !isProcessing && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border px-6 py-4 ${
                result.success
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  result.success
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : 'text-amber-800 dark:text-amber-200'
                }`}
              >
                {result.success ? 'Processing Complete' : 'Processing Finished with Errors'}
              </p>
              <p
                className={`mt-1 text-sm ${
                  result.success
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                {result.message}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Requested
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {result.totalRequested}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Processed
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
                  {result.processed}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-800 dark:bg-rose-900/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                  Failed
                </p>
                <p className="mt-1 text-2xl font-semibold text-rose-800 dark:text-rose-200">
                  {result.failed}
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            {result.results.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-slate-200 px-6 py-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Processing Details
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                  {result.results.map((item, idx) => (
                    <div
                      key={idx}
                      className={`px-6 py-3 ${
                        item.success
                          ? 'bg-white dark:bg-slate-900/70'
                          : 'bg-rose-50 dark:bg-rose-900/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Source #{item.sourceId}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              item.success
                                ? 'text-slate-600 dark:text-slate-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.message}
                          </p>
                        </div>
                        <div className="ml-4">
                          {item.success ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                              ✓ {item.itemCount || 0} items
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                              ✗ Failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

