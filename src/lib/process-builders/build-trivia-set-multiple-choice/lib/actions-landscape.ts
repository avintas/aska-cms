/**
 * Server Actions for Data Landscape
 * Server actions for fetching trivia question landscape data
 */

'use server';

import {
  getThemeLandscapeStats,
  getAllThemesAvailability,
  type QuestionLandscapeStats,
  type ThemeAvailability,
} from './helpers/data-landscape';

/**
 * Get landscape stats for a specific theme
 */
export async function getLandscapeStatsAction(
  theme: string,
): Promise<{ success: boolean; data?: QuestionLandscapeStats; error?: string }> {
  try {
    const stats = await getThemeLandscapeStats(theme);
    if (!stats) {
      return {
        success: false,
        error: 'Failed to fetch landscape stats',
      };
    }
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all themes with availability info
 */
export async function getAllThemesAvailabilityAction(): Promise<{ success: boolean; data?: ThemeAvailability[]; error?: string }> {
  try {
    const themes = await getAllThemesAvailability();
    return {
      success: true,
      data: themes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

