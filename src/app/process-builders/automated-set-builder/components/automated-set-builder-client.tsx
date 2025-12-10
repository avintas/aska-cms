'use client';

import { useState } from 'react';
import { SectionCard, PrimaryButton } from '@/components/ui/FormKit';
import type { AutomatedSetBuilderConfig } from '@/shared/types/automated-set-builder';

interface AutomatedSetBuilderClientProps {
  initialConfig: AutomatedSetBuilderConfig | null;
}

const AVAILABLE_THEMES = [
  'Players',
  'Teams & Organizations',
  'Venues & Locations',
  'Awards & Honors',
  'Leadership & Staff',
];

type TriviaTypeOption = 'mc' | 'tf' | 'mix';

export default function AutomatedSetBuilderClient({
  initialConfig,
}: AutomatedSetBuilderClientProps): JSX.Element {
  const [triviaType, setTriviaType] = useState<TriviaTypeOption>('mc');
  const [numberOfSets, setNumberOfSets] = useState(5);
  const [questionsPerSet, setQuestionsPerSet] = useState(initialConfig?.questions_per_set ?? 10);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(
    initialConfig?.themes ?? AVAILABLE_THEMES,
  );
  const [balanceThemes, setBalanceThemes] = useState(initialConfig?.balance_themes ?? true);
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
          triviaType,
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
        eyebrow="Automated Set Builder"
        title="Build Trivia Sets"
        description="Configure settings and build trivia sets. Sets will be created and stored in the collection_trivia_sets table."
      >
        <div className="mt-6 space-y-8">
          {/* Trivia Type Selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Trivia Type
            </h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTriviaType('mc')}
                className={`flex-1 rounded-xl border-2 p-4 transition-all ${
                  triviaType === 'mc'
                    ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70'
                }`}
              >
                <div className="text-center">
                  <div
                    className={`text-lg font-bold mb-1 ${
                      triviaType === 'mc' ? 'text-primary-brand' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    Multiple Choice
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Create only MC sets
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTriviaType('tf')}
                className={`flex-1 rounded-xl border-2 p-4 transition-all ${
                  triviaType === 'tf'
                    ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70'
                }`}
              >
                <div className="text-center">
                  <div
                    className={`text-lg font-bold mb-1 ${
                      triviaType === 'tf' ? 'text-primary-brand' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    True/False
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Create only TF sets
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTriviaType('mix')}
                className={`flex-1 rounded-xl border-2 p-4 transition-all ${
                  triviaType === 'mix'
                    ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70'
                }`}
              >
                <div className="text-center">
                  <div
                    className={`text-lg font-bold mb-1 ${
                      triviaType === 'mix' ? 'text-primary-brand' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    Mix
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Mix of MC and TF sets
                  </div>
                </div>
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {triviaType === 'mix'
                ? 'Sets will alternate between Multiple Choice and True/False types'
                : `All sets will be ${triviaType === 'mc' ? 'Multiple Choice' : 'True/False'} type`}
            </p>
          </div>

          {/* Configuration Settings */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Build Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="number-of-sets"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Number of Sets to Build
                    </label>
                    <input
                      id="number-of-sets"
                      type="number"
                      min="1"
                      max="50"
                      value={numberOfSets}
                      onChange={(e) => setNumberOfSets(parseInt(e.target.value, 10) || 1)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-brand/60 focus:ring focus:ring-primary-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      How many trivia sets to create in this build
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="questions-per-set"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Questions Per Set
                    </label>
                    <input
                      id="questions-per-set"
                      type="number"
                      min="1"
                      max="100"
                      value={questionsPerSet}
                      onChange={(e) => setQuestionsPerSet(parseInt(e.target.value, 10) || 1)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-brand/60 focus:ring focus:ring-primary-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Number of questions in each trivia set
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Theme Selection
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllThemes}
                      className="text-xs font-medium text-primary-brand hover:text-primary-brand/80"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={deselectAllThemes}
                      className="text-xs font-medium text-primary-brand hover:text-primary-brand/80"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_THEMES.map((theme) => (
                    <label
                      key={theme}
                      className="flex items-center space-x-3 cursor-pointer rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedThemes.includes(theme)}
                        onChange={() => toggleTheme(theme)}
                        className="h-4 w-4 rounded border-slate-300 text-primary-brand focus:ring-primary-brand"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{theme}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {selectedThemes.length === 0
                    ? '⚠️ No themes selected. Select themes to include in sets.'
                    : selectedThemes.length === AVAILABLE_THEMES.length
                      ? 'All themes will be included (balanced distribution)'
                      : `${selectedThemes.length} theme(s) selected`}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Theme Balancing
                </h3>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={balanceThemes}
                    onChange={(e) => setBalanceThemes(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-brand focus:ring-primary-brand"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Enforce balanced theme distribution
                  </span>
                </label>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  When enabled, questions will be evenly distributed across selected themes. When
                  disabled, questions are selected based on usage count only.
                </p>
              </div>
            </div>
          </div>

          {/* Build Button */}
          <div className="flex gap-3">
            <PrimaryButton
              onClick={handleBuildSets}
              disabled={isBuilding || selectedThemes.length === 0}
              className="flex-1"
            >
              {isBuilding ? 'Building Sets...' : `Build ${numberOfSets} Set(s)`}
            </PrimaryButton>
          </div>

          {/* Build Result */}
          {buildResult && (
            <div
              className={`rounded-xl border px-6 py-4 ${
                buildResult.success
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  buildResult.success
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : 'text-amber-800 dark:text-amber-200'
                }`}
              >
                {buildResult.message}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sets Created</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {buildResult.setsCreated}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sets Failed</p>
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                    {buildResult.setsFailed}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
