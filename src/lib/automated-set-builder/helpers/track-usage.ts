/**
 * Helper: Track Question Usage
 * Increments global_usage_count for questions used in sets
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type { MultipleChoiceQuestionData } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';
import type { TrueFalseQuestionData } from '@/lib/process-builders/build-trivia-set-true-false/lib/types/trivia-set';

/**
 * Increment usage count for questions used in a trivia set
 * @param questionIds Array of question IDs (source_id from question_data)
 * @param tableName Table name: 'trivia_multiple_choice' or 'trivia_true_false'
 */
export async function incrementQuestionUsage(
  questionIds: number[],
  tableName: 'trivia_multiple_choice' | 'trivia_true_false' = 'trivia_multiple_choice',
): Promise<{ success: boolean; error?: string }> {
  if (!questionIds || questionIds.length === 0) {
    return { success: true };
  }

  try {
    const supabase = getSupabaseAdmin();

    // Try to use RPC function if available, otherwise fall back to individual updates
    let useRpc = true;
    let rpcError: Error | null = null;

    // Note: RPC function only works for trivia_multiple_choice
    // For trivia_true_false, we'll use individual updates
    if (tableName === 'trivia_multiple_choice') {
      try {
        const { error: rpcErr } = await supabase.rpc('increment_question_usage_count', {
          question_ids: questionIds,
        });

        if (rpcErr) {
          // If RPC function doesn't exist or other error, fall back to individual updates
          if (
            rpcErr.message.includes('function') ||
            rpcErr.message.includes('does not exist') ||
            rpcErr.message.includes('permission')
          ) {
            useRpc = false;
            rpcError = rpcErr;
          } else {
            // Other RPC error
            console.error('Error calling RPC function:', rpcErr);
            return {
              success: false,
              error: rpcErr.message,
            };
          }
        } else {
          // RPC succeeded
          return { success: true };
        }
      } catch (rpcException) {
        // RPC call failed, fall back
        useRpc = false;
        rpcError = rpcException instanceof Error ? rpcException : new Error('RPC call failed');
      }
    } else {
      // For trivia_true_false, skip RPC and use individual updates
      useRpc = false;
    }

    // Fallback: Update each question individually
    // This is less efficient but works without creating a function
    const updates = questionIds.map(async (id) => {
      // First, get current usage count
      const { data: currentData, error: fetchError } = await supabase
        .from(tableName)
        .select('global_usage_count')
        .eq('id', id)
        .single();

      if (fetchError || !currentData) {
        return { id, error: fetchError || new Error('Question not found') };
      }

      const newCount = (currentData.global_usage_count || 0) + 1;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ global_usage_count: newCount })
        .eq('id', id);

      if (updateError) {
        console.error(`Error incrementing usage for question ${id} in ${tableName}:`, updateError);
      }
      return { id, error: updateError };
    });

    const results = await Promise.all(updates);
    const failures = results.filter((r) => r.error);

    if (failures.length > 0) {
      return {
        success: false,
        error: `Failed to update ${failures.length} question(s)`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error tracking usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract question IDs from question_data array
 * Works with both Multiple Choice and True/False question data
 */
export function extractQuestionIds(
  questionData: MultipleChoiceQuestionData[] | TrueFalseQuestionData[],
): number[] {
  return questionData
    .map((q) => q.source_id)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
}

/**
 * Increment usage for questions from a trivia set's question_data
 * Automatically detects question type and uses the correct table
 */
export async function trackSetUsage(
  questionData: MultipleChoiceQuestionData[] | TrueFalseQuestionData[],
): Promise<{ success: boolean; error?: string }> {
  if (!questionData || questionData.length === 0) {
    return { success: true };
  }

  const questionIds = extractQuestionIds(questionData);
  if (questionIds.length === 0) {
    return { success: true };
  }

  // Detect question type from the first question
  const firstQuestion = questionData[0];
  const isTrueFalse = firstQuestion.question_type === 'true-false';
  const tableName = isTrueFalse ? 'trivia_true_false' : 'trivia_multiple_choice';

  return incrementQuestionUsage(questionIds, tableName);
}

