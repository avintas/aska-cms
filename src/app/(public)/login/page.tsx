'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/app/actions/auth';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);

    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)]" />
      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 text-white shadow-2xl shadow-emerald-500/20 backdrop-blur-2xl sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-black p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200/80">Secure Access</p>
            <h1 className="mt-6 text-4xl font-semibold">Aska Content Studio</h1>
            <p className="mt-4 text-sm text-slate-400">
              Log in to orchestrate Gemini-powered sourcing, manage libraries, and keep GMSTFWAIW badges green.
            </p>
          </div>

          <div className="mt-12 space-y-3 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <SparkleIcon className="h-4 w-4" />
              AI-assisted builders for Trivia, Wisdom, and Motivation
            </p>
            <p className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4" />
              Supabase-authenticated with RLS protection
            </p>
            <p className="flex items-center gap-2">
              <BadgeIcon className="h-4 w-4" />
              GMSTFWAIW badge tracking at a glance
            </p>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-10 text-slate-900 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.6)]">
          <div className="flex flex-col gap-3 text-slate-500">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
              ← Back to landing
            </Link>
            <h2 className="text-3xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm">Use your Aska CMS credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-brand/70 focus:ring focus:ring-primary-brand/20"
                  placeholder="you@example.com"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300">
                  @
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-brand/70 focus:ring focus:ring-primary-brand/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-brand/40 transition hover:-translate-y-0.5 hover:bg-primary-brand/90 focus:outline-none focus-visible:ring focus-visible:ring-primary-brand/70 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            Access restricted to authenticated team members
          </p>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M21 12h-4M7 12H3M18.36 5.64l-2.83 2.83M8.47 15.53l-2.83 2.83M18.36 18.36l-2.83-2.83M8.47 8.47 5.64 5.64" />
    </svg>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3 4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7l-8-4Z" />
      <path d="M9 12.5 11 14l4-4" />
    </svg>
  );
}

function BadgeIcon(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m7 11 2.2 2L17 7" />
      <path d="M21 12c0 1.02-.32 2.03-.92 2.86-.61.83-1.46 1.46-2.44 1.77l-5.64 1.73a1.3 1.3 0 0 1-.76 0L5.6 16.63a3.72 3.72 0 0 1-2.44-1.77A3.93 3.93 0 0 1 2.24 12V6.92c0-.76.59-1.4 1.34-1.47l7.76-.8a1.4 1.4 0 0 1 .32 0l7.76.8c.75.08 1.34.71 1.34 1.47V12Z" />
    </svg>
  );
}
