'use client';

import { useState, useEffect } from 'react';
import { getAllThemesAvailabilityAction } from '../lib/actions-landscape';

interface AvailabilityIndicatorProps {
  theme: string;
  questionCount: number;
  category?: string;
}

export default function AvailabilityIndicator({
  theme,
  questionCount,
  category,
}: AvailabilityIndicatorProps): JSX.Element | null {
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAvailability(): Promise<void> {
      if (!theme || theme.trim().length < 2) {
        setAvailableCount(null);
        return;
      }

      setLoading(true);
      try {
        const result = await getAllThemesAvailabilityAction();

        if (result.success && result.data) {
          // Find matching theme
          const matchingTheme = result.data.find(
            (t) => t.theme.toLowerCase().includes(theme.toLowerCase()) ||
              theme.toLowerCase().includes(t.theme.toLowerCase()),
          );

          if (matchingTheme) {
            setAvailableCount(matchingTheme.availableQuestions);
          } else {
            // No exact match, estimate based on partial match
            const partialMatches = result.data.filter((t) =>
              t.theme.toLowerCase().includes(theme.toLowerCase()) ||
              theme.toLowerCase().includes(t.theme.toLowerCase()),
            );
            if (partialMatches.length > 0) {
              // Use average of partial matches
              const avg = Math.round(
                partialMatches.reduce((sum, t) => sum + t.availableQuestions, 0) /
                  partialMatches.length,
              );
              setAvailableCount(avg);
            } else {
              setAvailableCount(0);
            }
          }
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailableCount(null);
      } finally {
        setLoading(false);
      }
    }

    // Debounce the check
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [theme, category]);

  if (!theme || theme.trim().length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-xs text-slate-500 mt-1">
        Checking availability...
      </div>
    );
  }

  if (availableCount === null) {
    return null;
  }

  const hasEnough = availableCount >= questionCount;
  const isClose = availableCount >= questionCount * 0.7 && availableCount < questionCount;

  return (
    <div
      className={`text-xs mt-1 p-2 rounded ${
        hasEnough
          ? 'bg-green-50 text-green-700 border border-green-200'
          : isClose
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span>
          <span className="font-semibold">{availableCount}</span> question
          {availableCount !== 1 ? 's' : ''} available
        </span>
        {hasEnough ? (
          <span className="text-green-600">✓ Enough</span>
        ) : isClose ? (
          <span className="text-yellow-600">⚠ Close</span>
        ) : (
          <span className="text-red-600">✗ Insufficient</span>
        )}
      </div>
      {!hasEnough && (
        <p className="mt-1 text-xs">
          {availableCount < questionCount
            ? `Need ${questionCount - availableCount} more question${questionCount - availableCount !== 1 ? 's' : ''}`
            : 'May create partial set'}
        </p>
      )}
    </div>
  );
}

