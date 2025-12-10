'use client';

import { useEffect, useRef } from 'react';
import type { WhoAmITrivia } from '@aska/shared';
import { StatusBadge } from '@/components/ui/CollectionList';

interface WhoAmITriviaModalProps {
  trivia: WhoAmITrivia | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: number, newStatus: string) => void;
  onDelete?: (id: number) => void;
}

export default function WhoAmITriviaModal({
  trivia,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: WhoAmITriviaModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !trivia) return null;

  // Copy trivia to clipboard
  const handleCopy = async (): Promise<void> => {
    try {
      let textToCopy = `Question: ${trivia.question_text}\nAnswer: ${trivia.correct_answer}`;
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

  // Handle status change
  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (!onStatusChange) return;

    try {
      const response = await fetch(`/api/who-am-i/${trivia.id}`, {
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
      onClose();
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

    if (!confirm('Are you sure you want to delete this trivia question?')) {
      return;
    }

    try {
      const response = await fetch(`/api/who-am-i/${trivia.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      onDelete(trivia.id);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete:', error);
      alert('Failed to delete trivia');
    }
  };

  const status = trivia.status || 'unpublished';
  const isPublished = status === 'published';
  const isArchived = status === 'archived';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Trivia Question #{trivia.id}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Question Text */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question
            </h3>
            <p className="text-base text-gray-900 leading-relaxed dark:text-gray-100">
              {trivia.question_text}
            </p>
          </div>

          {/* Correct Answer */}
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Answer
            </h3>
            <p className="text-base text-blue-800 dark:text-blue-100">
              {trivia.correct_answer}
            </p>
          </div>

          {/* Explanation */}
          {trivia.explanation && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Explanation
              </h3>
              <p className="text-sm text-gray-600 italic dark:text-gray-400">
                {trivia.explanation}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {trivia.category && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {trivia.category}
                  </span>
                </div>
              )}
              {trivia.theme && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Theme:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {trivia.theme}
                  </span>
                </div>
              )}
              {trivia.difficulty && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {trivia.difficulty}
                  </span>
                </div>
              )}
              {trivia.tags && trivia.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Tags:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {trivia.tags.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            📋 Copy
          </button>

          <div className="flex items-center gap-2">
            {/* Status Change Buttons */}
            {!isArchived && (
              <>
                {isPublished ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('unpublished')}
                    className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors dark:bg-yellow-900/40 dark:text-yellow-200 dark:hover:bg-yellow-900/60"
                  >
                    📥 Unpublish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('published')}
                    className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-900/60"
                  >
                    📤 Publish
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleStatusChange('archived')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
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
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
              >
                🔄 Restore
              </button>
            )}

            {/* Delete Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-950/80"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

