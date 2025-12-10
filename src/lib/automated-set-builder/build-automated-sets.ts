/**
 * Automated Set Builder - Core Logic
 * Creates trivia sets automatically based on configuration
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { buildTriviaSetMultipleChoice } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/build-trivia-set-multiple-choice';
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
  CollectionTriviaSetsCreateInput,
  CollectionTriviaSetEntry,
} from '@/shared/types/automated-set-builder';
import type { MultipleChoiceTriviaSet } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';

export interface BuildAutomatedSetsResult {
  success: boolean;
  setsCreated: number;
  setsFailed: number;
  setIds: number[];
  errors: string[];
  warnings: string[];
}

/**
 * Build automated trivia sets for today
 * Reads configuration, creates sets, tracks usage, and stores in collection
 */
export async function buildAutomatedSets(
  publishDate?: string,
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

    if (!config.enabled) {
      result.errors.push('Automated set builder is disabled');
      await updateLastRunInfo('failed', 'Automated set builder is disabled');
      return result;
    }

    // Use provided date or today's date
    const targetDate = publishDate || new Date().toISOString().split('T')[0];

    // Build sets
    const buildResult = await buildSetsForDate(config, targetDate, result);

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
  result: BuildAutomatedSetsResult,
): Promise<BuildAutomatedSetsResult> {
  const setsToCreate: CollectionTriviaSetEntry[] = [];
  const errors: string[] = [];

  // Create each set
  for (let i = 0; i < config.sets_per_day; i++) {
    try {
      const setResult = await createSingleAutomatedSet(config);

      if (setResult.success && setResult.set) {
        setsToCreate.push({
          type: 'mc', // For now, only MC. Will expand later
          set: setResult.set,
        });
        result.setIds.push(setResult.set.id!);
        result.setsCreated++;
      } else {
        result.setsFailed++;
        errors.push(`Set ${i + 1}: ${setResult.error || 'Unknown error'}`);
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
  if (setsToCreate.length > 0) {
    const storeResult = await storeSetsInCollection(publishDate, setsToCreate);
    if (!storeResult.success) {
      result.errors.push(`Failed to store sets in collection: ${storeResult.error}`);
    }
  }

  return result;
}

/**
 * Create a single automated set
 */
async function createSingleAutomatedSet(
  config: AutomatedSetBuilderConfig,
): Promise<{
  success: boolean;
  set?: MultipleChoiceTriviaSet;
  error?: string;
}> {
  try {
    // Query questions by usage with theme balancing
    const questions = await queryQuestionsByUsage({
      themes: config.themes,
      limit: config.questions_per_set * 2, // Get extra for selection
      balanceThemes: config.balance_themes,
      minPerTheme: 2,
    });

    if (questions.length < config.questions_per_set) {
      return {
        success: false,
        error: `Insufficient questions: ${questions.length} available, ${config.questions_per_set} required`,
      };
    }

    // Use mixed theme approach - goal text indicates mixed themes
    const goal: ProcessBuilderGoal = {
      text: config.themes
        ? `Mixed Themes: ${config.themes.join(', ')}`
        : 'Mixed Themes: All Available',
    };

    const rules: ProcessBuilderRules = {
      questionCount: {
        key: 'questionCount',
        value: config.questions_per_set,
        type: 'number',
      },
    };

    // For now, we'll need to modify the query-questions task to use usage-based selection
    // For automated builds, we'll pass the theme as "Mixed" and let the task handle it
    // We'll need to create a modified query-questions task or pass candidates through metadata
    const options: ProcessBuilderOptions = {
      allowPartialResults: true,
      // Pass pre-selected questions through options
      preSelectedCandidates: questions,
    };

    // Build the set using existing ProcessBuilder
    const buildResult = await buildTriviaSetMultipleChoice(goal, rules, options);

    if (!buildResult.success || !buildResult.data) {
      return {
        success: false,
        error:
          buildResult.errors?.map((e) => e.message).join(', ') || 'Build failed',
      };
    }

    // Extract the created set from the final result
    // The create-record task returns { triviaSet: MultipleChoiceTriviaSet }
    const finalResultData = buildResult.finalResult as
      | { triviaSet: MultipleChoiceTriviaSet }
      | undefined;

    if (!finalResultData || !finalResultData.triviaSet) {
      return {
        success: false,
        error: 'Set was not returned from build process',
      };
    }

    const set = finalResultData.triviaSet;

    if (!set || !set.id) {
      return {
        success: false,
        error: 'Set was not properly created',
      };
    }

    // Fetch the complete set from database to get question_data
    // This ensures we have the full set including question_data for usage tracking
    const supabase = getSupabaseAdmin();
    const { data: fullSet, error: fetchError } = await supabase
      .from('sets_trivia_multiple_choice')
      .select('*')
      .eq('id', set.id)
      .single();

    if (fetchError || !fullSet) {
      return {
        success: false,
        error: `Failed to fetch created set: ${fetchError?.message || 'Unknown error'}`,
      };
    }

    const completeSet = fullSet as MultipleChoiceTriviaSet;

    return {
      success: true,
      set: completeSet,
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
 */
async function storeSetsInCollection(
  publishDate: string,
  sets: CollectionTriviaSetEntry[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // Convert sets to JSONB array format for database
    const setsJsonb = sets.map((entry) => ({
      type: entry.type,
      set: entry.set,
    }));

    const collectionData: CollectionTriviaSetsCreateInput = {
      publish_date: publishDate,
      sets: sets,
      set_count: sets.length,
      run_status: 'completed',
      run_message: null,
    };

    const { error } = await supabase
      .from('collection_trivia_sets')
      .upsert(
        {
          publish_date: publishDate,
          sets: setsJsonb as any, // Supabase will handle JSONB conversion
          set_count: sets.length,
          run_status: 'completed',
          run_message: null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'publish_date',
        },
      );

    if (error) {
      console.error('Error storing sets in collection:', error);
      return {
        success: false,
        error: error.message,
      };
    }

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

