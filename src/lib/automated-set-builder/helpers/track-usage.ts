/**
 * Helper: Track Question Usage
 * Increments global_usage_count for questions used in sets
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type { MultipleChoiceQuestionData } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';

/**
 * Increment usage count for questions used in a trivia set
 * @param questionIds Array of question IDs (source_id from question_data)
 */
export async function incrementQuestionUsage(
  questionIds: number[],
): Promise<{ success: boolean; error?: string }> {
  if (!questionIds || questionIds.length === 0) {
    return { success: true };
  }

  try {
    const supabase = getSupabaseAdmin();

    // Try to use RPC function if available, otherwise fall back to individual updates
    let useRpc = true;
    let rpcError: Error | null = null;

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

    // Fallback: Update each question individually
    // This is less efficient but works without creating a function
    const updates = questionIds.map(async (id) => {
      // First, get current usage count
      const { data: currentData, error: fetchError } = await supabase
        .from('trivia_multiple_choice')
        .select('global_usage_count')
        .eq('id', id)
        .single();

      if (fetchError || !currentData) {
        return { id, error: fetchError || new Error('Question not found') };
      }

      const newCount = (currentData.global_usage_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('trivia_multiple_choice')
        .update({ global_usage_count: newCount })
        .eq('id', id);

      if (updateError) {
        console.error(`Error incrementing usage for question ${id}:`, updateError);
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
 */
export function extractQuestionIds(
  questionData: MultipleChoiceQuestionData[],
): number[] {
  return questionData
    .map((q) => q.source_id)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
}

/**
 * Increment usage for questions from a trivia set's question_data
 */
export async function trackSetUsage(
  questionData: MultipleChoiceQuestionData[],
): Promise<{ success: boolean; error?: string }> {
  const questionIds = extractQuestionIds(questionData);
  return incrementQuestionUsage(questionIds);
}

