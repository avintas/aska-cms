'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSession } from '@/app/actions/auth';
import UserMenu from '../UserMenu';

interface ShellChromeProps {
  children: ReactNode;
  userEmail?: string;
}

interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function ShellChrome({ children, userEmail }: ShellChromeProps): JSX.Element {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState<string | undefined>(userEmail);

  useEffect((): (() => void) | void => {
    if (userEmail) {
      setResolvedEmail(userEmail);
      return;
    }

    let mounted = true;
    async function hydrateSession(): Promise<void> {
      try {
        const { user } = await getSession();
        if (mounted) {
          setResolvedEmail(user?.email ?? undefined);
        }
      } catch {
        if (mounted) {
          setResolvedEmail(undefined);
        }
      }
    }
    hydrateSession();
    return () => {
      mounted = false;
    };
  }, [userEmail]);

  const navSections = useMemo<NavSection[]>(
    () => [
      {
        title: 'Overview',
        items: [
          {
            label: 'Dashboard',
            href: '/dashboard',
            description: 'At-a-glance health, velocity, and trends.',
          },
        ],
      },
      {
        title: 'Operations',
        items: [
          {
            label: 'Sourcing',
            href: '/sourcing',
            description: 'Ingest and orchestrate source content.',
          },
          {
            label: 'Ideation',
            href: '/ideation',
            description: 'Evaluate content quality and assemble plans.',
          },
          {
            label: 'Content Browser',
            href: '/content-browser',
            description: 'Explore ingested source catalog.',
          },
          {
            label: 'Source Content Updater',
            href: '/source-content-updater',
            description: 'Refresh metadata for ingested source content.',
          },
          {
            label: 'Main Generator',
            href: '/main-generator',
            description: 'Produce shareables and trivia from curated sources.',
          },
          {
            label: 'Trivia Selector',
            href: '/trivia-selector',
            description: 'Classify and prepare trivia questions for use in sets.',
          },
          {
            label: 'Build Trivia Set',
            href: '/process-builders/build-trivia-set',
            description: 'Create curated trivia sets from questions (MC, TF, Who Am I).',
          },
          {
            label: 'Publishing',
            href: '/publishing',
            description: 'Generate and manage daily shareable schedules.',
          },
        ],
      },
      {
        title: 'Libraries',
        items: [
          { label: 'Wisdom', href: '/wisdom', description: 'Penalty Box reflections and quotes.' },
          { label: 'Greetings', href: '/greetings', description: 'H.U.G.s for the community.' },
          { label: 'Facts', href: '/facts', description: 'Shareable hockey fact nuggets.' },
          {
            label: 'Motivational',
            href: '/motivational',
            description: 'Locker-room ready motivation.',
          },
        ],
      },
      {
        title: 'Trivia',
        items: [
          {
            label: 'Multiple Choice',
            href: '/trivia-multiple-choice',
            description: '4-option bench quizzes.',
          },
          {
            label: 'True / False',
            href: '/trivia-true-false',
            description: 'Rapid fire statements.',
          },
          { label: 'Who Am I?', href: '/trivia-who-am-i', description: 'Riddle-style reveals.' },
        ],
      },
    ],
    [],
  );

  const environmentLabel = process.env.NEXT_PUBLIC_APP_ENV || 'Beta';

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-slate-50/95 px-4 py-6 shadow-sm transition-transform dark:border-slate-800 dark:bg-slate-900/80 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-brand text-lg font-bold text-white shadow-sm shadow-emerald-500/40">
              A
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                Aska
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Content Studio
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 space-y-8">
          {navSections.map((section) => (
            <nav key={section.title} aria-label={section.title} className="space-y-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500/80 dark:text-slate-400/80">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.href) && !item.disabled;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.disabled ? pathname : item.href}
                        aria-disabled={item.disabled}
                        className={[
                          'group flex flex-col rounded-xl border border-transparent px-3 py-2 transition',
                          'hover:border-primary-brand/50 hover:bg-primary-brand/10 hover:shadow-sm',
                          isActive
                            ? 'border-primary-brand/60 bg-primary-brand/10 text-primary-brand'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50',
                          item.disabled
                            ? 'cursor-not-allowed opacity-60 hover:border-transparent hover:bg-transparent'
                            : '',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                          {item.badge && !isActive && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-xs text-slate-500 transition group-hover:text-slate-600 dark:text-slate-400">
                            {item.description}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-auto rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Build Status
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            GMSTFWAIW pipeline
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">All systems nominal</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70 lg:hidden"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="hidden flex-col lg:flex">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Aska CMS
                </span>
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Hockey Content Studio
                </span>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center gap-3 lg:justify-end">
              <div className="hidden min-w-[260px] max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm transition focus-within:border-primary-brand/60 focus-within:ring focus-within:ring-primary-brand/10 dark:border-slate-800 dark:bg-slate-900 lg:flex">
                <SearchIcon className="h-4 w-4" />
                <input
                  type="text"
                  placeholder="Quick search (⌘K)"
                  className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                  readOnly
                />
                <kbd className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Preview
                </kbd>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                  {environmentLabel}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-brand/50 hover:bg-primary-brand/10 hover:text-primary-brand focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <SparkleIcon className="h-4 w-4" />
                Create
              </button>
              {resolvedEmail ? (
                <UserMenu userEmail={resolvedEmail} />
              ) : (
                <div className="hidden flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">Signed in</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Loading…</p>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-slate-50 to-white px-4 py-6 lg:px-8 lg:py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>

        <footer className="border-t border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <span>GMSTFWAIW pipeline ready · Content ingestion online</span>
            <span>© {new Date().getFullYear()} Aska Hockey Collective</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-2.6-2.6" />
    </svg>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v4M12 17v4M21 12h-4M7 12H3M18.36 5.64l-2.83 2.83M8.47 15.53l-2.83 2.83M18.36 18.36l-2.83-2.83M8.47 8.47 5.64 5.64" />
    </svg>
  );
}
