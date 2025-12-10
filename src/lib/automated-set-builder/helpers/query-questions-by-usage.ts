/**
 * Helper: Query Questions by Usage Count
 * Queries questions from trivia_multiple_choice, prioritized by lowest global_usage_count
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type { SourceMultipleChoiceQuestion } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';

export interface QueryQuestionsByUsageOptions {
  /** Themes to include (null = all themes) */
  themes?: string[] | null;
  /** Maximum number of questions to return */
  limit?: number;
  /** Whether to balance across themes */
  balanceThemes?: boolean;
  /** Minimum questions required per theme when balancing */
  minPerTheme?: number;
}

/**
 * Query questions prioritized by lowest global_usage_count
 * Optionally filters by themes and balances across themes
 */
export async function queryQuestionsByUsage(
  options: QueryQuestionsByUsageOptions = {},
): Promise<SourceMultipleChoiceQuestion[]> {
  const {
    themes = null,
    limit = 1000,
    balanceThemes = false,
    minPerTheme = 2,
  } = options;

  const supabase = getSupabaseAdmin();

  // Build base query - prioritize by usage count
  let query = supabase
    .from('trivia_multiple_choice')
    .select('*')
    .eq('status', 'published')
    .order('global_usage_count', { ascending: true }) // Lowest usage first
    .order('id', { ascending: true }); // Secondary sort for consistency

  // Filter by themes if specified
  if (themes && themes.length > 0) {
    // Use OR condition for multiple themes
    const themeFilters = themes.map((theme) => `theme.ilike.%${theme}%`).join(',');
    query = query.or(themeFilters);
  }

  // Execute query
  const { data, error } = await query.limit(limit * 2); // Get extra for balancing

  if (error) {
    console.error('Error querying questions by usage:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const questions = data as SourceMultipleChoiceQuestion[];

  // If balancing is disabled or only one theme, return sorted by usage
  if (!balanceThemes || !themes || themes.length <= 1) {
    return questions.slice(0, limit);
  }

  // Balance across themes
  return balanceQuestionsByTheme(questions, themes, limit, minPerTheme);
}

/**
 * Balance questions across multiple themes
 * Ensures fair distribution while maintaining usage-based priority
 */
function balanceQuestionsByTheme(
  questions: SourceMultipleChoiceQuestion[],
  themes: string[],
  limit: number,
  minPerTheme: number,
): SourceMultipleChoiceQuestion[] {
  // Group questions by theme
  const byTheme = new Map<string, SourceMultipleChoiceQuestion[]>();
  
  for (const question of questions) {
    const theme = question.theme || 'Uncategorized';
    // Check if this theme is in our target themes
    const matchingTheme = themes.find((t) => theme.toLowerCase().includes(t.toLowerCase()));
    if (matchingTheme) {
      if (!byTheme.has(matchingTheme)) {
        byTheme.set(matchingTheme, []);
      }
      byTheme.get(matchingTheme)!.push(question);
    }
  }

  // If we don't have enough themes with questions, return all we have
  const availableThemes = Array.from(byTheme.keys());
  if (availableThemes.length === 0) {
    return questions.slice(0, limit);
  }

  // Calculate distribution
  const questionsPerTheme = Math.floor(limit / availableThemes.length);
  const remainder = limit % availableThemes.length;

  const selected: SourceMultipleChoiceQuestion[] = [];
  const selectedIds = new Set<number>();

  // Distribute questions from each theme
  for (let i = 0; i < availableThemes.length; i++) {
    const theme = availableThemes[i];
    const themeQuestions = byTheme.get(theme) || [];
    
    // Take questionsPerTheme + 1 for first 'remainder' themes
    const takeCount = questionsPerTheme + (i < remainder ? 1 : 0);
    const minCount = Math.min(minPerTheme, takeCount);

    // Take at least minPerTheme, up to takeCount
    let taken = 0;
    for (const question of themeQuestions) {
      if (taken >= takeCount) break;
      if (!selectedIds.has(question.id)) {
        selected.push(question);
        selectedIds.add(question.id);
        taken++;
      }
    }

    // If we didn't get minimum, try to get more (might be limited by availability)
    if (taken < minCount && themeQuestions.length > taken) {
      for (const question of themeQuestions.slice(taken)) {
        if (selectedIds.has(question.id)) continue;
        selected.push(question);
        selectedIds.add(question.id);
        taken++;
        if (taken >= minCount) break;
      }
    }
  }

  // Fill remaining slots with lowest usage questions (any theme)
  if (selected.length < limit) {
    const remaining = limit - selected.length;
    for (const question of questions) {
      if (selectedIds.has(question.id)) continue;
      selected.push(question);
      selectedIds.add(question.id);
      if (selected.length >= limit) break;
    }
  }

  // Sort final selection by usage count to maintain priority
  selected.sort((a, b) => {
    if (a.global_usage_count !== b.global_usage_count) {
      return a.global_usage_count - b.global_usage_count;
    }
    return a.id - b.id;
  });

  return selected.slice(0, limit);
}

