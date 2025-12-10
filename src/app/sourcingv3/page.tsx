'use client';

import { useActionState } from 'react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { processText } from '@/lib/text-processing';
import {
  autoIngestClipboardAction,
  ingestSourceContentAction,
  type IngestState,
} from './actions';
import {
  processSourceForAllSuitableTypes,
  type ProcessSuitableContentResult,
} from './processSuitableContent';
import {
  FormCard,
  FormField,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from '@/components/ui/FormKit';

type WorkflowStep = 'input' | 'processing' | 'analysis' | 'review' | 'finalization';

const initialState: IngestState = { ok: false };

interface EditableMetadata {
  title: string;
  category: string;
  tags: string[];
  author: string;
  theme: string;
  summary: string;
}

interface SuitabilityAnalysis {
  multiple_choice_trivia?: { suitable: boolean; confidence: number; reasoning: string };
  true_false_trivia?: { suitable: boolean; confidence: number; reasoning: string };
  who_am_i_trivia?: { suitable: boolean; confidence: number; reasoning: string };
  motivational?: { suitable: boolean; confidence: number; reasoning: string };
  facts?: { suitable: boolean; confidence: number; reasoning: string };
  wisdom?: { suitable: boolean; confidence: number; reasoning: string };
}

export default function SourcingPageV3(): JSX.Element {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [state, formAction] = useActionState(ingestSourceContentAction, initialState);
  const [isPending, startTransition] = useTransition();
  const [autoStatus, setAutoStatus] = useState<IngestState | null>(null);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<EditableMetadata | null>(null);
  const [hasClipboardAccess, setHasClipboardAccess] = useState(false);
  const [ingestionComplete, setIngestionComplete] = useState(false);
  const [suitabilityAnalysis, setSuitabilityAnalysis] = useState<SuitabilityAnalysis | null>(null);
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({});
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generationResult, setGenerationResult] = useState<ProcessSuitableContentResult | null>(null);

  // Memoize suitable types calculation
  const suitableTypesInfo = useMemo(() => {
    if (!suitabilityAnalysis) return null;
    const suitableTypes = Object.entries(suitabilityAnalysis).filter(
      ([, analysis]) => analysis && analysis.suitable && analysis.confidence >= 0.7
    );
    return {
      types: suitableTypes,
      hasSuitableTypes: suitableTypes.length > 0,
    };
  }, [suitabilityAnalysis]);

  // Check clipboard availability on client side only
  useEffect(() => {
    setHasClipboardAccess(typeof navigator !== 'undefined' && !!navigator.clipboard?.readText);
  }, []);

  // Calculate word/char count
  useEffect(() => {
    const wc = content.trim()
      ? content
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length
      : 0;
    setWordCount(wc);
    setCharCount(content.length);
  }, [content]);

  // Update extracted metadata and analysis when ingestion completes
  useEffect(() => {
    const feedbackState = autoStatus ?? state;
    if (feedbackState?.ok && feedbackState?.metadata) {
      setExtractedMetadata({
        title: feedbackState.metadata.title,
        category: feedbackState.metadata.category || '',
        tags: feedbackState.metadata.tags || [],
        author: '',
        theme: feedbackState.metadata.theme,
        summary: feedbackState.metadata.summary,
      });
      setIngestionComplete(true);
      
      // Set analysis results if available
      if (feedbackState.metadata.suitabilityAnalysis) {
        setSuitabilityAnalysis(feedbackState.metadata.suitabilityAnalysis);
        setCurrentStep('analysis');
      } else {
        // If no analysis, skip to review
        setCurrentStep('review');
      }
    }
  }, [state, autoStatus]);

  const isBusy = processing || isPending || autoProcessing || manualSubmitting;

  const onClear = useCallback((): void => {
    setContent('');
    setPreview('');
    setTitle('');
    setCurrentStep('input');
    setExtractedMetadata(null);
    setAutoStatus(null);
    setIngestionComplete(false);
    setSuitabilityAnalysis(null);
    setShowReasoning({});
  }, []);

  const handleAutoIngest = useCallback(async (): Promise<void> => {
    if (autoProcessing || isPending) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      setAutoStatus({
        ok: false,
        error: 'Clipboard access is unavailable in this browser context.',
      });
      return;
    }

    setAutoProcessing(true);
    setAutoStatus(null);
    setCurrentStep('processing');

    try {
      const clipboardText = await navigator.clipboard.readText();
      const trimmed = clipboardText.trim();

      if (!trimmed) {
        setAutoStatus({
          ok: false,
          error: 'Clipboard is empty. Copy source content before running auto ingestion.',
        });
        setCurrentStep('input');
        return;
      }

      setContent(trimmed);
      setPreview('');

      const result = await autoIngestClipboardAction({
        content: trimmed,
        title,
      });

      setAutoStatus(result);

      if (result.ok) {
        setContent('');
        setPreview('');
        try {
          await navigator.clipboard.writeText('');
        } catch {
          // ignore inability to clear clipboard
        }
      } else {
        setCurrentStep('input');
      }
    } catch {
      setAutoStatus({
        ok: false,
        error: 'Unable to read clipboard. Grant clipboard permissions and try again.',
      });
      setCurrentStep('input');
    } finally {
      setAutoProcessing(false);
    }
  }, [autoProcessing, isPending, title]);

  const handleFinalize = useCallback((): void => {
    // Everything is already saved to the database, so just reset the workflow
    onClear();
  }, [onClear]);

  const removeTag = (tagToRemove: string): void => {
    if (!extractedMetadata) return;
    setExtractedMetadata({
      ...extractedMetadata,
      tags: extractedMetadata.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const toggleReasoning = (contentType: string): void => {
    setShowReasoning((prev) => ({
      ...prev,
      [contentType]: !prev[contentType],
    }));
  };

  const handleGenerateAllSuitableContent = useCallback(async (): Promise<void> => {
    const feedbackState = autoStatus ?? state;
    if (!feedbackState?.recordId || !suitabilityAnalysis) return;

    // Check if there are any suitable types to process
    const suitableTypes = Object.entries(suitabilityAnalysis).filter(
      ([, analysis]) => analysis && analysis.suitable && analysis.confidence >= 0.7
    );
    
    if (suitableTypes.length === 0) {
      // No types meet threshold - shouldn't happen due to UI, but handle gracefully
      setGenerationResult({
        success: false,
        sourceId: feedbackState.recordId,
        processed: [],
        skipped: [{ contentType: 'all', reason: 'No content types meet the 70% confidence threshold' }],
        totalProcessed: 0,
        totalSkipped: 1,
      });
      return;
    }

    setIsGeneratingContent(true);
    setGenerationResult(null);

    try {
      const result = await processSourceForAllSuitableTypes(feedbackState.recordId, 0.7);
      setGenerationResult(result);
      // eslint-disable-next-line no-console
      console.log('Content generation result:', result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating content:', error);
      setGenerationResult({
        success: false,
        sourceId: feedbackState.recordId,
        processed: [],
        skipped: [{ contentType: 'all', reason: error instanceof Error ? error.message : 'Unknown error' }],
        totalProcessed: 0,
        totalSkipped: 1,
      });
    } finally {
      setIsGeneratingContent(false);
    }
  }, [autoStatus, state, suitabilityAnalysis]);

  const feedbackState = autoStatus ?? state;
  const canProcess = content.trim().length > 0 && !isBusy;

  return (
    <div className="space-y-6">
      {/* Step 1: Content Input */}
      <StepCard
        stepNumber={1}
        title="Content Input"
        isActive={currentStep === 'input'}
        isComplete={currentStep !== 'input'}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-4">
            <SecondaryButton type="button" onClick={onClear} disabled={isBusy}>
              Clear
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={handleAutoIngest}
              disabled={!hasClipboardAccess || autoProcessing || isPending}
              className="bg-emerald-500 hover:bg-emerald-500/90 dark:hover:bg-emerald-500/90"
            >
              {autoProcessing || isPending ? 'Ingesting…' : 'Ingest from Clipboard'}
            </PrimaryButton>
          </div>
        </div>
      </StepCard>

      {/* Step 2: AI Processing */}
      {currentStep === 'processing' && (
        <StepCard
          stepNumber={2}
          title="AI Processing"
          isActive={currentStep === 'processing'}
          isComplete={false}
        >
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <SpinnerIcon className="h-12 w-12 animate-spin text-primary-brand" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Gemini is extracting structured metadata...
            </p>
          </div>
        </StepCard>
      )}

      {/* Step 3: Content Suitability Analysis */}
      {currentStep === 'analysis' && suitabilityAnalysis && (
        <StepCard
          stepNumber={3}
          title="Content Suitability Analysis"
          isActive={currentStep === 'analysis'}
          isComplete={false}
        >
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Content suitability analysis results. Types with <span className="font-semibold text-emerald-600 dark:text-emerald-400">70%+ confidence</span> will be processed when generating content.
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(suitabilityAnalysis).map(([contentType, analysis]) => {
                if (!analysis) return null;
                const isSuitable = analysis.suitable;
                const confidencePercent = Math.round(analysis.confidence * 100);
                const meetsThreshold = isSuitable && analysis.confidence >= 0.7;
                const isShowingReasoning = showReasoning[contentType];

                // Determine color scheme based on suitability and confidence
                const getCardStyles = () => {
                  if (meetsThreshold) {
                    return 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40';
                  } else if (isSuitable && analysis.confidence >= 0.5) {
                    return 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30';
                  } else if (isSuitable) {
                    return 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50';
                  } else {
                    return 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 opacity-60';
                  }
                };

                const getConfidenceColor = () => {
                  if (meetsThreshold) {
                    return 'text-emerald-700 dark:text-emerald-300 font-semibold';
                  } else if (isSuitable && analysis.confidence >= 0.5) {
                    return 'text-amber-700 dark:text-amber-300';
                  } else {
                    return 'text-slate-500 dark:text-slate-400';
                  }
                };

                return (
                  <div
                    key={contentType}
                    className={`rounded-lg border p-4 ${getCardStyles()}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {isSuitable ? (
                          <span className={`text-lg ${meetsThreshold ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>✓</span>
                        ) : (
                          <span className="text-lg text-slate-400">✗</span>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {formatContentTypeName(contentType)}
                        </span>
                        <div className="flex items-center gap-2 flex-1">
                          {/* Confidence Progress Bar */}
                          <div className="flex-1 max-w-[120px] h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                meetsThreshold
                                  ? 'bg-emerald-500 dark:bg-emerald-400'
                                  : isSuitable && analysis.confidence >= 0.5
                                    ? 'bg-amber-500 dark:bg-amber-400'
                                    : 'bg-slate-400 dark:bg-slate-500'
                              }`}
                              style={{ width: `${confidencePercent}%` }}
                            />
                          </div>
                          <span className={`text-xs ${getConfidenceColor()}`}>
                            {confidencePercent}%
                          </span>
                        </div>
                        {meetsThreshold && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            Will Process
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleReasoning(contentType)}
                        className="ml-3 text-xs text-primary-brand hover:text-primary-brand/80 shrink-0"
                      >
                        {isShowingReasoning ? 'Hide reasoning' : 'Show reasoning'}
                      </button>
                    </div>
                    {isShowingReasoning && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {analysis.reasoning}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <PrimaryButton
                type="button"
                onClick={() => setCurrentStep('review')}
                className="w-full sm:w-auto"
              >
                Continue to Review →
              </PrimaryButton>
            </div>
          </div>
        </StepCard>
      )}

      {/* Step 4: Review */}
      {currentStep === 'review' && extractedMetadata && (
        <StepCard
          stepNumber={4}
          title="Review"
          isActive={currentStep === 'review'}
          isComplete={false}
        >
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Content processed. Review extracted structured metadata below.
              </p>
            </div>

            {suitabilityAnalysis && (
              <div className="rounded-lg border border-primary-brand/20 bg-primary-brand/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                  Content Suitability:
                </p>
                {suitableTypesInfo && suitableTypesInfo.hasSuitableTypes ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {suitableTypesInfo.types.map(([contentType, analysis]) => {
                        const confidencePercent = Math.round((analysis?.confidence || 0) * 100);
                        return (
                          <div key={contentType} className="relative">
                            <TagPill>{formatContentTypeName(contentType)}</TagPill>
                            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                              ({confidencePercent}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <PrimaryButton
                      type="button"
                      onClick={handleGenerateAllSuitableContent}
                      disabled={isGeneratingContent || !feedbackState?.recordId}
                      className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-500/90 dark:hover:bg-emerald-500/90"
                    >
                      {isGeneratingContent ? 'Generating Content...' : `Generate All Suitable Content (${suitableTypesInfo.types.length} type${suitableTypesInfo.types.length !== 1 ? 's' : ''})`}
                    </PrimaryButton>
                    {generationResult && (
                      <div className={`mt-4 rounded-lg border p-3 ${
                        generationResult.success
                          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40'
                          : 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40'
                      }`}>
                        <p className={`text-sm font-medium ${
                          generationResult.success
                            ? 'text-emerald-900 dark:text-emerald-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}>
                          {generationResult.success
                            ? `✅ Generated content for ${generationResult.totalProcessed} content type(s)`
                            : '❌ Generation failed'}
                        </p>
                        {generationResult.processed.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {generationResult.processed.map((p, idx) => (
                              <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                                {p.success ? '✓' : '✗'} {formatContentTypeName(p.contentType)}: {p.message}
                                {p.itemCount !== undefined && ` (${p.itemCount} items)`}
                              </p>
                            ))}
                          </div>
                        )}
                        {generationResult.skipped.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Skipped ({generationResult.totalSkipped}):
                            </p>
                            {generationResult.skipped.map((s, idx) => (
                              <p key={idx} className="text-xs text-slate-500 dark:text-slate-400">
                                {formatContentTypeName(s.contentType)}: {s.reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30 mb-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ No content types meet the 70% confidence threshold for processing.
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Content types with lower confidence scores were identified but won't be automatically generated.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">
                  Extracted Title:
                </label>
                <TextInput
                  value={extractedMetadata.title}
                  onChange={(e) =>
                    setExtractedMetadata({ ...extractedMetadata, title: e.target.value })
                  }
                  className="text-base font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">
                  Theme:
                </label>
                <TagPill>{extractedMetadata.theme}</TagPill>
                {extractedMetadata.category && (
                  <>
                    <span className="mx-2 text-slate-400">·</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {extractedMetadata.category}
                    </span>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">
                  Tags:
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractedMetadata.tags.map((tag, idx) => (
                    <InteractiveTagPill key={idx} onRemove={() => removeTag(tag)}>
                      {tag}
                    </InteractiveTagPill>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">
                  Summary:
                </label>
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3">
                  {extractedMetadata.summary}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <PrimaryButton
                type="button"
                onClick={() => setCurrentStep('finalization')}
                className="w-full sm:w-auto"
              >
                Finalize
              </PrimaryButton>
            </div>
          </div>
        </StepCard>
      )}

      {/* Step 5: Receipt / Confirmation */}
      {currentStep === 'finalization' && ingestionComplete && extractedMetadata && feedbackState?.ok && feedbackState?.recordId && (
        <StepCard
          stepNumber={5}
          title="Complete"
          isActive={currentStep === 'finalization'}
          isComplete={false}
        >
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/40">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                  ✅ Content Ingested Successfully
                </h3>
                <span className="rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  ID: {feedbackState.recordId}
                </span>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
                Your content has been processed and saved to the database.
              </p>

              {suitabilityAnalysis && (
                <div className="mb-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mb-2">
                    Suitable For:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(suitabilityAnalysis).map(([contentType, analysis]) => {
                      if (!analysis || !analysis.suitable) return null;
                      return (
                        <TagPill key={contentType}>{formatContentTypeName(contentType)}</TagPill>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Title:
                  </span>
                  <p className="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {extractedMetadata.title}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Theme:
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <TagPill>{extractedMetadata.theme}</TagPill>
                    {extractedMetadata.category && (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400">·</span>
                        <span className="text-sm text-emerald-800 dark:text-emerald-200">
                          {extractedMetadata.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {extractedMetadata.tags.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Tags:
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {extractedMetadata.tags.map((tag, idx) => (
                        <TagPill key={idx}>{tag}</TagPill>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Summary:
                  </span>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200 line-clamp-3">
                    {extractedMetadata.summary}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800/50">
                <Link
                  href={`/content-browser?themes=${encodeURIComponent(extractedMetadata.theme)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
                >
                  View in Content Browser →
                </Link>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <PrimaryButton
                type="button"
                onClick={handleFinalize}
                className="bg-emerald-500 hover:bg-emerald-500/90 dark:hover:bg-emerald-500/90"
              >
                Complete
              </PrimaryButton>
            </div>
          </div>
        </StepCard>
      )}

      {feedbackState?.error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {feedbackState.error}
        </div>
      )}
    </div>
  );
}

// Helper function to format content type names
function formatContentTypeName(contentType: string): string {
  const nameMap: Record<string, string> = {
    multiple_choice_trivia: 'Multiple Choice Trivia',
    true_false_trivia: 'True/False Trivia',
    who_am_i_trivia: 'Who Am I? Trivia',
    motivational: 'Motivational',
    facts: 'Facts',
    wisdom: 'Wisdom',
  };
  return nameMap[contentType] || contentType;
}

// Step Card Component
function StepCard({
  stepNumber,
  title,
  isActive,
  isComplete,
  children,
}: {
  stepNumber: number;
  title: string;
  isActive: boolean;
  isComplete: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <FormCard
      className={`transition-all ${
        isActive
          ? 'border-primary-brand/40 shadow-lg shadow-primary-brand/10'
          : isComplete
            ? 'opacity-75'
            : 'opacity-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
            isActive
              ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/40'
              : isComplete
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {isComplete && !isActive ? '✓' : stepNumber}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h2>
          {children}
        </div>
      </div>
    </FormCard>
  );
}

// Tag Pill Component
function TagPill({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-brand/10 px-3 py-1 text-xs font-semibold text-primary-brand dark:bg-primary-brand/20 dark:text-primary-brand/90">
      {children}
    </span>
  );
}

// Interactive Tag Pill Component (removable)
function InteractiveTagPill({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-brand px-3 py-1 text-xs font-semibold text-white">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full hover:bg-white/20 p-0.5 transition-colors"
        aria-label={`Remove ${children}`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// Spinner Icon Component
function SpinnerIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" opacity="0.2" />
      <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
    </svg>
  );
}

