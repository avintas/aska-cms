'use client';

import { useState, useEffect } from 'react';
import { getAllThemesAvailabilityAction } from '../lib/actions-landscape';
import type { ThemeAvailability } from '../lib/helpers/data-landscape';

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeSelect: (theme: string) => void;
}

// Theme icons mapping
const THEME_ICONS: Record<string, JSX.Element> = {
  'Players': (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  'Teams & Organizations': (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-12 18h12" />
    </svg>
  ),
  'Venues & Locations': (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  'Awards & Honors': (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.75M16.5 18.75v-3.375c0-.621.503-1.125 1.125-1.125h.75m-9 0H5.625c-.621 0-1.125.504-1.125 1.125v3.375M6 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm12 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  'Leadership & Staff': (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 01-.75-.75v-4.25m0 0l-3-3m3 3l3-3M6.75 9.75h.75m-.75 3h.75m-.75 3h.75m3-6.021h.75M6.75 18.75v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18.75m-6-7.5v-1.5m0 1.5c0 1.656 1.343 3 3 3h3m0-3v-1.5m0 1.5c0 1.656-1.343 3-3 3m-3-3h3m6-6v-1.5m0 1.5c0 1.656-1.343 3-3 3H9.75m0-3h3m0 0v-1.5" />
    </svg>
  ),
};

// Default icon for unknown themes
const DefaultIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

export default function ThemeSelector({
  selectedTheme,
  onThemeSelect,
}: ThemeSelectorProps): JSX.Element {
  const [themes, setThemes] = useState<ThemeAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThemes(): Promise<void> {
      setLoading(true);
      try {
        const result = await getAllThemesAvailabilityAction();
        if (result.success && result.data) {
          setThemes(result.data);
        }
      } catch (error) {
        console.error('Error loading themes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadThemes();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading themes...</p>
      </div>
    );
  }

  // Get unique themes (may have duplicates from different sources)
  const uniqueThemes = Array.from(
    new Map(themes.map((t) => [t.theme, t])).values()
  ).sort((a, b) => a.theme.localeCompare(b.theme));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Select Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {uniqueThemes.map((themeItem) => {
            const isSelected = selectedTheme === themeItem.theme;
            const icon = THEME_ICONS[themeItem.theme] || DefaultIcon;

            return (
              <button
                key={themeItem.theme}
                type="button"
                onClick={() => onThemeSelect(themeItem.theme)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-primary-brand bg-primary-brand/10 shadow-md scale-105'
                    : 'border-slate-200 bg-white hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-sm'
                }`}
              >
                <div
                  className={`${
                    isSelected ? 'text-primary-brand' : 'text-slate-400'
                  } transition-colors`}
                >
                  {icon}
                </div>
                <p
                  className={`text-xs font-semibold text-center leading-tight ${
                    isSelected ? 'text-primary-brand' : 'text-slate-700'
                  }`}
                >
                  {themeItem.theme.split(' & ').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
                {themeItem.availableQuestions > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {themeItem.availableQuestions} available
                  </p>
                )}
              </button>
            );
          })}
        </div>
        {uniqueThemes.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No themes available
          </p>
        )}
      </div>

      {selectedTheme && (
        <div className="text-xs text-slate-500">
          Available themes in your questions:{' '}
          {uniqueThemes.map((t) => t.theme).join(', ')}
        </div>
      )}
    </div>
  );
}

