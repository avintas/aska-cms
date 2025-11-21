'use client';

import type { TrueFalseTrivia } from '@aska/shared';
import { StatusBadge } from '@/components/ui/CollectionList';

interface TrueFalseTriviaCardProps {
  trivia: TrueFalseTrivia;
  onStatusChange?: (id: number, newStatus: string) => void;
  onDelete?: (id: number) => void;
}

/**
 * Utility function to count words in a string
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Utility function to count characters in a string
 */
function countCharacters(text: string): number {
  return text.length;
}

export default function TrueFalseTriviaCard({
  trivia,
  onStatusChange,
  onDelete,
}: TrueFalseTriviaCardProps): JSX.Element {
  const questionWordCount = countWords(trivia.question_text);
  const questionCharCount = countCharacters(trivia.question_text);
  const explanationWordCount = trivia.explanation ? countWords(trivia.explanation) : 0;
  const explanationCharCount = trivia.explanation ? countCharacters(trivia.explanation) : 0;

  const totalCharCount = questionCharCount + explanationCharCount;
  const totalWordCount = questionWordCount + explanationWordCount;

  // Copy trivia to clipboard
  const handleCopy = async (): Promise<void> => {
    try {
      let textToCopy = `Statement: ${trivia.question_text}\nAnswer: ${trivia.is_true ? 'TRUE' : 'FALSE'}`;
      if (trivia.explanation) {
        textToCopy = `${textToCopy}\nExplanation: ${trivia.explanation}`;
      }
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy:', error);
      alert('Failed to copy trivia');
    }
  };

  // Handle status change (publish/unpublish/archive)
  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (!onStatusChange) return;

    try {
      const response = await fetch(`/api/true-false/${trivia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // eslint-disable-next-line no-console
        console.error('API error response:', { status: response.status, errorData });
        throw new Error(errorData.details || errorData.error || 'Failed to update status');
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.log('Status update successful:', result);

      onStatusChange(trivia.id, newStatus);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update status:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update trivia status';
      alert(`Failed to update trivia status: ${errorMessage}`);
    }
  };

  // Handle delete
  const handleDelete = async (): Promise<void> => {
    if (!onDelete) return;

    try {
      const response = await fetch(`/api/true-false/${trivia.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      onDelete(trivia.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete:', error);
      alert('Failed to delete trivia');
    }
  };

  // Determine status
  const status = trivia.status || 'unpublished';
  const isPublished = status === 'published';
  const isArchived = status === 'archived';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
      {/* Header: Status Badge and ID */}
      <div className="mb-2 flex items-center gap-2">
        <StatusBadge status={status} />
        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {trivia.id}</div>
      </div>

      {/* Question Text (Statement) */}
      <p className="mb-2 text-sm text-gray-900 leading-relaxed dark:text-gray-100">
        {trivia.question_text}
      </p>

      {/* Correct Answer (TRUE/FALSE) */}
      <div
        className={`mb-2 rounded p-2 ${
          trivia.is_true
            ? 'bg-green-50 dark:bg-green-950/30'
            : 'bg-red-50 dark:bg-red-950/30'
        }`}
      >
        <p
          className={`text-sm font-medium ${
            trivia.is_true
              ? 'text-green-900 dark:text-green-200'
              : 'text-red-900 dark:text-red-200'
          }`}
        >
          Answer: {trivia.is_true ? 'TRUE' : 'FALSE'}
        </p>
      </div>

      {/* Explanation (if present) */}
      {trivia.explanation && (
        <div className="mb-2 text-xs text-gray-600 italic dark:text-gray-400">
          <span className="font-medium">Explanation: </span>
          {trivia.explanation}
        </div>
      )}

      {/* Metadata: Category, Theme, Difficulty */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
        {trivia.category && <span>Category: {trivia.category}</span>}
        {trivia.theme && (
          <>
            {trivia.category && <span>•</span>}
            <span>Theme: {trivia.theme}</span>
          </>
        )}
        {trivia.difficulty && (
          <>
            {(trivia.category || trivia.theme) && <span>•</span>}
            <span>Difficulty: {trivia.difficulty}</span>
          </>
        )}
      </div>

      {/* Metadata: Character and Word Count */}
      <div className="mb-3 flex items-center gap-1.5 flex-wrap text-xs text-gray-500 dark:text-gray-400">
        <span>{totalCharCount} chars</span>
        <span>•</span>
        <span>{totalWordCount} words</span>
      </div>

      {/* Divider and Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap border-t border-gray-200 pt-3 dark:border-slate-800">
        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
          title="Copy to clipboard"
        >
          📋 Copy
        </button>

        {/* Status Change Buttons */}
        {!isArchived && (
          <>
            {isPublished ? (
              <button
                type="button"
                onClick={() => handleStatusChange('unpublished')}
                className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors dark:bg-yellow-900/40 dark:text-yellow-200 dark:hover:bg-yellow-900/60"
                title="Unpublish"
              >
                📥 Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('published')}
                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-900/60"
                title="Publish"
              >
                📤 Publish
              </button>
            )}

            <button
              type="button"
              onClick={() => handleStatusChange('archived')}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
              title="Archive"
            >
              🗄️ Archive
            </button>
          </>
        )}

        {/* Restore button for archived items */}
        {isArchived && (
          <button
            type="button"
            onClick={() => handleStatusChange('unpublished')}
            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
            title="Restore"
          >
            🔄 Restore
          </button>
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-950/80"
          title="Delete permanently"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

