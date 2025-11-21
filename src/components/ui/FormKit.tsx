'use client';

import { ComponentPropsWithoutRef, ReactNode, useState } from 'react';

export function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  collapsible = false,
  defaultExpanded = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = (): void => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl space-y-3 flex-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-brand/80">{eyebrow}</p>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            {collapsible && (
              <button
                type="button"
                onClick={handleToggle}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-brand/20"
                aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                aria-expanded={isExpanded}
              >
                <svg
                  className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {description && <p className="text-sm text-slate-500 dark:text-slate-300">{description}</p>}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
      {children && (
        <div
          className={`mt-6 transition-all duration-300 ease-in-out overflow-hidden ${
            collapsible && !isExpanded ? 'max-h-0 mt-0' : 'max-h-[9999px]'
          }`}
        >
          {(!collapsible || isExpanded) && children}
        </div>
      )}
    </section>
  );
}

export function FormCard({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div
      className={`space-y-6 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70 ${className || ''}`}
    >
      {children}
    </div>
  );
}

export function FormField({ label, htmlFor, hint, children }: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

const baseInputClasses =
  'block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-brand/60 focus:ring focus:ring-primary-brand/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100';

export function TextInput(props: ComponentPropsWithoutRef<'input'>): JSX.Element {
  return <input {...props} className={`${baseInputClasses} ${props.className || ''}`} />;
}

export function TextArea(props: ComponentPropsWithoutRef<'textarea'>): JSX.Element {
  return <textarea {...props} className={`${baseInputClasses} ${props.className || ''}`} />;
}

export function SelectInput(props: ComponentPropsWithoutRef<'select'>): JSX.Element {
  return <select {...props} className={`${baseInputClasses} ${props.className || ''}`} />;
}

export function FormActions({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">{children}</div>;
}

export function PrimaryButton({ children, className, ...rest }: ComponentPropsWithoutRef<'button'>): JSX.Element {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-brand/40 transition hover:-translate-y-0.5 hover:bg-primary-brand/90 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/60 disabled:cursor-not-allowed disabled:opacity-60 ${className || ''}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, ...rest }: ComponentPropsWithoutRef<'button'>): JSX.Element {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 ${className || ''}`}
    >
      {children}
    </button>
  );
}

export function SoftLinkButton({ children, href }: { children: ReactNode; href: string }): JSX.Element {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-primary-brand/40 hover:bg-primary-brand/10 hover:text-primary-brand dark:border-slate-800 dark:text-slate-300"
    >
      {children}
    </a>
  );
}
