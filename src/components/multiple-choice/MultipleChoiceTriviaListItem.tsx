'use client';

import type { MultipleChoiceTrivia } from '@aska/shared';
import { StatusBadge } from '@/components/ui/CollectionList';

interface MultipleChoiceTriviaListItemProps {
  trivia: MultipleChoiceTrivia;
  onStatusChange?: (id: number, newStatus: string) => void;
  onDelete?: (id: number) => void;
  onClick?: (trivia: MultipleChoiceTrivia) => void;
}

export default function MultipleChoiceTriviaListItem({
  trivia,
  onStatusChange,
  onDelete,
  onClick,
}: MultipleChoiceTriviaListItemProps): JSX.Element {
  // Handle status change (publish/unpublish/archive)
  const handleStatusChange = async (
    e: React.MouseEvent<HTMLButtonElement>,
    newStatus: string,
  ): Promise<void> => {
    e.stopPropagation(); // Prevent triggering onClick
    if (!onStatusChange) return;

    try {
      const response = await fetch(`/api/multiple-choice/${trivia.id}`, {
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
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation(); // Prevent triggering onClick
    if (!onDelete) return;

    if (!confirm('Are you sure you want to delete this trivia question?')) {
      return;
    }

    try {
      const response = await fetch(`/api/multiple-choice/${trivia.id}`, {
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

  // Truncate question text for preview
  const questionPreview =
    trivia.question_text.length > 120
      ? `${trivia.question_text.substring(0, 120)}...`
      : trivia.question_text;

  return (
    <div
      onClick={() => onClick?.(trivia)}
      className="group rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-gray-300 cursor-pointer dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side: Question preview and metadata */}
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs text-gray-500 dark:text-gray-400">ID: {trivia.id}</span>
            {trivia.category && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {trivia.category}
              </span>
            )}
            {trivia.theme && (
              <span className="text-xs text-gray-500 dark:text-gray-400">• {trivia.theme}</span>
            )}
          </div>
          <p className="text-sm text-gray-900 leading-relaxed dark:text-gray-100">
            {questionPreview}
          </p>
        </div>

        {/* Right side: Quick action buttons */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Status Change Buttons */}
          {!isArchived && (
            <>
              {isPublished ? (
                <button
                  type="button"
                  onClick={(e) => handleStatusChange(e, 'unpublished')}
                  className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors dark:bg-yellow-900/40 dark:text-yellow-200 dark:hover:bg-yellow-900/60"
                  title="Unpublish"
                >
                  📥
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleStatusChange(e, 'published')}
                  className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-900/60"
                  title="Publish"
                >
                  📤
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleStatusChange(e, 'archived')}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                title="Archive"
              >
                🗄️
              </button>
            </>
          )}

          {/* Restore button for archived items */}
          {isArchived && (
            <button
              type="button"
              onClick={(e) => handleStatusChange(e, 'unpublished')}
              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
              title="Restore"
            >
              🔄
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-950/80"
            title="Delete permanently"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

