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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [compactMode, setCompactMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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
            label: 'Main Generator',
            href: '/main-generator',
            description: 'Produce shareables and trivia from curated sources.',
          },
          {
            label: 'W-Gen',
            href: '/w-gen',
            description: 'Generate hockey wisdom content using Penalty Box Philosopher prompts.',
          },
          {
            label: 'Box Gen',
            href: '/pbp-gen',
            description: 'Generate hockey wisdom content using The Box prompts.',
          },
          {
            label: 'F-Gen',
            href: '/f-gen',
            description: 'Generate hockey facts content using fact generation prompts.',
          },
          {
            label: 'Bench Boss Gen',
            href: '/bench-gen',
            description: 'Generate tough, fair, disciplinarian directives using the Bench Boss character.',
          },
          {
            label: 'Captain Heart Gen',
            href: '/captain-heart-gen',
            description: 'Generate warm, supportive, emotional messages using the Captain Heart character.',
          },
          {
            label: 'Build Trivia Set',
            href: '/process-builders/build-trivia-set',
            description: 'Create curated trivia sets from questions (MC, TF, Who Am I).',
          },
          {
            label: 'Build Multiple Choice Sets',
            href: '/process-builders/build-multiple-choice-sets',
            description: 'Build multiple choice trivia sets with custom configuration.',
          },
          {
            label: 'Build True/False Sets',
            href: '/process-builders/build-true-false-sets',
            description: 'Build true/false trivia sets with custom configuration.',
          },
          {
            label: 'Build Mixed Sets',
            href: '/process-builders/build-mixed-sets',
            description: 'Build mixed trivia sets (MC and TF) with custom configuration.',
          },
          {
            label: 'Automated Set Builder',
            href: '/process-builders/automated-set-builder',
            description: 'Configure and manage automated daily trivia set building.',
          },
          {
            label: 'Collection Trivia Sets',
            href: '/process-builders/collection-trivia-sets',
            description: 'Review created trivia set collections.',
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


  // Filter sections and items based on search query
  const filteredNavSections = navSections;

  const toggleSection = (sectionTitle: string): void => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const toggleExpandSection = (sectionTitle: string): void => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  // Auto-expand sections with active items
  useEffect(() => {
    filteredNavSections.forEach((section) => {
      const hasActiveItem = section.items.some(
        (item) => pathname.startsWith(item.href) && !item.disabled,
      );
      if (hasActiveItem) {
        setCollapsedSections((prev) => {
          if (!prev.has(section.title)) {
            return prev; // Already expanded
          }
          const next = new Set(prev);
          next.delete(section.title);
          return next;
        });
      }
    });
  }, [pathname, filteredNavSections]);

  const ITEMS_PER_SECTION_LIMIT = 5;

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
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-slate-50/95 px-4 py-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900/80 lg:static lg:translate-x-0',
          compactMode ? 'w-20' : 'w-72',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-brand text-lg font-bold text-white shadow-sm shadow-emerald-500/40">
              A
            </div>
            {!compactMode && (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                  Aska
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  Content Studio
                </p>
              </div>
            )}
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70"
              onClick={() => setCompactMode(!compactMode)}
              aria-label={compactMode ? 'Expand sidebar' : 'Compact sidebar'}
              title={compactMode ? 'Expand sidebar' : 'Compact sidebar'}
            >
              {compactMode ? (
                <ExpandIcon className="h-4 w-4" />
              ) : (
                <CollapseIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>


        {/* Scrollable Navigation Area */}
        <div className="mt-6 flex-1 space-y-6 overflow-y-auto overscroll-contain">
          {filteredNavSections.map((section) => {
            const isCollapsed = collapsedSections.has(section.title);
            const isExpanded = expandedSections.has(section.title);
            const shouldLimitItems = section.items.length > ITEMS_PER_SECTION_LIMIT;
            const visibleItems = shouldLimitItems && !isExpanded
              ? section.items.slice(0, ITEMS_PER_SECTION_LIMIT)
              : section.items;
            const hasMoreItems = section.items.length > visibleItems.length;

            return (
              <nav key={section.title} aria-label={section.title} className="space-y-2">
                {/* Section Header with Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-left transition hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-lg"
                  aria-expanded={!isCollapsed}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500/80 dark:text-slate-400/80">
                    {section.title}
                  </p>
                  <ChevronIcon
                    className={[
                      'h-3 w-3 text-slate-400 transition-transform',
                      isCollapsed ? '-rotate-90' : '',
                    ].join(' ')}
                  />
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <ul className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = pathname.startsWith(item.href) && !item.disabled;
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.disabled ? pathname : item.href}
                            aria-disabled={item.disabled}
                            className={[
                              'group flex rounded-xl border border-transparent px-3 py-2 transition',
                              compactMode ? 'flex-row items-center gap-2' : 'flex-col',
                              'hover:border-primary-brand/50 hover:bg-primary-brand/10 hover:shadow-sm',
                              isActive
                                ? 'border-primary-brand/60 bg-primary-brand/10 text-primary-brand'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50',
                              item.disabled
                                ? 'cursor-not-allowed opacity-60 hover:border-transparent hover:bg-transparent'
                                : '',
                            ].join(' ')}
                            title={compactMode ? item.label : undefined}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={[
                                'font-semibold tracking-tight',
                                compactMode ? 'text-xs truncate' : 'text-sm',
                              ].join(' ')}>
                                {item.label}
                              </span>
                              {item.badge && !isActive && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex-shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {!compactMode && item.description && (
                              <p className="mt-1 text-xs text-slate-500 transition group-hover:text-slate-600 dark:text-slate-400 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </Link>
                        </li>
                      );
                    })}

                    {/* Show More/Less Toggle */}
                    {hasMoreItems && (
                      <li>
                        <button
                          type="button"
                          onClick={() => toggleExpandSection(section.title)}
                          className="w-full rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {isExpanded
                            ? `Show less (${section.items.length - ITEMS_PER_SECTION_LIMIT} hidden)`
                            : `Show ${section.items.length - ITEMS_PER_SECTION_LIMIT} more...`}
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </nav>
            );
          })}

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

            <div className="flex items-center gap-3">
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
            <span>Content ingestion online</span>
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



function ChevronIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CollapseIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ExpandIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
