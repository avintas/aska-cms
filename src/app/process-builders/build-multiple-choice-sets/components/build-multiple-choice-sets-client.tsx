'use client';

import { useState } from 'react';
import { SectionCard, PrimaryButton } from '@/components/ui/FormKit';

const AVAILABLE_THEMES = [
  'Players',
  'Teams & Organizations',
  'Venues & Locations',
  'Awards & Honors',
  'Leadership & Staff',
  'Business & Finance',
  'Media, Broadcasting, & E-Sports',
  'Marketing, Sponsorship, and Merchandising',
  'Equipment & Technology',
  'Training, Health, & Wellness',
  'Fandom & Fan Culture',
  'Social Impact & Diversity',
  'Tactics & Advanced Analytics',
];

export default function BuildMultipleChoiceSetsClient(): JSX.Element {
  const [numberOfSets, setNumberOfSets] = useState(5);
  const [questionsPerSet, setQuestionsPerSet] = useState(10);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(AVAILABLE_THEMES);
  const [balanceThemes, setBalanceThemes] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<{
    success: boolean;
    setsCreated: number;
    setsFailed: number;
    message: string;
  } | null>(null);

  const handleBuildSets = async (): Promise<void> => {
    setIsBuilding(true);
    setBuildResult(null);

    try {
      const response = await fetch('/api/cron/build-automated-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfSets,
          triviaType: 'mc', // Always Multiple Choice for this page
          questions_per_set: questionsPerSet,
          themes: selectedThemes.length === AVAILABLE_THEMES.length ? null : selectedThemes,
          balance_themes: balanceThemes,
        }),
      });

      const data = await response.json();

      setBuildResult({
        success: data.success,
        setsCreated: data.setsCreated || 0,
        setsFailed: data.setsFailed || 0,
        message: data.message || 'Build completed',
      });
    } catch (error) {
      setBuildResult({
        success: false,
        setsCreated: 0,
        setsFailed: 0,
        message: error instanceof Error ? error.message : 'Build failed',
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const toggleTheme = (theme: string): void => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme],
    );
  };

  const selectAllThemes = (): void => {
    setSelectedThemes(AVAILABLE_THEMES);
  };

  const deselectAllThemes = (): void => {
    setSelectedThemes([]);
  };

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Multiple Choice Sets"
        title="Build Multiple Choice Trivia Sets"
        description="Create multiple choice trivia sets with custom configuration. Each set will be stored as a separate record in collection_trivia_sets."
      >
        <div className="mt-6 space-y-8">
          {/* Number of Sets */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Number of Sets to Build
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={numberOfSets}
              onChange={(e) => setNumberOfSets(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-primary-brand focus:outline-none focus:ring-2 focus:ring-primary-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Each set will be created as a separate record in the database.
            </p>
          </div>

          {/* Questions Per Set */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Questions Per Set
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={questionsPerSet}
              onChange={(e) => setQuestionsPerSet(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-primary-brand focus:outline-none focus:ring-2 focus:ring-primary-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Number of multiple choice questions per trivia set.
            </p>
          </div>

          {/* Theme Selection */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                Select Themes
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllThemes}
                  className="text-xs text-primary-brand hover:text-primary-brand/80"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={deselectAllThemes}
                  className="text-xs text-primary-brand hover:text-primary-brand/80"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_THEMES.map((theme) => (
                <label
                  key={theme}
                  className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedThemes.includes(theme)}
                    onChange={() => toggleTheme(theme)}
                    className="rounded border-slate-300 text-primary-brand focus:ring-primary-brand"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{theme}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Balance Themes */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={balanceThemes}
                onChange={(e) => setBalanceThemes(e.target.checked)}
                className="rounded border-slate-300 text-primary-brand focus:ring-primary-brand"
              />
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Balance Theme Distribution
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                  When enabled, questions will be evenly distributed across selected themes. When
                  disabled, selection is based purely on usage count.
                </span>
              </div>
            </label>
          </div>

          {/* Build Button */}
          <div className="flex justify-end">
            <PrimaryButton
              onClick={handleBuildSets}
              disabled={isBuilding || numberOfSets < 1 || questionsPerSet < 1}
            >
              {isBuilding ? 'Building Sets...' : `Build ${numberOfSets} Set(s)`}
            </PrimaryButton>
          </div>

          {/* Build Result */}
          {buildResult && (
            <div
              className={`rounded-xl border p-6 ${
                buildResult.success
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  buildResult.success
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-rose-900 dark:text-rose-100'
                }`}
              >
                {buildResult.success ? 'Successfully created sets!' : 'Build failed'}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sets Created</p>
                  <p
                    className={`text-2xl font-bold ${
                      buildResult.success
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {buildResult.setsCreated}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sets Failed</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {buildResult.setsFailed}
                  </p>
                </div>
              </div>
              {buildResult.message && (
                <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
                  {buildResult.message}
                </p>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

