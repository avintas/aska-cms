'use client';

import type { Wisdom } from '@aska/shared';
import { StatusBadge } from '@/components/ui/CollectionList';

interface PBPCardProps {
  wisdom: Wisdom;
  onStatusChange?: (id: number, newStatus: string) => void;
  onDelete?: (id: number) => void;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function countCharacters(text: string): number {
  return text.length;
}

export default function PBPCard({
  wisdom,
  onStatusChange,
  onDelete,
}: PBPCardProps): JSX.Element {
  const musingWordCount = countWords(wisdom.musing);
  const musingCharCount = countCharacters(wisdom.musing);
  const totalCharCount = musingCharCount + (wisdom.from_the_box ? countCharacters(wisdom.from_the_box) : 0);

  const handleCopy = async (): Promise<void> => {
    try {
      let textToCopy = wisdom.musing;
      if (wisdom.from_the_box) {
        textToCopy = `${textToCopy}\n\n— ${wisdom.from_the_box}`;
      }
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy:', error);
      alert('Failed to copy wisdom text');
    }
  };

  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (!onStatusChange) return;

    try {
      const response = await fetch(`/api/pbp/${wisdom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to update status');
      }

      onStatusChange(wisdom.id, newStatus);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update status:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update Box status';
      alert(`Failed to update Box status: ${errorMessage}`);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!onDelete) return;

    try {
      const response = await fetch(`/api/pbp/${wisdom.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      onDelete(wisdom.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete:', error);
      alert('Failed to delete Box entry');
    }
  };

  const status = wisdom.status || 'unpublished';
  const isPublished = status === 'published';
  const isArchived = status === 'archived';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-2 flex items-center gap-2">
        <StatusBadge status={status} />
        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {wisdom.id}</div>
      </div>

      <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-gray-100">
        {wisdom.title}
      </h3>

      <p className="mb-2 text-sm text-gray-900 leading-relaxed dark:text-gray-100">
        {wisdom.musing}
      </p>

      {wisdom.from_the_box && (
        <p className="mb-2 text-xs italic text-gray-600 dark:text-gray-400">
          — {wisdom.from_the_box}
        </p>
      )}

      <div className="mb-3 flex items-center gap-1.5 flex-wrap text-xs text-gray-500 dark:text-gray-400">
        <span>{totalCharCount} chars</span>
        <span>•</span>
        <span>{musingWordCount} words</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap border-t border-gray-200 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
          title="Copy to clipboard"
        >
          📋 Copy
        </button>

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

