'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type {
  IdeationSourceSummary,
  IdeationTagStat,
  IdeationThemeStat,
  SourceUsageKey,
} from '@/lib/ideation';
import { FormCard, PrimaryButton, SecondaryButton, SectionCard } from '@/components/ui/FormKit';
import SourcePicker from '@/components/ideation/SourcePicker';
import { generateContentAction } from '@/app/main-generator/actions';
import type { GeneratorTrackKey, PromptSummary } from '@/lib/generator/types';
import AutomatedProcessingPanel from './AutomatedProcessingPanel';
import MotivationalBatchProcessingPanel from './MotivationalBatchProcessingPanel';
import TrueFalseBatchProcessingPanel from './TrueFalseBatchProcessingPanel';
import WisdomBatchProcessingPanel from './WisdomBatchProcessingPanel';
import FactsBatchProcessingPanel from './FactsBatchProcessingPanel';
import GreetingsBatchProcessingPanel from './GreetingsBatchProcessingPanel';
import WhoAmIBatchProcessingPanel from './WhoAmIBatchProcessingPanel';

interface TrackSummaryItem {
  key: string;
  label: string;
  description: string;
  status: string;
  promptSummary: PromptSummary;
}

interface PromptSettingsState {
  temperature: number;
  additionalInstructions: string;
}

const MOCK_ACTIVITY = [
  { time: '10:32', summary: 'Wisdom draft approved and published to library.' },
  { time: '10:05', summary: 'Auto-ingested Game 5 recap from clipboard.' },
  { time: '09:41', summary: 'Prompt tweak saved for Trivia • Multiple Choice.' },
];

const MOCK_RUNS = [
  { title: 'Greeting • Post-win hug script', track: 'Greetings', status: 'Published' },
  { title: 'Fact • Road power-play conversion', track: 'Facts', status: 'Needs review' },
  { title: 'Trivia MCQ • Legendary captains', track: 'Trivia • MCQ', status: 'Draft' },
];

function defaultSettings(): PromptSettingsState {
  return { temperature: 0.3, additionalInstructions: '' };
}

const TILE_BASE_CLASSES =
  'flex h-full flex-col justify-between rounded-2xl border px-5 py-5 shadow-sm transition';
const TILE_BUTTON_BASE_CLASSES = `${TILE_BASE_CLASSES} text-left focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/60`;
const PRIMARY_TILE_CLASSES = `${TILE_BUTTON_BASE_CLASSES} border-primary-brand/70 bg-primary-brand/10 text-primary-brand hover:border-primary-brand hover:bg-primary-brand/15`;
const SECONDARY_TILE_CLASSES = `${TILE_BUTTON_BASE_CLASSES} border-slate-200 bg-white hover:border-primary-brand/40 hover:bg-primary-brand/5 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100`;
const STATUS_CARD_CLASSES = `${TILE_BASE_CLASSES} border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70`;

interface MainGeneratorWorkspaceProps {
  initialSource: IdeationSourceSummary | null;
  themeStats: IdeationThemeStat[];
  tagStats: IdeationTagStat[];
  initialSourceList: IdeationSourceSummary[];
  initialSourceTotal: number;
  trackSummary: TrackSummaryItem[];
}

