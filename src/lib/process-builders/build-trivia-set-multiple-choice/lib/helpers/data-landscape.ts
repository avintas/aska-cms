/**
 * Data Landscape Helper Functions
 * Utilities for querying and analyzing trivia question availability
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';

export interface QuestionLandscapeStats {
  theme: string;
  total: number;
  available: number;
  excluded: number;
  byCategory: CategoryStats[];
  byDifficulty: DifficultyStats[];
}

export interface CategoryStats {
  category: string;
  total: number;
  available: number;
}

export interface DifficultyStats {
  difficulty: string;
  total: number;
  available: number;
}

export interface ThemeAvailability {
  theme: string;
  totalQuestions: number;
  availableQuestions: number;
  categories: string[];
  hasEnoughForSet: boolean; // Has at least 10 questions
}

/**
 * Get question counts by theme
 */
export async function getQuestionCountsByTheme(): Promise<Map<string, number>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('trivia_multiple_choice')
    .select('id, theme')
    .eq('status', 'published');

  if (error || !data) {
    return new Map();
  }

  const themeCounts = new Map<string, number>();

  for (const question of data) {
    const theme = question.theme || 'Uncategorized';
    themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
  }

  return themeCounts;
}

/**
 * Get question counts by category for a specific theme
 */
export async function getQuestionCountsByCategory(
  theme: string,
): Promise<Map<string, number>> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('trivia_multiple_choice')
    .select('id, category')
    .eq('status', 'published');

  if (theme) {
    query = query.ilike('theme', `%${theme}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return new Map();
  }

  const categoryCounts = new Map<string, number>();

  for (const question of data) {
    const category = question.category || 'Uncategorized';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  return categoryCounts;
}

/**
 * Get question counts by difficulty
 */
export async function getQuestionCountsByDifficulty(
  theme?: string,
): Promise<Map<string, number>> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('trivia_multiple_choice')
    .select('id, difficulty')
    .eq('status', 'published');

  if (theme) {
    query = query.ilike('theme', `%${theme}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return new Map();
  }

  const difficultyCounts = new Map<string, number>();

  for (const question of data) {
    const difficulty = question.difficulty || 'Unknown';
    difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1);
  }

  return difficultyCounts;
}

/**
 * Get comprehensive landscape stats for a theme
 */
export async function getThemeLandscapeStats(
  theme: string,
): Promise<QuestionLandscapeStats | null> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('trivia_multiple_choice')
    .select('id, theme, category, difficulty')
    .eq('status', 'published');

  if (theme) {
    query = query.ilike('theme', `%${theme}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return null;
  }

  const total = data.length;
  const available = total;
  const excluded = 0;

  // Group by category
  const categoryMap = new Map<string, { total: number; available: number }>();
  for (const question of data) {
    const category = question.category || 'Uncategorized';
    const stats = categoryMap.get(category) || { total: 0, available: 0 };
    stats.total += 1;
    stats.available += 1;
    categoryMap.set(category, stats);
  }

  // Group by difficulty
  const difficultyMap = new Map<string, { total: number; available: number }>();
  for (const question of data) {
    const difficulty = question.difficulty || 'Unknown';
    const stats = difficultyMap.get(difficulty) || { total: 0, available: 0 };
    stats.total += 1;
    stats.available += 1;
    difficultyMap.set(difficulty, stats);
  }

  return {
    theme,
    total,
    available,
    excluded,
    byCategory: Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      available: stats.available,
    })),
    byDifficulty: Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      available: stats.available,
    })),
  };
}

/**
 * Get all themes with availability info
 */
export async function getAllThemesAvailability(): Promise<ThemeAvailability[]> {
  const themeCounts = await getQuestionCountsByTheme();
  const supabase = getSupabaseAdmin();

  const themes: ThemeAvailability[] = [];

  for (const [theme, count] of themeCounts.entries()) {
    // Get categories for this theme
    const { data } = await supabase
      .from('trivia_multiple_choice')
      .select('category')
      .eq('status', 'published')
      .ilike('theme', `%${theme}%`);

    const categories = new Set<string>();
    data?.forEach((q) => {
      if (q.category) {
        categories.add(q.category);
      }
    });

    themes.push({
      theme,
      totalQuestions: count,
      availableQuestions: count,
      categories: Array.from(categories),
      hasEnoughForSet: count >= 10,
    });
  }

  return themes.sort((a, b) => b.availableQuestions - a.availableQuestions);
}

