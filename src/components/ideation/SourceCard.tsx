'use client';

import Link from 'next/link';
import type { IdeationSourceSummary, SourceUsageKey } from '@/lib/ideation';

interface SourceCardProps {
  source: IdeationSourceSummary;
}

const USAGE_META: Record<SourceUsageKey, { label: string; tone: string }> = {
  wisdom: {
    label: 'Wisdom',
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  },
  greeting: {
    label: 'Greeting',
    tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  },
  'bench-boss': {
    label: 'Bench Boss',
    tone: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  },
  'captain-heart': {
    label: 'Captain Heart',
    tone: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200',
  },
  motivational: {
    label: 'Motivational',
    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  stat: {
    label: 'Stat',
    tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
  },
  fact: {
    label: 'Fact',
    tone: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200',
  },
  'multiple-choice': {
    label: 'Multiple Choice',
    tone: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
  },
  'true-false': {
    label: 'True / False',
    tone: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  },
  'who-am-i': {
    label: 'Who Am I?',
    tone: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
};

function SourceUsageBadges({ usage }: { usage: SourceUsageKey[] }): JSX.Element {
  if (!usage || usage.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
        Unused
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {usage.map((key) => {
        const meta = USAGE_META[key];
        if (!meta) {
          // Fallback for unknown usage keys
          return (
            <span
              key={key}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
              {key}
            </span>
          );
        }
        return (
          <span
            key={key}
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.tone}`}
          >
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

export default function SourceCard({ source }: SourceCardProps): JSX.Element {
  // Copy source to clipboard
  const handleCopy = async (): Promise<void> => {
    try {
      let textToCopy = `Title: ${source.title}\nSummary: ${source.summary}`;
      if (source.category) {
        textToCopy = `${textToCopy}\nCategory: ${source.category}`;
      }
      if (source.tags.length > 0) {
        textToCopy = `${textToCopy}\nTags: ${source.tags.join(', ')}`;
      }
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy:', error);
      alert('Failed to copy source');
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-primary-brand/40 hover:bg-primary-brand/10 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{source.title}</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center rounded-full bg-primary-brand/10 px-2 py-0.5 font-semibold text-primary-brand">
              {source.theme}
            </span>
            {source.category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                {source.category}
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">ID: {source.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {new Date(source.updatedAt).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 whitespace-nowrap"
            title="Copy to clipboard"
          >
            📋 Copy
          </button>
          <Link
            href={`/main-generator?sourceId=${source.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-brand rounded-md hover:bg-primary-brand/90 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center"
            title="Select this source for content generation"
          >
            Select
          </Link>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{source.summary}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {source.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
            >
              {tag}
            </span>
          ))}
          {source.tags.length > 6 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              +{source.tags.length - 6}
            </span>
          )}
        </div>
        <SourceUsageBadges usage={source.usage} />
      </div>
    </article>
  );
}

