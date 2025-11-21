'use client';

import { useState, useEffect } from 'react';
import { SectionCard } from '@/components/ui/FormKit';
import TriviaSetFormMC from '@/lib/process-builders/build-trivia-set-multiple-choice/components/trivia-set-form';
import TriviaSetFormTF from '@/lib/process-builders/build-trivia-set-true-false/components/trivia-set-form';
import TriviaSetFormWAI from '@/lib/process-builders/build-trivia-set-who-am-i/components/trivia-set-form';
import type { CategoryStat } from '@/lib/trivia-statistics';
import {
  getThemeCountAction,
  getCategoryCountAction,
} from '@/lib/trivia-statistics/actions';
import type { TriviaType as TriviaTypeLib } from '@/lib/trivia-statistics';

type TriviaType = 'mc' | 'tf' | 'who-am-i';
type Theme = 'Players' | 'Teams & Organizations' | 'Venues & Locations' | 'Awards & Honors' | 'Leadership & Staff';

interface BuildTriviaSetClientProps {
  initialCategories: Record<string, CategoryStat[]>; // Key: "triviaType-theme", Value: categories
}

export default function BuildTriviaSetClient({
  initialCategories,
}: BuildTriviaSetClientProps): JSX.Element {
  const [selectedType, setSelectedType] = useState<TriviaType>('mc');
  const [selectedTheme, setSelectedTheme] = useState<Theme | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [allowPartial, setAllowPartial] = useState<boolean>(true);
  const [availableQuestions, setAvailableQuestions] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Get categories for current selection
  const getCategoriesKey = (type: TriviaType, theme: string): string => {
    const typeMap: Record<TriviaType, string> = {
      mc: 'multiple_choice',
      tf: 'true_false',
      'who-am-i': 'who_am_i',
    };
    return `${typeMap[type]}-${theme}`;
  };

  const currentCategories =
    selectedTheme && selectedType
      ? initialCategories[getCategoriesKey(selectedType, selectedTheme)] || []
      : [];

  // Convert UI trivia type to library trivia type
  const getTriviaTypeLib = (type: TriviaType): TriviaTypeLib => {
    const typeMap: Record<TriviaType, TriviaTypeLib> = {
      mc: 'multiple_choice',
      tf: 'true_false',
      'who-am-i': 'who_am_i',
    };
    return typeMap[type];
  };

  // Fetch available question count when selections change
  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (!selectedTheme || !selectedType) {
        setAvailableQuestions(null);
        return;
      }

      setIsLoadingCount(true);
      try {
        const triviaTypeLib = getTriviaTypeLib(selectedType);

        if (selectedCategory) {
          // Get count for specific category
          const result = await getCategoryCountAction(
            triviaTypeLib,
            selectedTheme,
            selectedCategory,
          );
          if (result.success) {
            setAvailableQuestions(result.data);
          } else {
            setAvailableQuestions(0);
          }
        } else {
          // Get count for entire theme
          const result = await getThemeCountAction(triviaTypeLib, selectedTheme);
          if (result.success) {
            setAvailableQuestions(result.data);
          } else {
            setAvailableQuestions(0);
          }
        }
      } catch (error) {
        console.error('Error fetching question count:', error);
        setAvailableQuestions(0);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchQuestionCount();
  }, [selectedType, selectedTheme, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Information Panel - Available Questions */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Available Questions
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {selectedTheme && selectedType
                ? selectedCategory
                  ? `${selectedType.toUpperCase()} · ${selectedTheme} · ${selectedCategory}`
                  : `${selectedType.toUpperCase()} · ${selectedTheme}`
                : 'Select a trivia type and theme to see available questions'}
            </p>
          </div>
          <div className="text-right">
            {!selectedTheme || !selectedType ? (
              <>
                <div className="text-2xl font-bold text-blue-400 dark:text-blue-500">
                  —
                </div>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  make selections
                </p>
              </>
            ) : isLoadingCount ? (
              <>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 animate-pulse">
                  ...
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  loading
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {availableQuestions !== null ? availableQuestions.toLocaleString() : '—'}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {availableQuestions !== null && availableQuestions === 1 ? 'question' : 'questions'} available
                </p>
              </>
            )}
          </div>
        </div>
        {selectedTheme && selectedType && availableQuestions !== null && (
          <>
            {availableQuestions > 0 && questionCount > availableQuestions && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  {allowPartial
                    ? `⚠️ You've requested ${questionCount} questions, but only ${availableQuestions} ${availableQuestions === 1 ? 'is' : 'are'} available. A partial set will be created.`
                    : `⚠️ You've requested ${questionCount} questions, but only ${availableQuestions} ${availableQuestions === 1 ? 'is' : 'are'} available. Enable "Allow Partial Sets" to proceed.`}
                </p>
              </div>
            )}
            {availableQuestions === 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  ⚠️ No questions available for this selection. Please choose a different theme or category.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <SectionCard
        eyebrow="Process Builder"
        title="Build Trivia Set"
        description="Automatically create a trivia set by selecting questions that match your theme and criteria"
      >
        {/* Trivia Type Selector - Eyebrow Container */}
        <div className="mb-8 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">
              1
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-brand/80">
              Select Trivia Type
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedType('mc');
                setSelectedCategory(''); // Reset category when type changes
              }}
              className={`flex-1 rounded-xl border-2 p-6 transition-all ${
                selectedType === 'mc'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-2xl font-bold mb-2 ${
                    selectedType === 'mc' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  MC
                </div>
                <div className="text-sm text-slate-600">Multiple Choice</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedType('tf');
                setSelectedCategory('');
              }}
              className={`flex-1 rounded-xl border-2 p-6 transition-all ${
                selectedType === 'tf'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-2xl font-bold mb-2 ${
                    selectedType === 'tf' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  TF
                </div>
                <div className="text-sm text-slate-600">True / False</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedType('who-am-i');
                setSelectedCategory('');
              }}
              className={`flex-1 rounded-xl border-2 p-6 transition-all ${
                selectedType === 'who-am-i'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-2xl font-bold mb-2 ${
                    selectedType === 'who-am-i' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  Who Am I
                </div>
                <div className="text-sm text-slate-600">Riddles</div>
              </div>
            </button>
          </div>
        </div>

        {/* Theme Selector - Eyebrow Container */}
        <div className="mb-8 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">
              2
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-brand/80">
              Select Theme
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedTheme('Players');
                setSelectedCategory('');
              }}
              className={`rounded-xl border-2 p-6 transition-all ${
                selectedTheme === 'Players'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-bold mb-2 ${
                    selectedTheme === 'Players' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  Players
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTheme('Teams & Organizations');
                setSelectedCategory('');
              }}
              className={`rounded-xl border-2 p-6 transition-all ${
                selectedTheme === 'Teams & Organizations'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-bold mb-2 ${
                    selectedTheme === 'Teams & Organizations' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  Teams & Organizations
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTheme('Venues & Locations');
                setSelectedCategory('');
              }}
              className={`rounded-xl border-2 p-6 transition-all ${
                selectedTheme === 'Venues & Locations'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-bold mb-2 ${
                    selectedTheme === 'Venues & Locations' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  Venues & Locations
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTheme('Leadership & Staff');
                setSelectedCategory('');
              }}
              className={`rounded-xl border-2 p-6 transition-all ${
                selectedTheme === 'Leadership & Staff'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-bold mb-2 ${
                    selectedTheme === 'Leadership & Staff' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  Leadership & Staff
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTheme('Awards & Honors');
                setSelectedCategory('');
              }}
              className={`rounded-xl border-2 p-6 transition-all ${
                selectedTheme === 'Awards & Honors'
                  ? 'border-primary-brand bg-primary-brand/10 shadow-lg scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-bold mb-2 ${
                    selectedTheme === 'Awards & Honors' ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  Awards & Honors
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Category Tags - Step 3 */}
        {selectedTheme && (
          <div className="mb-8 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">
                3
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-brand/80">
                Select Category
              </p>
            </div>
            {currentCategories.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">No categories available for this theme</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selectedCategory === ''
                      ? 'border-primary-brand bg-primary-brand/10 text-primary-brand'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-brand/40 hover:text-primary-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All Categories
                </button>
                {currentCategories.map((cat) => {
                  const isActive = selectedCategory === cat.category;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => setSelectedCategory(cat.category)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        isActive
                          ? 'border-primary-brand bg-primary-brand/10 text-primary-brand'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-brand/40 hover:text-primary-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {cat.category} · {cat.published_count}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Configure Set - Step 4 */}
        {selectedTheme && (
          <div className="mb-8 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">
                4
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-brand/80">
                Configure Set
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Panel: Question Configuration */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Question Configuration</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="questionCount" className="block text-sm font-semibold text-slate-700 mb-2">
                      Question Count
                    </label>
                    <input
                      id="questionCount"
                      type="number"
                      min="1"
                      max="100"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value, 10) || 10)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-brand/60 focus:ring focus:ring-primary-brand/20"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">Number of questions (1-100)</p>
                  </div>

                </div>
              </div>

              {/* Right Panel: Set Options */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Set Options</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="allowPartial" className="block text-sm font-semibold text-slate-700 mb-2">
                      Allow Partial Sets
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="allowPartial"
                          checked={allowPartial}
                          onChange={(e) => setAllowPartial(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-brand focus:ring-primary-brand"
                        />
                        <label htmlFor="allowPartial" className="text-sm font-medium text-slate-700">
                          Allow Partial Sets
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">
                        {allowPartial
                          ? 'If there are not enough questions available, create a set with the available questions.'
                          : 'Only create a set if enough questions are available. Otherwise, return an error.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Content Based on Selection */}
        <div className="mt-8">
          {selectedType === 'mc' && selectedTheme && (
            <TriviaSetFormMC
              theme={selectedTheme}
              questionCount={questionCount}
              category={selectedCategory}
              allowPartial={allowPartial}
            />
          )}
          {selectedType === 'tf' && selectedTheme && (
            <TriviaSetFormTF
              theme={selectedTheme}
              questionCount={questionCount}
              category={selectedCategory}
              allowPartial={allowPartial}
            />
          )}
          {selectedType === 'who-am-i' && selectedTheme && (
            <TriviaSetFormWAI
              theme={selectedTheme}
              questionCount={questionCount}
              category={selectedCategory}
              allowPartial={allowPartial}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

