import { ReactNode } from 'react';

const highlights = [
  {
    title: 'Active Builders',
    value: '7',
    trend: '+2 vs. yesterday',
    tone: 'positive',
    description: 'Gemini orchestrations running now',
  },
  {
    title: 'Sources in QA',
    value: '12',
    trend: '4 require review',
    tone: 'neutral',
    description: 'Awaiting GMSTFWAIW confirmation',
  },
  {
    title: 'Latest Release',
    value: 'v0.4.2',
    trend: 'Shipped 3 hours ago',
    tone: 'positive',
    description: 'Includes Trivia library polish',
  },
];

const pipeline = [
  {
    label: 'Facts table',
    status: 'Healthy',
    color: 'emerald',
    notes: 'Facts collection operational',
  },
  {
    label: 'Metadata extraction',
    status: 'Monitoring',
    color: 'sky',
    notes: '429 events: 1 in last 24h',
  },
  {
    label: 'Trivia builds',
    status: 'Healthy',
    color: 'violet',
    notes: 'All queues under 20 tasks',
  },
  {
    label: 'Publishing sync',
    status: 'Attention',
    color: 'amber',
    notes: 'Review 2 pending drafts',
  },
];

const upcoming = [
  {
    title: 'Automate H.U.G.s from community submissions',
    owner: 'Motivation Pod',
    eta: 'Due Friday',
  },
  {
    title: 'Add badging to Source Library dashboard',
    owner: 'Insights Team',
    eta: 'Due Monday',
  },
  {
    title: 'Gemini prompt rotation automation',
    owner: 'Builders',
    eta: 'Planning',
  },
];

export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">
              Game Day Overview
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 md:text-4xl">
              Welcome back to the control room.
            </h1>
            <p className="max-w-xl text-sm text-slate-500 dark:text-slate-300">
              Track the GMSTFWAIW pipeline, monitor sourcing velocity, and keep trivia drops
              rolling. This is your ground truth for everything the community sees.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.title}
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-xs font-medium text-emerald-500 dark:text-emerald-300">
                  {item.trend}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 text-white shadow-2xl shadow-emerald-500/10 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
            Pipeline Health
          </p>
          <ul className="mt-6 space-y-4">
            {pipeline.map((step) => (
              <li
                key={step.label}
                className="flex items-start justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-emerald-100/85">{step.notes}</p>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  {step.status}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs text-white/80">
            GMSTFWAIW badge compliance at <span className="font-semibold text-white">95%</span> ·
            Refresh prompts weekly to keep extraction accurate.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              In-flight Sources
            </h2>
            <LinkPill href="/sourcing">View sourcing board</LinkPill>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Recently ingested content awaiting AI enrichment review.
          </p>
          <div className="mt-6 space-y-4">
            {[
              'Original Six season preview',
              'Goalie mind games feature',
              'Community spotlight: blue line mums',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-primary-brand/50 hover:bg-primary-brand/5 dark:border-slate-800 dark:text-slate-200"
              >
                <span>{item}</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  Clean
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Upcoming Plays
            </h2>
            <LinkPill href="/prompts">Open prompt library</LinkPill>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Strategic moves we’re prepping for the next sprint.
          </p>
          <ul className="mt-6 space-y-4">
            {upcoming.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:text-slate-200"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.owner} ·{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.eta}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function LinkPill({ href, children }: { href: string; children: ReactNode }): JSX.Element {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-primary-brand/40 hover:bg-primary-brand/10 hover:text-primary-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      {children}
      <ArrowIcon className="h-3.5 w-3.5" />
    </a>
  );
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
