'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getUnpublishedQuestions,
  getUnpublishedStats,
  scanImproperQuestions,
  archiveAllImproperAction,
  publishAllProperAction,
  batchClassifyQuestionsAction,
  batchProcessClassificationsAction,
  classifyQuestionAction,
  updateQuestionStatusAction,
  archiveQuestionAction,
  bulkArchiveQuestionsAction,
  type ClassificationResult,
  type TriviaQuestionWithSource,
} from '../actions';
import { FormCard, PrimaryButton, SecondaryButton, SectionCard } from '@/components/ui/FormKit';

interface TriviaSelectorWorkspaceProps {
  initialStats: { total: number };
}

export default function TriviaSelectorWorkspace({
  initialStats,
}: TriviaSelectorWorkspaceProps): JSX.Element {
  const [stats, setStats] = useState(initialStats);
  const [questions, setQuestions] = useState<TriviaQuestionWithSource[]>([]);
  const [classifications, setClassifications] = useState<Map<number, ClassificationResult>>(
    new Map(),
  );
  const [classifyCount, setClassifyCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<{
    total: number;
    improper: number;
    proper: number;
    ambiguous: number;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestions = (): void => {
    setIsLoading(true);
    setError(null);

    startTransition(() => {
      getUnpublishedQuestions().then((result) => {
        setIsLoading(false);
        if (result.success && result.data) {
          setQuestions(result.data);
        } else {
          setError(result.error || 'Failed to load questions');
        }
      });
    });
  };

  const handleBatchClassify = (): void => {
    if (questions.length === 0) return;

    setIsClassifying(true);
    setError(null);
    setSuccessMessage(null);
    setClassifications(new Map());

    // Take only the specified count of questions
    const questionsToClassify = questions.slice(0, classifyCount);
    const questionIds = questionsToClassify.map((q) => q.id);

    startTransition(() => {
      batchClassifyQuestionsAction(questionIds).then((result) => {
        setIsClassifying(false);
        // Always store classifications, even if some failed
        const classificationMap = new Map<number, ClassificationResult>();
        result.results.forEach((r) => {
          classificationMap.set(r.questionId, r);
        });
        setClassifications(classificationMap);

        if (result.success) {
          setSuccessMessage(result.message);
          setError(null);
        } else {
          // Show detailed error message
          const errorDetails = result.results
            .filter((r) => !r.success && r.error)
            .map((r) => `Question #${r.questionId}: ${r.error}`)
            .join('\n');
          setError(
            `Classification completed with ${result.failed} failure(s). ${result.message}${
              errorDetails ? `\n\nErrors:\n${errorDetails}` : ''
            }`,
          );
          // Still show success message for successful classifications
          if (result.processed > result.failed) {
            setSuccessMessage(
              `Successfully classified ${result.processed - result.failed} question(s).`,
            );
          }
        }
      });
    });
  };

  const handleProcessClassifications = (): void => {
    if (classifications.size === 0) return;

    setIsProcessing(true);
    setError(null);

    const resultsArray = Array.from(classifications.values());

    startTransition(() => {
      batchProcessClassificationsAction(resultsArray).then((result) => {
        setIsProcessing(false);
        if (result.success) {
          setSuccessMessage(result.message);
          // Refresh questions and stats
          loadQuestions();
          // Refresh stats
          getUnpublishedStats().then((statsResult) => {
            if (statsResult.success && statsResult.data) {
              setStats(statsResult.data);
            }
          });
        } else {
          setError(result.message);
        }
      });
    });
  };

  const handleManualClassify = async (questionId: number): Promise<void> => {
    setError(null);
    const result = await classifyQuestionAction(questionId);
    setClassifications((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, result);
      return newMap;
    });
  };

  const handlePublish = async (questionId: number): Promise<void> => {
    const result = await updateQuestionStatusAction(questionId, 'published');
    if (result.success) {
      setSuccessMessage('Question published');
      loadQuestions();
      getUnpublishedStats().then((statsResult) => {
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      });
    } else {
      setError(result.error || 'Failed to publish');
    }
  };

  const handleArchive = async (questionId: number): Promise<void> => {
    const result = await archiveQuestionAction(questionId);
    if (result.success) {
      setSuccessMessage('Question archived');
      loadQuestions();
      getUnpublishedStats().then((statsResult) => {
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      });
    } else {
      setError(result.error || 'Failed to archive');
    }
  };

  const handleBulkArchive = async (questionIds: number[]): Promise<void> => {
    if (questionIds.length === 0) return;

    setError(null);
    const result = await bulkArchiveQuestionsAction(questionIds);
    if (result.success) {
      setSuccessMessage(`Successfully archived ${result.archived} question(s)`);
      loadQuestions();
      getUnpublishedStats().then((statsResult) => {
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      });
    } else {
      setError(
        result.error || `Failed to archive. ${result.archived} archived, ${result.failed} failed.`,
      );
    }
  };

  const handleScanImproper = (): void => {
    setIsScanning(true);
    setError(null);
    setScanResults(null);

    startTransition(() => {
      scanImproperQuestions().then((result) => {
        setIsScanning(false);
        if (result.success && result.data) {
          setScanResults(result.data);
          setSuccessMessage(
            `Scan complete: ${result.data.total} total, ${result.data.improper} improper (rule-based), ${result.data.proper} proper (rule-based), ${result.data.ambiguous} need Gemini classification`,
          );
        } else {
          setError(result.error || 'Scan failed');
        }
      });
    });
  };

  const isProcessingAny = isLoading || isClassifying || isProcessing || isPending || isScanning;

  // Group questions by classification
  const properQuestions = questions.filter(
    (q) => classifications.get(q.id)?.classification === 'proper',
  );
  const improperQuestions = questions.filter(
    (q) => classifications.get(q.id)?.classification === 'improper',
  );
  const needsReviewQuestions = questions.filter(
    (q) => classifications.get(q.id)?.classification === 'needs_review',
  );
  const unclassifiedQuestions = questions.filter((q) => !classifications.has(q.id));

  return (
    <div className="space-y-6">
      {/* Container 1: Progress Tracker */}
      <SectionCard
        eyebrow="Trivia Selector"
        title="Classify & Prepare Multiple Choice Trivia"
        description="Review and classify trivia questions for temporal relevance. Auto-publish proper questions and archive improper ones. Flag ambiguous cases for manual review."
      >
        <div className="mt-6 flex items-center gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Unpublished Questions
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {stats.total}
            </p>
          </div>
          {classifications.size > 0 && (
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Proper
                </p>
                <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                  {properQuestions.length}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Improper</p>
                <p className="text-lg font-semibold text-rose-800 dark:text-rose-200">
                  {improperQuestions.length}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Needs Review
                </p>
                <p className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                  {needsReviewQuestions.length}
                </p>
              </div>
            </div>
          )}
        </div>
        {scanResults && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Rule-Based Scan Results
            </p>
            <div className="grid grid-cols-4 gap-4 text-xs mb-4">
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Total</p>
                <p className="text-blue-900 dark:text-blue-100 text-lg font-semibold">
                  {scanResults.total}
                </p>
              </div>
              <div>
                <p className="text-rose-600 dark:text-rose-400 font-medium">Improper</p>
                <p className="text-rose-800 dark:text-rose-200 text-lg font-semibold">
                  {scanResults.improper}
                </p>
              </div>
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">Proper</p>
                <p className="text-emerald-800 dark:text-emerald-200 text-lg font-semibold">
                  {scanResults.proper}
                </p>
              </div>
              <div>
                <p className="text-amber-600 dark:text-amber-400 font-medium">Need Gemini</p>
                <p className="text-amber-800 dark:text-amber-200 text-lg font-semibold">
                  {scanResults.ambiguous}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setError(null);
                  const result = await archiveAllImproperAction();
                  if (result.success) {
                    setSuccessMessage(
                      `Successfully archived ${result.archived} improper question(s)`,
                    );
                    loadQuestions();
                    getUnpublishedStats().then((statsResult) => {
                      if (statsResult.success && statsResult.data) {
                        setStats(statsResult.data);
                      }
                    });
                    // Refresh scan results
                    handleScanImproper();
                  } else {
                    setError(result.error || 'Failed to archive improper questions');
                  }
                }}
                disabled={isProcessingAny || scanResults.improper === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                Archive Improper ({scanResults.improper})
              </button>
              <button
                onClick={async () => {
                  setError(null);
                  const result = await publishAllProperAction();
                  if (result.success) {
                    setSuccessMessage(
                      `Successfully published ${result.published} proper question(s)`,
                    );
                    loadQuestions();
                    getUnpublishedStats().then((statsResult) => {
                      if (statsResult.success && statsResult.data) {
                        setStats(statsResult.data);
                      }
                    });
                    // Refresh scan results
                    handleScanImproper();
                  } else {
                    setError(result.error || 'Failed to publish proper questions');
                  }
                }}
                disabled={isProcessingAny || scanResults.proper === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus-visible:ring focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              >
                Publish Proper ({scanResults.proper})
              </button>
            </div>
          </div>
        )}
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

      {/* Action Buttons */}
      <FormCard>
        <div className="space-y-4">
          <div className="flex gap-3">
            <SecondaryButton
              onClick={handleScanImproper}
              disabled={isProcessingAny}
              className="flex-1"
            >
              {isScanning ? 'Scanning...' : 'Scan All for Improper (Rule-Based)'}
            </SecondaryButton>
            <SecondaryButton onClick={loadQuestions} disabled={isProcessingAny}>
              Refresh
            </SecondaryButton>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="classify-count"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Number of Questions to Classify
              </label>
              {questions.length > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Max: {questions.length}
                </span>
              )}
            </div>
            <input
              id="classify-count"
              type="number"
              min="1"
              max={questions.length || 100}
              value={classifyCount}
              onChange={(e) => {
                const newCount = Number.parseInt(e.target.value, 10) || 1;
                const maxCount = questions.length || 100;
                setClassifyCount(Math.min(Math.max(1, newCount), maxCount));
              }}
              disabled={isProcessingAny || questions.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-primary-brand focus:outline-none focus:ring focus:ring-primary-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-primary-brand"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Classify questions sequentially, one at a time. Each question will be analyzed for
              temporal relevance.
            </p>
          </div>
          <div className="flex gap-3">
            <PrimaryButton
              onClick={handleBatchClassify}
              disabled={isProcessingAny || questions.length === 0 || classifyCount < 1}
              className="flex-1"
            >
              {isClassifying
                ? `Classifying ${classifyCount} Question(s)...`
                : `Classify ${classifyCount} Question(s)`}
            </PrimaryButton>
            {classifications.size > 0 && (
              <PrimaryButton
                onClick={handleProcessClassifications}
                disabled={isProcessingAny}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Auto-Process (Publish Proper, Archive Improper)'}
              </PrimaryButton>
            )}
          </div>
        </div>
      </FormCard>

      {/* Questions Display */}
      {isLoading ? (
        <FormCard>
          <div className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">Loading questions...</p>
          </div>
        </FormCard>
      ) : questions.length === 0 ? (
        <FormCard>
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No unpublished questions
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              All questions have been classified and processed.
            </p>
          </div>
        </FormCard>
      ) : (
        <div className="space-y-6">
          {/* Unclassified Questions */}
          {unclassifiedQuestions.length > 0 && (
            <SectionCard
              eyebrow="Unclassified"
              title={`${unclassifiedQuestions.length} Question(s) Awaiting Classification`}
            >
              <div className="mt-6 space-y-4">
                {unclassifiedQuestions.slice(0, 10).map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    classification={null}
                    onClassify={() => handleManualClassify(question.id)}
                    onPublish={() => handlePublish(question.id)}
                    onArchive={() => handleArchive(question.id)}
                    disabled={isProcessingAny}
                  />
                ))}
                {unclassifiedQuestions.length > 10 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                    ... and {unclassifiedQuestions.length - 10} more (classify all to see all)
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {/* Proper Questions */}
          {properQuestions.length > 0 && (
            <SectionCard
              eyebrow="Proper"
              title={`${properQuestions.length} Proper Question(s)`}
              description="These questions are temporally relevant and ready to publish."
            >
              <div className="mt-6 space-y-4">
                {properQuestions.map((question) => {
                  const classification = classifications.get(question.id);
                  return (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      classification={classification || null}
                      onClassify={() => handleManualClassify(question.id)}
                      onPublish={() => handlePublish(question.id)}
                      onArchive={() => handleArchive(question.id)}
                      disabled={isProcessingAny}
                    />
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Improper Questions */}
          {improperQuestions.length > 0 && (
            <SectionCard
              eyebrow="Improper"
              title={`${improperQuestions.length} Improper Question(s)`}
              description="These questions contain outdated temporal references and should be archived."
            >
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleBulkArchive(improperQuestions.map((q) => q.id))}
                  disabled={isProcessingAny}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-900/20"
                >
                  Archive All {improperQuestions.length}
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {improperQuestions.map((question) => {
                  const classification = classifications.get(question.id);
                  return (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      classification={classification || null}
                      onClassify={() => handleManualClassify(question.id)}
                      onPublish={() => handlePublish(question.id)}
                      onArchive={() => handleArchive(question.id)}
                      disabled={isProcessingAny}
                    />
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Needs Review Questions */}
          {needsReviewQuestions.length > 0 && (
            <SectionCard
              eyebrow="Needs Review"
              title={`${needsReviewQuestions.length} Question(s) Need Manual Review`}
              description="These questions require human judgment to determine if they should be published or archived."
            >
              <div className="mt-6 space-y-4">
                {needsReviewQuestions.map((question) => {
                  const classification = classifications.get(question.id);
                  return (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      classification={classification || null}
                      onClassify={() => handleManualClassify(question.id)}
                      onPublish={() => handlePublish(question.id)}
                      onArchive={() => handleArchive(question.id)}
                      disabled={isProcessingAny}
                    />
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: TriviaQuestionWithSource;
  classification: ClassificationResult | null;
  onClassify: () => void;
  onPublish: () => void;
  onArchive: () => void;
  disabled: boolean;
}

function QuestionCard({
  question,
  classification,
  onClassify,
  onPublish,
  onArchive,
  disabled,
}: QuestionCardProps): JSX.Element {
  const getClassificationColor = (): string => {
    if (!classification)
      return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70';
    if (classification.classification === 'proper')
      return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20';
    if (classification.classification === 'improper')
      return 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20';
    return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
  };

  const getConfidenceColor = (confidence?: string): string => {
    if (confidence === 'high') return 'text-emerald-600 dark:text-emerald-400';
    if (confidence === 'medium') return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div className={`rounded-xl border px-6 py-4 ${getClassificationColor()}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Question #{question.id}
            </p>
            {classification && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  classification.classification === 'proper'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : classification.classification === 'improper'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                }`}
              >
                {classification.classification === 'proper'
                  ? '✓ Proper'
                  : classification.classification === 'improper'
                    ? '✗ Improper'
                    : '? Review'}
              </span>
            )}
            {classification?.confidence && (
              <span
                className={`text-xs font-medium ${getConfidenceColor(classification.confidence)}`}
              >
                ({classification.confidence} confidence)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
            {question.question_text}
          </p>
          {classification?.reasoning && (
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              {classification.reasoning}
            </p>
          )}
          {question.source_content_date && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Source from: {new Date(question.source_content_date).getFullYear()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {!classification && (
            <SecondaryButton
              onClick={onClassify}
              disabled={disabled}
              className="text-xs px-3 py-1.5"
            >
              Classify
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onPublish} disabled={disabled} className="text-xs px-3 py-1.5">
            Publish
          </SecondaryButton>
          <button
            onClick={onArchive}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-900/20"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
