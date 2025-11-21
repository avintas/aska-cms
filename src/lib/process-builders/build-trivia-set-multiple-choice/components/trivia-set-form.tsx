'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { buildTriviaSetMultipleChoiceAction } from '../lib/actions';
import type { ProcessBuilderResult, ProcessBuilderRules } from '../../core/types';
import ProcessMessagePanel from './process-message-panel';
import SetPreview from './set-preview';
import {
  FormCard,
  FormActions,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui/FormKit';

interface TriviaSetFormProps {
  theme: string;
  questionCount: number;
  category: string;
  allowPartial: boolean;
}

export default function TriviaSetForm({
  theme,
  questionCount,
  category,
  allowPartial,
}: TriviaSetFormProps): JSX.Element {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessBuilderResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setResult(null);

    try {
      // Build goal and rules
      const goal = {
        text: theme.trim() || 'Multiple Choice Trivia',
      };

      const rules: ProcessBuilderRules = {
        questionCount: {
          key: 'questionCount',
          value: questionCount,
          type: 'number',
        },
      };

      // Add optional rules
      if (category) {
        rules.category = {
          key: 'category',
          value: category,
          type: 'string',
        };
      }

      // Build options (including allowPartial)
      const options = {
        allowPartialResults: allowPartial,
      };

      // Call server action
      const processResult = await buildTriviaSetMultipleChoiceAction(goal, rules, options);

      setResult(processResult);

      if (processResult.status === 'success') {
        // Show preview instead of immediately redirecting
        setShowPreview(true);
      } else {
        // Collect errors
        const errorMessages = processResult.errors?.map((err) => err.message) || [];
        setErrors(errorMessages);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unexpected error occurred']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      {showPreview && result && result.status === 'success' && (
        <SetPreview
          result={result}
          onConfirm={() => {
            router.push('/process-builders/build-trivia-set');
            router.refresh();
          }}
          onCancel={() => {
            setShowPreview(false);
            setResult(null);
          }}
        />
      )}

      {/* Main Form */}
      {!showPreview && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          {/* Left Column: Main Form */}
          <div className="space-y-6">
            <FormCard>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Note: Theme Selection, Category Selection, Question Configuration, and Filters are now in Steps 1-4 of the unified page */}

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-800 mb-2">Errors</h3>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success message (only show if not showing preview) */}
                {result && result.status === 'success' && !showPreview && (
                  <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-green-800 mb-1">Success!</h3>
                        <p className="text-sm text-green-700">
                          Trivia set created successfully.
                        </p>
                        {result.warnings && result.warnings.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-green-700">Warnings:</p>
                            <ul className="list-disc list-inside text-xs text-green-600 mt-1 space-y-1">
                              {result.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings (non-success) */}
                {result &&
                  result.warnings &&
                  result.warnings.length > 0 &&
                  result.status !== 'success' && (
                    <div className="rounded-xl bg-yellow-50 border-2 border-yellow-200 p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Warnings</h3>
                          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                            {result.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Form Actions */}
                <FormActions>
                  <SecondaryButton type="button" onClick={() => router.back()} disabled={loading}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Building Trivia Set...
                      </span>
                    ) : (
                      'Build Trivia Set'
                    )}
                  </PrimaryButton>
                </FormActions>
              </form>
            </FormCard>
          </div>

          {/* Right Column: Process Messages */}
          <div className="space-y-6">
            {(loading || result) && (
              <div className="sticky top-6">
                <ProcessMessagePanel result={result} loading={loading} />
              </div>
            )}

            {/* Info Card when not processing */}
            {!loading && !result && (
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-primary-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">How It Works</h3>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-brand mt-0.5">•</span>
                        <span>Enter a theme to match questions from your library</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-brand mt-0.5">•</span>
                        <span>Configure filters to refine selection</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-brand mt-0.5">•</span>
                        <span>Review the preview before finalizing your set</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-brand mt-0.5">•</span>
                        <span>Set is created as draft for your review</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
