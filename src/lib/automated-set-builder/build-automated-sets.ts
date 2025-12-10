/**
 * Automated Set Builder - Core Logic
 * Creates trivia sets automatically based on configuration
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { buildTriviaSetMultipleChoice } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/build-trivia-set-multiple-choice';
import { buildTriviaSetTrueFalse } from '@/lib/process-builders/build-trivia-set-true-false/lib/build-trivia-set-true-false';
import { queryQuestionsByUsage } from './helpers/query-questions-by-usage';
import { trackSetUsage, extractQuestionIds } from './helpers/track-usage';
import { getAutomatedBuilderConfig, updateLastRunInfo } from './config';
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
} from '@/lib/process-builders/core/types';
import type {
  AutomatedSetBuilderConfig,
  CollectionTriviaSetCreateInput,
  CollectionTriviaSetEntry,
} from '@/shared/types/automated-set-builder';
import type { MultipleChoiceTriviaSet } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';
import type { TrueFalseTriviaSet } from '@/lib/process-builders/build-trivia-set-true-false/lib/types/trivia-set';

export interface BuildAutomatedSetsResult {
  success: boolean;
  setsCreated: number;
  setsFailed: number;
  setIds: number[];
  errors: string[];
  warnings: string[];
}

/**
 * Build automated trivia sets
 * Reads configuration, creates sets, tracks usage, and stores in collection
 */