export default function MainGeneratorWorkspace({
  initialSource,
  themeStats,
  tagStats,
  initialSourceList,
  initialSourceTotal,
  trackSummary,
}: MainGeneratorWorkspaceProps): JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [promptConfiguratorOpen, setPromptConfiguratorOpen] = useState(false);
  const [stagedSource, setStagedSource] = useState<IdeationSourceSummary | null>(initialSource);
  const [selectedTrackKey, setSelectedTrackKey] = useState<string>(trackSummary[0]?.key ?? '');
  const [settingsByTrack, setSettingsByTrack] = useState<Record<string, PromptSettingsState>>(
    () => {
      const entries = trackSummary.map((track) => [track.key, defaultSettings()] as const);
      return Object.fromEntries(entries);
    },
  );
  const [generationStatus, setGenerationStatus] = useState<
    'idle' | 'running' | 'error' | 'success'
  >('idle');
  const [geminiMessage, setGeminiMessage] = useState<string>('Gemini is standing by.');
  const [isPending, startTransition] = useTransition();

  const selectedTrack = useMemo(
    () => trackSummary.find((track) => track.key === selectedTrackKey) ?? trackSummary[0] ?? null,
    [trackSummary, selectedTrackKey],
  );

  const stagedTags = useMemo(() => stagedSource?.tags.slice(0, 6) ?? [], [stagedSource]);
  const stagedUsage = stagedSource?.usage ?? [];

  // Check if all 7 usage types are present (required for archiving)
  const allUsageTypesPresent = useMemo(() => {
    if (!stagedSource) return false;
    const requiredUsageTypes: SourceUsageKey[] = [
      'wisdom',
      'greeting',
      'motivational',
      'fact',
      'multiple-choice',
      'true-false',
      'who-am-i',
    ];
    const currentUsage = stagedSource.usage ?? [];
    return requiredUsageTypes.every((type) => currentUsage.includes(type));
  }, [stagedSource]);

  const promptSettings = selectedTrack
    ? (settingsByTrack[selectedTrack.key] ?? defaultSettings())
    : defaultSettings();

  /**
   * Maps GeneratorTrackKey to SourceUsageKey format
   */
  function mapTrackKeyToUsageKey(trackKey: GeneratorTrackKey): SourceUsageKey {
    const mapping: Record<GeneratorTrackKey, SourceUsageKey> = {
      wisdom: 'wisdom',
      greetings: 'greeting',
      motivational: 'motivational',
      facts: 'fact',
      trivia_multiple_choice: 'multiple-choice',
      trivia_true_false: 'true-false',
      trivia_who_am_i: 'who-am-i',
    };
    return mapping[trackKey];
  }

  /**
   * Formats usage keys for display
   */
  function formatUsageLabel(key: SourceUsageKey): string {
    const labels: Record<SourceUsageKey, string> = {
      wisdom: 'Wisdom',
      greeting: 'Greeting',
      'bench-boss': 'Bench Boss',
      'captain-heart': 'Captain Heart',
      motivational: 'Motivational',
      stat: 'Stat',
      fact: 'Fact',
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True / False',
      'who-am-i': 'Who Am I?',
    };
    return labels[key] || key;
  }

  const handleGenerate = (): void => {
    if (!stagedSource) {
      setGenerationStatus('error');
      setGeminiMessage('Stage a source before running generation.');
      return;
    }
    if (!selectedTrack) {
      setGenerationStatus('error');
      setGeminiMessage('Pick a track before running generation.');
      return;
    }
    setGenerationStatus('running');
    setGeminiMessage('Generation request dispatched…');

    startTransition(() => {
      generateContentAction({
        trackKey: selectedTrack.key as GeneratorTrackKey,
        sourceId: stagedSource.id,
        temperature: promptSettings.temperature,
        additionalInstructions: promptSettings.additionalInstructions,
      }).then((result) => {
        if (result.success) {
          setGenerationStatus('success');
          setGeminiMessage(result.message);

          // Update staged source usage to include the newly used track
          if (stagedSource) {
            const usageKey = mapTrackKeyToUsageKey(selectedTrack.key as GeneratorTrackKey);
            const currentUsage = stagedSource.usage ?? [];
            if (!currentUsage.includes(usageKey)) {
              setStagedSource({
                ...stagedSource,
                usage: [...currentUsage, usageKey],
              });
            }
          }
        } else {
          setGenerationStatus('error');
          setGeminiMessage(
            [
              result.message,
              result.errorType ? `(${result.errorType.toUpperCase()} error)` : null,
              result.rawCount !== undefined ? `Returned: ${result.rawCount}` : null,
              result.normalizedCount !== undefined ? `Saved: ${result.normalizedCount}` : null,
            ]
              .filter(Boolean)
              .join(' '),
          );
        }
      });
    });
  };

  const statusToneClasses =
    generationStatus === 'error'
      ? 'text-rose-500 dark:text-rose-300'
      : generationStatus === 'success'
        ? 'text-emerald-500 dark:text-emerald-300'
        : generationStatus === 'running'
          ? 'text-primary-brand'
          : 'text-slate-500 dark:text-slate-400';

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Generator"
        title="Main Generator"
        description="Blend source insight with curated prompts to produce wisdom, greetings, motivational pieces, facts, and trivia in one workspace."
        collapsible={true}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            className={PRIMARY_TILE_CLASSES}
            onClick={() => setPickerOpen(true)}
          >
            <p className="text-sm font-semibold">Choose source</p>
            <p className="mt-2 text-xs text-primary-brand/90">
              Stage a source to ground your output.
            </p>
          </button>

          <button
            type="button"
            className={SECONDARY_TILE_CLASSES}
            onClick={() => setPromptConfiguratorOpen(true)}
          >
            <p className="text-sm font-semibold">Configure prompts</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Review and tweak prompt templates for each track.
            </p>
          </button>

          <button
            type="button"
            className={PRIMARY_TILE_CLASSES}
            onClick={handleGenerate}
            disabled={isPending || generationStatus === 'running'}
          >
            <p className="text-sm font-semibold">Generate</p>
            <p className="mt-2 text-xs text-primary-brand/90">
              Trigger Gemini to produce output for the selected track.
            </p>
          </button>

          <div className={`${STATUS_CARD_CLASSES} col-span-full`}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              System messages
            </p>
            <p className={`mt-3 text-sm font-medium ${statusToneClasses}`}>{geminiMessage}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Latest feedback from the generation orchestrator.
            </p>
          </div>
        </div>
      </SectionCard>

      <AutomatedProcessingPanel />

      <MotivationalBatchProcessingPanel />

      <TrueFalseBatchProcessingPanel />

      <WisdomBatchProcessingPanel />

      <FactsBatchProcessingPanel />

      <GreetingsBatchProcessingPanel />

      <WhoAmIBatchProcessingPanel />

      <SourcePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(source) => setStagedSource(source)}
        themeStats={themeStats}
        tags={tagStats}
        initialSources={initialSourceList}
        initialTotal={initialSourceTotal}
      />
      <PromptConfigurator
        open={promptConfiguratorOpen}
        onClose={() => setPromptConfiguratorOpen(false)}
        tracks={trackSummary}
        selectedTrackKey={selectedTrack?.key ?? ''}
        onSelect={(trackKey) => {
          setSelectedTrackKey(trackKey);
          setPromptConfiguratorOpen(false);
          // Find the selected track to get its prompt label
          const selectedTrackItem = trackSummary.find((track) => track.key === trackKey);
          if (selectedTrackItem) {
            const promptLabel = selectedTrackItem.promptSummary?.label ?? selectedTrackItem.label;
            setGeminiMessage(`${promptLabel} is loaded.`);
            setGenerationStatus('idle');
          }
        }}
      />
    </div>
  );
}

