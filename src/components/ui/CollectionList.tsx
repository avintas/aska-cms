import { ReactNode } from 'react';
import Link from 'next/link';

export function MetricCard({
  label,
  value,
  tone,
  note,
  href,
  active,
}: {
  label: string;
  value: number | string;
  tone: 'positive' | 'warning' | 'neutral';
  note?: string;
  href?: string;
  active?: boolean;
}): JSX.Element {
  const toneClasses = {
    positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200',
  } as const;

  const baseClasses =
    'rounded-2xl border bg-white px-6 py-5 shadow-sm transition dark:bg-slate-900/70';
  const borderClasses = active
    ? 'border-sky-500 border-2 shadow-md dark:border-sky-400'
    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
  const cursorClasses = href ? 'cursor-pointer hover:shadow-md' : '';

  const content = (
    <div className={`${baseClasses} ${borderClasses} ${cursorClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {note && (
        <span
          className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses[tone]}`}
        >
          {note}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function StatusBadge({ status }: { status: string | null }): JSX.Element {
  const normalized = status || 'unpublished';

  // Map status to display label
  const statusLabels: Record<string, string> = {
    published: 'Published',
    unpublished: 'Unpublished',
    archived: 'Archived',
    draft: 'Unpublished', // Support old 'draft' values during migration
  };

  const displayLabel = statusLabels[normalized] || normalized;

  const toneMap: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    unpublished: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    archived: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200', // Support old 'draft' during migration
  };

  const base =
    toneMap[normalized] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${base}`}
    >
      {displayLabel}
    </span>
  );
}

export function TagPill({ children }: { children: ReactNode }): JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 px-10 py-16 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-brand/10 text-primary-brand">
          {icon}
        </div>
      )}
      <div>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      {action}
    </div>
  );
}
