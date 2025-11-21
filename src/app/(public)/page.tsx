import Link from 'next/link';

export default function LandingPage(): JSX.Element {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24 sm:py-32 lg:px-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200/80">
                Aska CMS
              </p>
              <p className="text-2xl font-semibold text-white">Hockey Content Studio</p>
            </div>
          </div>

          <h1 className="mt-10 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Build engaging hockey stories with AI-assisted workflows.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-200/90">
            From wisdom and greetings to trivia sets and stat blasts—centralize every content stream in
            a single, secure control room. Tailored for editors, community teams, and builders.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm font-semibold">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus-visible:ring focus-visible:ring-emerald-300"
            >
              Access CMS
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <a
              href="https://onlyhockey.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-white/90 transition hover:border-white hover:text-white"
            >
              Visit Onlyhockey.com
              <ExternalIcon className="h-4 w-4" />
            </a>
          </div>

          <dl className="mt-12 flex flex-wrap gap-6 text-xs uppercase tracking-wide text-white/60">
            <div className="rounded-lg border border-white/10 px-3 py-2">
              <dt>Collections</dt>
              <dd className="mt-1 text-base font-semibold text-white">Wisdom · Greetings · Stats · Motivation</dd>
            </div>
            <div className="rounded-lg border border-white/10 px-3 py-2">
              <dt>Builders</dt>
              <dd className="mt-1 text-base font-semibold text-white">Gemini AI pipelines &amp; GMSTFWAIW</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ExternalIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}