function PromptConfigurator({
  open,
  onClose,
  tracks,
  selectedTrackKey,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  tracks: TrackSummaryItem[];
  selectedTrackKey: string;
  onSelect: (trackKey: string) => void;
}): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelector<HTMLElement>('button');
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
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950/90"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Prompt Configurator
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Select and review generator prompts
            </h2>
          </div>
          <SecondaryButton type="button" onClick={onClose} className="px-3">
            Close
          </SecondaryButton>
        </header>
        <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
          {tracks.map((track) => {
            const isActive = track.key === selectedTrackKey;
            return (
              <button
                key={track.key}
                type="button"
                onClick={() => onSelect(track.key)}
                className={`h-full rounded-2xl border px-5 py-4 text-left shadow-sm transition focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/60 ${
                  isActive
                    ? 'border-primary-brand/70 bg-primary-brand/10 text-primary-brand'
                    : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100'
                }`}
              >
                <p className="text-sm font-semibold">{track.label}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {track.description}
                </p>
                {track.promptSummary && (
                  <>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Prompt: {track.promptSummary.label}
                    </p>
                    <p className="mt-1 line-clamp-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {track.promptSummary.description}
                    </p>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {tracks.find((track) => track.key === selectedTrackKey)?.promptSummary?.preview && (
          <footer className="border-t border-slate-200 bg-slate-50/60 px-6 py-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Preview
            </p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-[11px] leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
              {tracks.find((track) => track.key === selectedTrackKey)?.promptSummary?.preview}
            </pre>
          </footer>
        )}
      </div>
    </div>
  );
}
