'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionCard } from '@/components/ui/FormKit';
import type { CollectionTriviaSets } from '@/shared/types/automated-set-builder';
import type { MultipleChoiceTriviaSet } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';
import type { TrueFalseTriviaSet } from '@/lib/process-builders/build-trivia-set-true-false/lib/types/trivia-set';

export default function CollectionTriviaSetsClient(): JSX.Element {
  const [collections, setCollections] = useState<CollectionTriviaSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<CollectionTriviaSets | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set());

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collection-trivia-sets?limit=100');
      const data = await response.json();

      if (data.success) {
        setCollections(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const toggleSetExpansion = (index: number): void => {
    setExpandedSets((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'partial':
        return 'text-amber-600 dark:text-amber-400';
      case 'failed':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'partial':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'failed':
        return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600 dark:text-slate-400">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Collection Trivia Sets"
        title="Review Created Sets"
        description="View trivia set collections created by the automated set builder. Each collection contains sets for a specific publish date."
      >
        <div className="mt-6 space-y-6">
          {collections.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-slate-600 dark:text-slate-400">
                No collections found. Create sets using the Automated Set Builder.
              </p>
            </div>
          ) : (
            collections.map((collection, collectionIndex) => (
              <div
                key={collection.publish_date}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(collection.publish_date)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {collection.set_count} set(s)
                    </p>
                  </div>
                </div>

                {/* Sets List */}
                {collection.sets && collection.sets.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Sets ({collection.sets.length})
                    </h4>
                    {collection.sets.map((setEntry, index) => {
                      const set = setEntry.set as MultipleChoiceTriviaSet | TrueFalseTriviaSet;
                      const uniqueKey = `${collection.publish_date}-${index}`;
                      const isExpanded = expandedSets.has(collectionIndex * 1000 + index);
                      const isMC = setEntry.type === 'mc';
                      return (
                        <div
                          key={uniqueKey}
                          className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleSetExpansion(collectionIndex * 1000 + index)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-primary-brand/10 text-primary-brand uppercase">
                                {setEntry.type}
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {set.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {set.question_count || set.question_data?.length || 0} questions
                              </span>
                              <svg
                                className={`w-5 h-5 text-slate-400 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 bg-slate-50 dark:bg-slate-900/50">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    Description
                                  </p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {set.description || 'No description'}
                                  </p>
                                </div>
                                {set.theme && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                      Theme
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                      {set.theme}
                                    </p>
                                  </div>
                                )}
                                {set.category && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                      Category
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                      {set.category}
                                    </p>
                                  </div>
                                )}
                                {set.question_data && set.question_data.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                      Questions ({set.question_data.length})
                                    </p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {set.question_data.map((q, qIndex) => (
                                        <div
                                          key={qIndex}
                                          className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3"
                                        >
                                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {qIndex + 1}. {q.question_text}
                                          </p>
                                          {setEntry.type === 'mc' && (
                                            <div className="mt-2 space-y-1">
                                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                ✓ {q.correct_answer}
                                              </p>
                                              {q.wrong_answers?.map((wa, waIndex) => (
                                                <p
                                                  key={waIndex}
                                                  className="text-xs text-slate-500 dark:text-slate-400"
                                                >
                                                  • {wa}
                                                </p>
                                              ))}
                                            </div>
                                          )}
                                          {setEntry.type === 'tf' && (
                                            <div className="mt-2">
                                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                ✓ Correct Answer:{' '}
                                                {q.correct_answer ? 'True' : 'False'}
                                              </p>
                                              {q.explanation && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                  {q.explanation}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

