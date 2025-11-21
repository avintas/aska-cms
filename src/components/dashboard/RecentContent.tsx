'use client';

import { FC } from 'react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  type: 'trivia-set' | 'content' | 'question';
  status: 'draft' | 'published' | 'archived';
  updatedAt: string;
}

interface RecentContentProps {
  items: ContentItem[];
}

const RecentContent: FC<RecentContentProps> = ({ items }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string): string => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Content</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-500 mb-3">No recent content</p>
            <Link
              href="/content/new"
              className="inline-block text-sm text-primary-brand hover:text-primary-brand/80 font-medium"
            >
              Create your first content →
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="block px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{getTypeLabel(item.type)}</span>
                    <span>•</span>
                    <span>{formatDate(item.updatedAt)}</span>
                  </div>
                </div>
                <span
                  className={`ml-4 px-2 py-1 text-xs font-medium rounded border ${getStatusColor(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <Link
            href="/content"
            className="text-sm text-primary-brand hover:text-primary-brand/80 font-medium"
          >
            View all content →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentContent;
