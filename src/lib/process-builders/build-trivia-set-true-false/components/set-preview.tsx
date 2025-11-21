'use client';

import type { ProcessBuilderResult } from '../../core/types';
import type { TrueFalseQuestionData } from '../lib/types';

interface SetPreviewProps {
  result: ProcessBuilderResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SetPreview({
  result,
  onConfirm,
  onCancel,
}: SetPreviewProps): JSX.Element {
  // Extract trivia set data from result
  const triviaSet = result.finalResult as
    | { triviaSet: { question_data: TrueFalseQuestionData[]; title: string; description: string | null; question_count: number } }
    | undefined;

  const questionData = triviaSet?.triviaSet.question_data || [];
  const title = triviaSet?.triviaSet.title || 'Untitled Set';
  const description = triviaSet?.triviaSet.description || null;
  const questionCount = triviaSet?.triviaSet.question_count || 0;

  // Calculate difficulty distribution
  const difficultyCounts: Record<string, number> = {};
  questionData?.forEach((q) => {
    const diff = q.difficulty || 'Unknown';
    difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Preview: {title}</h3>
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-2xl font-bold text-slate-900">{questionCount}</p>
          <p className="text-xs text-slate-500">Questions</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {result.executionTime}ms
          </p>
          <p className="text-xs text-slate-500">Execution Time</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {result.results.filter((r) => r.success).length}/{result.results.length}
          </p>
          <p className="text-xs text-slate-500">Tasks Completed</p>
        </div>
      </div>

      {/* Difficulty Distribution */}
      {Object.keys(difficultyCounts).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Difficulty Distribution</h4>
          <div className="space-y-2">
            {Object.entries(difficultyCounts).map(([difficulty, count]) => (
              <div key={difficulty} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{difficulty}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Warnings</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions Preview */}
      {questionData && questionData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Selected Questions ({questionData.length})
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questionData.slice(0, 10).map((question, index) => (
              <div
                key={index}
                className="p-3 border border-slate-200 rounded-lg bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-900 mb-1">
                  Q{index + 1}: {question.question_text}
                </p>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <span className="font-semibold">Correct Answer:</span>{' '}
                    {question.correct_answer ? 'True' : 'False'}
                  </p>
                  {question.difficulty && (
                    <p>
                      <span className="font-semibold">Difficulty:</span> {question.difficulty}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {questionData.length > 10 && (
              <p className="text-xs text-slate-500 text-center">
                ... and {questionData.length - 10} more questions
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel & Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary-brand rounded-lg hover:bg-primary-brand/90 transition-colors"
        >
          Confirm & Create Set
        </button>
      </div>
    </div>
  );
}

