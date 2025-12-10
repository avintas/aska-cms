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
  FormActions,
  FormCard,
  FormField,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  TextArea,
  TextInput,
} from '@/components/ui/FormKit';

const initialState: IngestState = { ok: false };

export default function SourcingPage(): JSX.Element {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
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

  useEffect(() => {
    if (mode === 'manual') {
      setAutoStatus(null);
      setAutoProcessing(false);
    } else {
      setManualSubmitting(false);
    }
  }, [mode]);

  const isAutoMode = mode === 'auto';

  const manualDisabled = useMemo(
    () => !content.trim() || processing || isPending || manualSubmitting,
    [content, processing, isPending, manualSubmitting],
  );
  const isBusy = processing || isPending || autoProcessing || manualSubmitting;

  const onPaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setContent((prev) => (prev ? `${prev}\n${text}` : text));
    } catch {
      // ignore
    }
  };

  const onClear = (): void => {
    setContent('');
    setPreview('');
  };

  const onProcess = async (): Promise<void> => {
    if (!content.trim()) return;
    if (isAutoMode) return;
    setProcessing(true);
    try {
      const res = await processText(content);
      setPreview(res.processedText);
      setWordCount(res.wordCount);
      setCharCount(res.charCount);
    } finally {
      setProcessing(false);
    }
  };

  const handleModeChange = (next: 'manual' | 'auto'): void => {
    setMode(next);
  };

  const handleAutoIngest = useCallback(async (): Promise<void> => {
    if (autoProcessing || isPending) return;
    if (!navigator.clipboard?.readText) {
      setAutoStatus({
        ok: false,
        error: 'Clipboard access is unavailable in this browser context.',
      });
      return;
    }

    setAutoProcessing(true);
    setAutoStatus(null);

    try {
      const clipboardText = await navigator.clipboard.readText();
      const trimmed = clipboardText.trim();

      if (!trimmed) {
        setAutoStatus({
          ok: false,
          error: 'Clipboard is empty. Copy source content before running auto ingestion.',
        });
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
      }
    } catch {
      setAutoStatus({
        ok: false,
        error: 'Unable to read clipboard. Grant clipboard permissions and try again.',
      });
    } finally {
      setAutoProcessing(false);
    }
  }, [autoProcessing, isPending, title]);

  const handleManualSubmit = useCallback(
    async (formData: FormData): Promise<void> => {
      if (manualSubmitting) return;
      setManualSubmitting(true);
      try {
        await formAction(formData);
      } finally {
        setManualSubmitting(false);
      }
    },
    [formAction, manualSubmitting],
  );

  const feedbackState = isAutoMode ? autoStatus ?? initialState : state;

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Operations"
        title="Source Content Ingestion"
        description="Paste long-form articles or transcripts and let Gemini extract structured metadata before we feed the builders."
        action={
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-primary-brand/10 dark:border-slate-800 dark:bg-slate-900/70">
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
              Mode
            </span>
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-900/5 p-1 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => handleModeChange('manual')}
                aria-pressed={!isAutoMode}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  !isAutoMode
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25 dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('auto')}
                aria-pressed={isAutoMode}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isAutoMode
                    ? 'bg-primary-brand text-white shadow-md shadow-primary-brand/40'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Auto
              </button>
            </div>
          </div>
        }
      />

      <FormCard>
        <form action={isAutoMode ? undefined : handleManualSubmit} className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Source Content
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
                Required
              </span>
            </div>
            {isAutoMode ? (
              <div className="ml-auto flex flex-wrap items-center gap-2" aria-live="polite">
                <PrimaryButton
                  type="button"
                  className="bg-emerald-500 hover:bg-emerald-500/90 dark:hover:bg-emerald-500/90"
                  disabled={autoProcessing}
                  aria-describedby="auto-mode-help"
                  onClick={() => {
                    startTransition(() => {
                      void handleAutoIngest();
                    });
                  }}
                >
                  {autoProcessing || isPending ? 'Ingesting…' : 'Auto Ingest Clipboard'}
                </PrimaryButton>
                {isBusy && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                    <SpinnerIcon className="h-4 w-4 animate-spin text-primary-brand" />
                    Working…
                  </span>
                )}
              </div>
            ) : (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <SecondaryButton type="button" onClick={onPaste}>
                  Paste
                </SecondaryButton>
                <SecondaryButton type="button" onClick={onClear}>
                  Clear
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  className="bg-indigo-500 hover:bg-indigo-500/90 dark:hover:bg-indigo-500/90"
                  disabled={!content.trim() || processing}
                  onClick={onProcess}
                >
                  {processing ? 'Processing…' : 'Process Text'}
                </PrimaryButton>
                {isBusy && (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                    aria-live="polite"
                  >
                    <SpinnerIcon className="h-4 w-4 animate-spin text-primary-brand" />
                    Working…
                  </span>
                )}
              </div>
            )}
          </div>

          <FormField label=" " htmlFor="content">
            <TextArea
              id="content"
              name="content"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your source content here…"
              required
              className="min-h-[320px]"
            />
          </FormField>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {wordCount.toLocaleString()} words • {charCount.toLocaleString()} characters
            </span>
            {preview && <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Preview ready</span>}
          </div>

          {preview && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Normalized preview
              </p>
              <pre className="whitespace-pre-wrap leading-relaxed">{preview}</pre>
            </div>
          )}

          <FormField label="Title (optional)" htmlFor="title">
            <TextInput
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty to auto-generate"
            />
          </FormField>
          {isAutoMode ? (
            <p id="auto-mode-help" className="text-xs text-slate-500 dark:text-slate-400">
              Auto mode reads from your clipboard, ingests immediately, and clears the clipboard after completion.
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              If provided, this title overrides the AI-generated title.
            </p>
          )}

          {feedbackState?.error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {feedbackState.error}
            </div>
          )}
          {feedbackState?.ok && feedbackState?.recordId && feedbackState?.metadata && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/40">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                  ✅ Ingested Successfully
                </h3>
                <span className="rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  ID: {feedbackState.recordId}
                </span>
              </div>

              <div className="space-y-3 text-emerald-800 dark:text-emerald-200">
                {/* Theme - Most Important */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Theme:
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100">
                      {feedbackState.metadata.theme}
                    </span>
                    {feedbackState.metadata.category && (
                      <>
                        <span className="mx-2 text-emerald-600 dark:text-emerald-400">·</span>
                        <span className="text-xs text-emerald-700 dark:text-emerald-300">
                          {feedbackState.metadata.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Title:
                  </span>
                  <p className="mt-1 font-medium">{feedbackState.metadata.title}</p>
                </div>

                {/* Summary */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Summary:
                  </span>
                  <p className="mt-1 line-clamp-2 text-emerald-800 dark:text-emerald-200">
                    {feedbackState.metadata.summary}
                  </p>
                </div>

                {/* Tags */}
                {feedbackState.metadata.tags && feedbackState.metadata.tags.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Tags ({feedbackState.metadata.tags.length}):
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {feedbackState.metadata.tags.slice(0, 10).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {feedbackState.metadata.tags.length > 10 && (
                        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                          +{feedbackState.metadata.tags.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    <span className="font-semibold">{feedbackState.metadata.wordCount.toLocaleString()}</span> words
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    <span className="font-semibold">{feedbackState.metadata.charCount.toLocaleString()}</span> characters
                  </span>
                  {feedbackState.metadata.keyPhrases && feedbackState.metadata.keyPhrases.length > 0 && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="font-semibold">{feedbackState.metadata.keyPhrases.length}</span> key phrases
                    </span>
                  )}
                </div>

                {/* Action Link */}
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/50">
                  <Link
                    href={`/content-browser?themes=${encodeURIComponent(feedbackState.metadata.theme)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
                  >
                    View in Content Browser →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <FormActions>
            <SecondaryButton type="button" disabled={manualDisabled} onClick={onClear}>
              Reset
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={manualDisabled || isAutoMode}>
              {isPending ? 'Ingesting…' : 'Ingest Content'}
            </PrimaryButton>
          </FormActions>

          {isAutoMode && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Remember to copy new text before each run—auto mode ignores the manual textarea content.
            </p>
          )}
        </form>
      </FormCard>
    </div>
  );
}

function SpinnerIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" opacity="0.2" />
      <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
    </svg>
  );
}


