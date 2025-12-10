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
  FormCard,
  FormField,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from '@/components/ui/FormKit';

type WorkflowStep = 'input' | 'processing' | 'review' | 'finalization';

const initialState: IngestState = { ok: false };

interface EditableMetadata {
  title: string;
  category: string;
  tags: string[];
  author: string;
  theme: string;
  summary: string;
}

export default function SourcingPage(): JSX.Element {
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

  // Update extracted metadata when ingestion completes
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
      setCurrentStep('review');
    }
  }, [state, autoStatus]);

  const isBusy = processing || isPending || autoProcessing || manualSubmitting;

  const onPaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setContent((prev) => (prev ? `${prev}\n${text}` : text));
    } catch {
      // ignore
    }
  };

  const onClear = useCallback((): void => {
    setContent('');
    setPreview('');
    setTitle('');
    setCurrentStep('input');
    setExtractedMetadata(null);
    setAutoStatus(null);
    setIngestionComplete(false);
  }, []);

  const onProcess = async (): Promise<void> => {
    if (!content.trim()) return;
    setProcessing(true);
    setCurrentStep('processing');
    try {
      const res = await processText(content);
      setPreview(res.processedText);
      setWordCount(res.wordCount);
      setCharCount(res.charCount);
      // After processing, trigger ingestion
      await handleIngest(res.processedText);
    } finally {
      setProcessing(false);
    }
  };

  const handleIngest = useCallback(
    async (processedContent?: string): Promise<void> => {
      if (manualSubmitting || isPending) return;
      setManualSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('content', processedContent || preview || content);
        formData.append('title', title);
        // Use formAction which will update state via useActionState
        await formAction(formData);
      } finally {
        setManualSubmitting(false);
      }
    },
    [content, preview, title, formAction, manualSubmitting, isPending],
  );

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

  const feedbackState = autoStatus ?? state;
  const canProcess = content.trim().length > 0 && !isBusy;
  const showReview = currentStep === 'review' && extractedMetadata && currentStep !== 'finalization';
  const showFinalization = currentStep === 'finalization' && extractedMetadata;

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

      {/* Step 2: AI Processing & Review */}
      {(currentStep === 'processing' || (currentStep === 'review' && extractedMetadata)) && (
        <StepCard
          stepNumber={2}
          title="AI Processing & Review"
          isActive={currentStep === 'processing' || currentStep === 'review'}
          isComplete={currentStep === 'review' && extractedMetadata}
        >
          {currentStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <SpinnerIcon className="h-12 w-12 animate-spin text-primary-brand" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Gemini is extracting structured metadata...
              </p>
            </div>
          )}

          {currentStep === 'review' && extractedMetadata && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Content processed. Review extracted structured metadata below.
                </p>
              </div>

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
          )}

          {feedbackState?.error && (
            <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {feedbackState.error}
            </div>
          )}
        </StepCard>
      )}

      {/* Step 3: Receipt / Confirmation */}
      {currentStep === 'finalization' && ingestionComplete && extractedMetadata && feedbackState?.ok && feedbackState?.recordId && (
        <StepCard
          stepNumber={3}
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
    </div>
  );
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

