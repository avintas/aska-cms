'use client';

import { useState } from 'react';
import type { TrueFalseTrivia } from '@aska/shared';

interface TrueFalseMiniPlayerProps {
  trivia: TrueFalseTrivia;
  onApprove?: () => void;
  onReject?: () => void;
  showApprovalButtons?: boolean;
}

export default function TrueFalseMiniPlayer({
  trivia,
  onApprove,
  onReject,
  showApprovalButtons = true,
}: TrueFalseMiniPlayerProps): JSX.Element {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleAnswerSelect = (answer: boolean): void => {
    if (hasAnswered) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
    setHasAnswered(true);
  };

  const handleReset = (): void => {
    setSelectedAnswer(null);
    setHasAnswered(false);
  };

  const isCorrect = selectedAnswer === trivia.is_true;
  const correctAnswer = trivia.is_true;

  return (
    <div className="space-y-4">
      {/* Question/Statement */}
      <div className="rounded-lg border-2 border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Statement
        </h3>
        <p className="text-base font-medium text-gray-900 leading-relaxed dark:text-gray-100">
          {trivia.question_text}
        </p>
      </div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleAnswerSelect(true)}
          disabled={hasAnswered}
          className={`rounded-lg border-2 p-4 text-lg font-bold transition-all ${
            hasAnswered
              ? selectedAnswer === true
                ? isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
                  : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                : correctAnswer
                  ? 'border-green-300 bg-green-50/50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                  : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-500'
              : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300'
          }`}
        >
          TRUE
        </button>
        <button
          type="button"
          onClick={() => handleAnswerSelect(false)}
          disabled={hasAnswered}
          className={`rounded-lg border-2 p-4 text-lg font-bold transition-all ${
            hasAnswered
              ? selectedAnswer === false
                ? isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
                  : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                : correctAnswer === false
                  ? 'border-green-300 bg-green-50/50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                  : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-500'
              : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300'
          }`}
        >
          FALSE
        </button>
      </div>

      {/* Result Display */}
      {hasAnswered && (
        <div
          className={`rounded-lg border-2 p-4 ${
            isCorrect
              ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
              : 'border-red-500 bg-red-50 dark:bg-red-950/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isCorrect ? '✓' : '✗'}</span>
            <div>
              <p
                className={`font-semibold ${
                  isCorrect
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}
              >
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              <p
                className={`text-sm ${
                  isCorrect
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                The correct answer is{' '}
                <span className="font-bold">{correctAnswer ? 'TRUE' : 'FALSE'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {trivia.explanation && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Explanation
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">
            {trivia.explanation}
          </p>
        </div>
      )}

      {/* Reset Button */}
      {hasAnswered && (
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          Try Again
        </button>
      )}

      {/* Approval Buttons */}
      {showApprovalButtons && (
        <div className="flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="flex-1 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-950/50"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