export async function buildAutomatedSets(
  publishDate?: string,
  numberOfSets?: number,
  triviaType: 'mc' | 'tf' | 'mix' = 'mc',
  overrides?: {
    questions_per_set?: number;
    themes?: string[] | null;
    balance_themes?: boolean;
  },
): Promise<BuildAutomatedSetsResult> {
  const result: BuildAutomatedSetsResult = {
    success: false,
    setsCreated: 0,
    setsFailed: 0,
    setIds: [],
    errors: [],
    warnings: [],
  };

  try {
    // Get configuration
    const config = await getAutomatedBuilderConfig();
    if (!config) {
      result.errors.push('Failed to load configuration');
      await updateLastRunInfo('failed', 'Failed to load configuration');
      return result;
    }

    // Use provided date or today's date
    const targetDate = publishDate || new Date().toISOString().split('T')[0];

    // Use provided numberOfSets or config default
    const setsToBuild = numberOfSets ?? config.sets_per_day;

    // Build sets with optional overrides and trivia type
    const buildResult = await buildSetsForDate(
      config,
      targetDate,
      setsToBuild,
      triviaType,
      result,
      overrides,
    );

    // Update last run info
    const runStatus =
      buildResult.setsFailed === 0
        ? 'success'
        : buildResult.setsCreated > 0
          ? 'partial'
          : 'failed';

    const runMessage =
      buildResult.setsCreated > 0
        ? `Created ${buildResult.setsCreated} set(s)`
        : 'No sets created';

    await updateLastRunInfo(runStatus, runMessage);

    result.success = buildResult.setsCreated > 0;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Unexpected error: ${errorMessage}`);
    console.error('Error in buildAutomatedSets:', error);
    await updateLastRunInfo('failed', errorMessage);
    return result;
  }
}

/**
 * Build sets for a specific date
 */
async function buildSetsForDate(
  config: AutomatedSetBuilderConfig,
  publishDate: string,
  numberOfSets: number,
  triviaType: 'mc' | 'tf' | 'mix',
  result: BuildAutomatedSetsResult,
  overrides?: {
    questions_per_set?: number;
    themes?: string[] | null;
    balance_themes?: boolean;
  },
): Promise<BuildAutomatedSetsResult> {
  const setsToCreate: CollectionTriviaSetEntry[] = [];
  const errors: string[] = [];

  // Determine set type for each iteration (for mix, alternate)
  const getSetTypeForIndex = (index: number): 'mc' | 'tf' => {
    if (triviaType === 'mix') {
      return index % 2 === 0 ? 'mc' : 'tf';
    }
    return triviaType;
  };

  // Create each set
  for (let i = 0; i < numberOfSets; i++) {
    try {
      const setType = getSetTypeForIndex(i);
      const setResult = await createSingleAutomatedSet(config, setType, overrides);

      if (setResult.success && setResult.set) {
        setsToCreate.push({
          type: setType,
          set: setResult.set as MultipleChoiceTriviaSet | TrueFalseTriviaSet,
        });
        // Note: Sets don't have database IDs since they're stored as JSONB in collection_trivia_sets
        // setIds array is kept for API compatibility but not used for identification
        result.setsCreated++;
      } else {
        result.setsFailed++;
        errors.push(`Set ${i + 1} (${setType.toUpperCase()}): ${setResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      result.setsFailed++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Set ${i + 1}: ${errorMessage}`);
    }
  }

  result.errors.push(...errors);

  // Store sets in collection_trivia_sets table
  // This is the main storage table - one row per trivia set
  // Each set gets its own record with publish_date, set_type, and set_data
  if (setsToCreate.length > 0) {
    const storeResult = await storeSetsInCollection(publishDate, setsToCreate);
    if (!storeResult.success) {
      result.errors.push(`Failed to store sets in collection_trivia_sets: ${storeResult.error}`);
      console.error('Store sets failed:', storeResult.error);
    } else {
      console.log(`Successfully stored ${setsToCreate.length} sets in database`);
    }
  }

  return result;
}

/**
 * Create a single automated set
 */
async function createSingleAutomatedSet(
  config: AutomatedSetBuilderConfig,
  setType: 'mc' | 'tf',
  overrides?: {
    questions_per_set?: number;
    themes?: string[] | null;
    balance_themes?: boolean;
  },
): Promise<{
  success: boolean;
  set?: MultipleChoiceTriviaSet | TrueFalseTriviaSet;
  error?: string;
}> {
  try {
    // Use overrides if provided, otherwise use config
    const questionsPerSet = overrides?.questions_per_set ?? config.questions_per_set;
    const themes = overrides?.themes !== undefined ? overrides.themes : config.themes;
    const balanceThemes = overrides?.balance_themes ?? config.balance_themes;

    // Build goal text from themes
    // For automated builds: if multiple themes selected, use first one
    // If no themes or null, use empty string (means "all themes")
    // The query tasks will handle empty string by not filtering by theme
    const themeText = themes && themes.length > 0 ? themes[0] : '';
    const goal: ProcessBuilderGoal = {
      text: themeText,
    };

    const rules: ProcessBuilderRules = {
      questionCount: {
        key: 'questionCount',
        value: questionsPerSet,
        type: 'number',
      },
    };

    const options: ProcessBuilderOptions = {
      allowPartialResults: true,
    };

    // Build the set based on type
    let buildResult;
    if (setType === 'mc') {
      // For MC, we can use usage-based querying
      const questions = await queryQuestionsByUsage({
        themes: themes,
        limit: questionsPerSet * 2,
        balanceThemes: balanceThemes,
        minPerTheme: 2,
      });

      if (questions.length < questionsPerSet) {
        return {
          success: false,
          error: `Insufficient MC questions: ${questions.length} available, ${questionsPerSet} required`,
        };
      }

      options.preSelectedCandidates = questions;
      buildResult = await buildTriviaSetMultipleChoice(goal, rules, options);
    } else {
      // For TF, use the standard builder (it queries directly from database)
      buildResult = await buildTriviaSetTrueFalse(goal, rules, options);
    }

    if (buildResult.status !== 'success') {
      return {
        success: false,
        error:
          buildResult.errors?.map((e) => e.message).join(', ') || 'Build failed',
      };
    }

    // Extract the created set from the final result
    // The create-record task returns { triviaSet: TriviaSet }
    const finalResultData = buildResult.finalResult as
      | { triviaSet: MultipleChoiceTriviaSet | TrueFalseTriviaSet }
      | undefined;

    if (!finalResultData || !finalResultData.triviaSet) {
      return {
        success: false,
        error: 'Set was not returned from build process',
      };
    }

    const set = finalResultData.triviaSet;

    // Set is already complete - no need to fetch from database
    // Sets are stored directly in collection_trivia_sets as JSONB, not in individual tables
    if (!set) {
      return {
        success: false,
        error: 'Set was not properly created',
      };
    }

    return {
      success: true,
      set: set,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store sets in collection_trivia_sets table
 * This is the main collection storage table - one row per trivia set
 * Each set gets its own record with publish_date and sets array containing one set
 */
async function storeSetsInCollection(
  publishDate: string,
  sets: CollectionTriviaSetEntry[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // Insert one record per set
    // Each record has sets array with one set: [{"type": "mc", "set": {...}}]
    const recordsToInsert = sets.map((entry) => ({
      publish_date: publishDate,
      sets: [
        {
          type: entry.type,
          set: entry.set,
        },
      ] as any[], // JSONB array with one set
      set_count: 1, // One set per record
      run_status: 'completed' as const,
      run_message: null,
    }));

    // Insert all sets as individual records
    // Log what we're trying to insert for debugging
    console.log('Attempting to insert', recordsToInsert.length, 'records');
    console.log('Sample record structure:', JSON.stringify(recordsToInsert[0], null, 2));
    
    const { data, error } = await supabase
      .from('collection_trivia_sets')
      .insert(recordsToInsert as any)
      .select(); // Return inserted data to verify

    if (error) {
      console.error('Error storing sets in collection:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('Successfully inserted', data?.length || 0, 'records');

    // Track usage for all sets (usage tracking happens here after sets are stored)
    for (const entry of sets) {
      if (entry.set.question_data && Array.isArray(entry.set.question_data)) {
        await trackSetUsage(entry.set.question_data);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

