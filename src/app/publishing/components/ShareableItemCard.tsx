'use client';

import { StatusBadge } from '@/components/ui/CollectionList';

interface ShareableItem {
  id: number;
  quote?: string;
  fact?: string;
  fact_text?: string;
  stat_text?: string;
  title?: string;
  musing?: string;
  from_the_box?: string;
  author?: string | null;
  context?: string | null;
  attribution?: string | null;
  status?: string;
  [key: string]: unknown;
}

interface ShareableItemCardProps {
  item: ShareableItem;
  contentType: 'motivational' | 'facts' | 'wisdom';
  onStatusChange?: (id: number, newStatus: string) => void;
  onDelete?: (id: number) => void;
  onRemove?: (id: number) => void;
}

export default function ShareableItemCard({
  item,
  contentType,
  onStatusChange,
  onDelete,
  onRemove,
}: ShareableItemCardProps): JSX.Element {
  const displayText: string =
    (typeof item.quote === 'string' ? item.quote : '') ||
    (typeof item.fact_text === 'string' ? item.fact_text : '') ||
    (typeof item.fact === 'string' ? item.fact : '') ||
    (typeof item.stat_text === 'string' ? item.stat_text : '') ||
    (typeof item.title === 'string' ? item.title : '') ||
    '';
  const status = item.status || 'unpublished';
  const isPublished = status === 'published';
  const isArchived = status === 'archived';

  // Copy to clipboard
  const handleCopy = async (): Promise<void> => {
    try {
      let textToCopy: string = '';
      if (contentType === 'wisdom') {
        if (item.title && typeof item.title === 'string') {
          textToCopy = item.title;
        }
        if (item.musing && typeof item.musing === 'string') {
          textToCopy = textToCopy ? `${textToCopy}\n\n${item.musing}` : item.musing;
        }
        if (item.from_the_box && typeof item.from_the_box === 'string') {
          textToCopy = textToCopy ? `${textToCopy}\n\n${item.from_the_box}` : item.from_the_box;
        }
      } else {
        textToCopy = displayText;
        if (item.author && typeof item.author === 'string') {
          textToCopy = `${textToCopy}\n— ${item.author}`;
        }
        if (item.context && typeof item.context === 'string') {
          textToCopy = `${textToCopy}\n${item.context}`;
        }
      }
      if (item.attribution && typeof item.attribution === 'string') {
        textToCopy = `${textToCopy}\nSource: ${item.attribution}`;
      }
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (!onStatusChange) return;

    try {
      let apiEndpoint: string;
      if (contentType === 'motivational') {
        apiEndpoint = `/api/motivational/${item.id}`;
      } else if (contentType === 'facts') {
        apiEndpoint = `/api/facts/${item.id}`;
      } else {
        apiEndpoint = `/api/wisdom/${item.id}`;
      }
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          details?: string;
          error?: string;
        };
        throw new Error(errorData.details || errorData.error || 'Failed to update status');
      }

      onStatusChange(item.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      alert(`Failed to update status: ${errorMessage}`);
    }
  };

  // Handle delete
  const handleDelete = async (): Promise<void> => {
    if (!onDelete) return;

    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      let apiEndpoint: string;
      if (contentType === 'motivational') {
        apiEndpoint = `/api/motivational/${item.id}`;
      } else if (contentType === 'facts') {
        apiEndpoint = `/api/facts/${item.id}`;
      } else {
        apiEndpoint = `/api/wisdom/${item.id}`;
      }
      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete item');
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
      {/* Header: Status Badge and ID */}
      <div className="mb-2 flex items-center gap-2">
        <StatusBadge status={status} />
        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {item.id}</div>
      </div>

      {/* Content */}
      <div className="mb-2">
        {contentType === 'wisdom' ? (
          <div className="space-y-2">
            {item.title && typeof item.title === 'string' && (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
            )}
            {item.musing && typeof item.musing === 'string' && (
              <p className="text-sm text-gray-900 leading-relaxed dark:text-gray-100">{item.musing}</p>
            )}
            {item.from_the_box && typeof item.from_the_box === 'string' && (
              <p className="text-xs italic text-gray-700 dark:text-gray-300">{item.from_the_box}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-900 leading-relaxed dark:text-gray-100">
            {contentType === 'motivational' ? `"${displayText}"` : displayText}
          </p>
        )}
      </div>

      {/* Author - who said the quote */}
      {item.author && typeof item.author === 'string' && (
        <p className="mb-2 text-xs italic text-gray-700 dark:text-gray-300 font-medium">
          — {item.author}
        </p>
      )}

      {/* Context */}
      {item.context && typeof item.context === 'string' && (
        <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{item.context}</p>
      )}

      {/* Attribution - source/where we found it */}
      {item.attribution && typeof item.attribution === 'string' && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">Source: {item.attribution}</p>
      )}

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

        {/* Remove from Set Button */}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded hover:bg-orange-100 transition-colors dark:bg-orange-900/40 dark:text-orange-200 dark:hover:bg-orange-900/60"
            title="Remove from set"
          >
            ➖ Remove
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
