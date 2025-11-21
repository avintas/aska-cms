'use client';

import { useState, useEffect } from 'react';
import {
  getLandscapeStatsAction,
  getAllThemesAvailabilityAction,
} from '../lib/actions-landscape';
import type { QuestionLandscapeStats, ThemeAvailability } from '../lib/helpers/data-landscape';

interface DataLandscapePanelProps {
  theme?: string;
  onThemeSelect?: (theme: string) => void;
}

export default function DataLandscapePanel({
  theme,
  onThemeSelect,
}: DataLandscapePanelProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<ThemeAvailability[]>([]);
  const [selectedThemeStats, setSelectedThemeStats] = useState<QuestionLandscapeStats | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(theme || '');

  useEffect(() => {
    async function loadData(): Promise<void> {
      setLoading(true);
      try {
        // Load all themes
        const themesResult = await getAllThemesAvailabilityAction();
        if (themesResult.success && themesResult.data) {
          setThemes(themesResult.data);
        }

        // Load stats for selected theme if provided
        if (selectedTheme) {
          const statsResult = await getLandscapeStatsAction(selectedTheme);
          if (statsResult.success && statsResult.data) {
            setSelectedThemeStats(statsResult.data);
          }
        }
      } catch (error) {
        console.error('Error loading landscape data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedTheme]);

  const handleThemeClick = async (themeName: string): Promise<void> => {
    setSelectedTheme(themeName);
    if (onThemeSelect) {
      onThemeSelect(themeName);
    }

    const statsResult = await getLandscapeStatsAction(themeName);
    if (statsResult.success && statsResult.data) {
      setSelectedThemeStats(statsResult.data);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading data landscape...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Themes Overview */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Themes</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {themes.length === 0 ? (
            <p className="text-sm text-slate-500">No themes found</p>
          ) : (
            themes.map((themeItem) => (
              <button
                key={themeItem.theme}
                onClick={() => handleThemeClick(themeItem.theme)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTheme === themeItem.theme
                    ? 'border-primary-brand bg-primary-brand/5'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{themeItem.theme}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-semibold ${
                        themeItem.hasEnoughForSet ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {themeItem.availableQuestions}
                    </span>
                    {themeItem.hasEnoughForSet ? (
                      <span className="text-xs text-green-600">✓</span>
                    ) : (
                      <span className="text-xs text-yellow-600">⚠</span>
                    )}
                  </div>
                </div>
                {themeItem.categories.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Categories: {themeItem.categories.slice(0, 3).join(', ')}
                    {themeItem.categories.length > 3 && '...'}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected Theme Stats */}
      {selectedThemeStats && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Stats: {selectedThemeStats.theme}
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{selectedThemeStats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {selectedThemeStats.available}
              </p>
              <p className="text-xs text-slate-500">Available</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {selectedThemeStats.excluded}
              </p>
              <p className="text-xs text-slate-500">Excluded</p>
            </div>
          </div>

          {/* By Category */}
          {selectedThemeStats.byCategory.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">By Category</h4>
              <div className="space-y-2">
                {selectedThemeStats.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{cat.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">{cat.total} total</span>
                      <span className="font-semibold text-green-600">{cat.available} available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Difficulty */}
          {selectedThemeStats.byDifficulty.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">By Difficulty</h4>
              <div className="space-y-2">
                {selectedThemeStats.byDifficulty.map((diff) => (
                  <div key={diff.difficulty} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{diff.difficulty}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">{diff.total} total</span>
                      <span className="font-semibold text-green-600">
                        {diff.available} available
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

