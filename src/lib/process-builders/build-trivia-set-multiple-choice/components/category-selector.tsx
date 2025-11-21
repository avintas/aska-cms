'use client';

import { useState, useEffect } from 'react';
import { getCategories } from '@/lib/trivia-statistics';

interface CategorySelectorProps {
  theme: string;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export default function CategorySelector({
  theme,
  selectedCategory,
  onCategorySelect,
}: CategorySelectorProps): JSX.Element | null {
  const [categories, setCategories] = useState<Array<{ category: string; available: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories(): Promise<void> {
      if (!theme || theme.trim().length < 2) {
        setCategories([]);
        return;
      }

      setLoading(true);
      try {
        // Use pre-calculated statistics from materialized view
        // This is much faster than calculating on the fly
        const categoryStats = await getCategories('multiple_choice', theme);

        // Map to the expected format
        const mappedCategories = categoryStats.map((stat) => ({
          category: stat.category,
          available: stat.published_count, // Use published_count as available
        }));

        setCategories(mappedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [theme]);

  if (!theme || theme.trim().length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Loading categories...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">No categories available for this theme</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Categories for {theme}</h4>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategorySelect('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-primary-brand text-white border-2 border-primary-brand'
              : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => onCategorySelect(cat.category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.category
                ? 'bg-primary-brand text-white border-2 border-primary-brand'
                : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'
            }`}
          >
            {cat.category}
            <span className="ml-2 text-xs opacity-75">({cat.available})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
