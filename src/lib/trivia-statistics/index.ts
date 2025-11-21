/**
 * Trivia Statistics Library
 * 
 * Provides fast access to pre-calculated trivia metadata counts.
 * Uses materialized views to avoid recalculating counts on every page load.
 * 
 * This library is designed to be reusable across:
 * - Trivia set builders (MC, TF, Who Am I)
 * - Ideation module
 * - Content browsers
 * - Any process requiring metadata counts
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';

export type TriviaType = 'multiple_choice' | 'true_false' | 'who_am_i';

export interface CategoryStat {
  category: string;
  published_count: number;
  total_count: number;
}

export interface ThemeStat {
  theme: string;
  published_count: number;
  category_count: number;
}

export interface DifficultyStat {
  difficulty: string;
  published_count: number;
  total_count: number;
}

/**
 * Get categories for a specific trivia type and theme
 * Uses pre-calculated statistics for fast retrieval
 */
export async function getCategories(
  triviaType: TriviaType,
  theme: string,
): Promise<CategoryStat[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('trivia_category_statistics')
    .select('category, published_count, total_count')
    .eq('trivia_type', triviaType)
    .eq('theme', theme)
    .order('published_count', { ascending: false })
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []).map((row) => ({
    category: row.category,
    published_count: row.published_count || 0,
    total_count: row.total_count || 0,
  }));
}

/**
 * Get all themes for a specific trivia type
 * Uses pre-calculated statistics for fast retrieval
 */
export async function getThemes(triviaType: TriviaType): Promise<ThemeStat[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('trivia_theme_statistics')
    .select('theme, published_count, category_count')
    .eq('trivia_type', triviaType)
    .order('published_count', { ascending: false })
    .order('theme', { ascending: true });

  if (error) {
    console.error('Error fetching themes:', error);
    return [];
  }

  return (data || []).map((row) => ({
    theme: row.theme,
    published_count: row.published_count || 0,
    category_count: row.category_count || 0,
  }));
}

/**
 * Get difficulty breakdown for a specific trivia type and theme
 * Uses pre-calculated statistics for fast retrieval
 */
export async function getDifficulties(
  triviaType: TriviaType,
  theme: string,
): Promise<DifficultyStat[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('trivia_difficulty_statistics')
    .select('difficulty, published_count, total_count')
    .eq('trivia_type', triviaType)
    .eq('theme', theme)
    .order('difficulty', { ascending: true });

  if (error) {
    console.error('Error fetching difficulties:', error);
    return [];
  }

  return (data || []).map((row) => ({
    difficulty: row.difficulty,
    published_count: row.published_count || 0,
    total_count: row.total_count || 0,
  }));
}

/**
 * Get category count for a specific trivia type, theme, and category
 * Uses pattern matching (ILIKE) for theme to match the process builder query logic
 * Uses exact match for category as the process builder does
 * This ensures the count matches what the process builder will actually find
 */
export async function getCategoryCount(
  triviaType: TriviaType,
  theme: string,
  category: string,
): Promise<number> {
  const supabase = getSupabaseAdmin();

  // Determine which table to query based on trivia type
  let tableName: string;
  switch (triviaType) {
    case 'multiple_choice':
      tableName = 'trivia_multiple_choice';
      break;
    case 'true_false':
      tableName = 'trivia_true_false';
      break;
    case 'who_am_i':
      tableName = 'trivia_who_am_i';
      break;
    default:
      return 0;
  }

  // Query using pattern matching (ILIKE) for theme and exact match for category
  // This matches the query in query-questions.ts:
  // .ilike('theme', `%${theme}%`) and .eq('category', category)
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .ilike('theme', `%${theme}%`)
    .eq('category', category);

  if (error) {
    console.error(`Error fetching category count for ${triviaType}/${theme}/${category}:`, error);
    return 0;
  }

  return count || 0;
}

/**
 * Get theme count for a specific trivia type and theme
 * Uses pattern matching (ILIKE) to match the process builder query logic
 * This ensures the count matches what the process builder will actually find
 */
export async function getThemeCount(
  triviaType: TriviaType,
  theme: string,
): Promise<number> {
  const supabase = getSupabaseAdmin();

  // Determine which table to query based on trivia type
  let tableName: string;
  switch (triviaType) {
    case 'multiple_choice':
      tableName = 'trivia_multiple_choice';
      break;
    case 'true_false':
      tableName = 'trivia_true_false';
      break;
    case 'who_am_i':
      tableName = 'trivia_who_am_i';
      break;
    default:
      return 0;
  }

  // Query using pattern matching (ILIKE) to match process builder logic
  // This matches the query in query-questions.ts: .ilike('theme', `%${theme}%`)
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .ilike('theme', `%${theme}%`);

  if (error) {
    console.error(`Error fetching theme count for ${triviaType}/${theme}:`, error);
    return 0;
  }

  return count || 0;
}

/**
 * Refresh statistics (admin function)
 * Call this after bulk updates or on a schedule
 */
export async function refreshStatistics(): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.rpc('refresh_trivia_statistics');

  if (error) {
    console.error('Error refreshing statistics:', error);
    return false;
  }

  return true;
}

