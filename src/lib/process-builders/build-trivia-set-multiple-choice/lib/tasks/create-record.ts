/**
 * Task 5: Create Trivia Set Record
 * Inserts trivia set into sets_trivia_multiple_choice table
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type {
  MultipleChoiceTriviaSet,
  MultipleChoiceQuestionData,
  TriviaSetMetadata,
} from '../types';

export const createRecordTask: ProcessBuilderTask = {
  id: 'create-record',
  name: 'Create Trivia Set Record',
  description: 'Inserts trivia set into database',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      const supabase = getSupabaseAdmin();

      // Get metadata from Task 3
      const metadataResult = context.previousResults?.[2];
      if (!metadataResult || !metadataResult.success) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_CONTEXT',
              message: 'Previous task (generate-metadata) did not succeed',
              taskId: 'create-record',
            },
          ],
        };
      }

      const metadata = (metadataResult.data as { metadata: TriviaSetMetadata })
        .metadata;

      // Get question data from Task 4
      const assembleResult = context.previousResults?.[3];
      if (!assembleResult || !assembleResult.success) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_CONTEXT',
              message: 'Previous task (assemble-data) did not succeed',
              taskId: 'create-record',
            },
          ],
        };
      }

      const questionData = (assembleResult.data as {
        questionData: MultipleChoiceQuestionData[];
      }).questionData;

      // Get question count from rules
      const questionCountRule = context.rules.questionCount;
      const questionCount = (questionCountRule?.value as number) || questionData.length;

      // Ensure slug uniqueness
      const uniqueSlug = await ensureUniqueSlug(supabase, metadata.slug);

      // Build trivia set record
      const triviaSet: Omit<MultipleChoiceTriviaSet, 'id' | 'created_at' | 'updated_at'> = {
        title: metadata.title,
        slug: uniqueSlug,
        description: metadata.description || null,
        category: metadata.category || null,
        theme: metadata.theme || null,
        tags: metadata.tags || null,
        question_data: questionData,
        question_count: questionCount,
        estimated_duration: metadata.estimated_duration || null,
        status: 'draft',
        visibility: 'Private',
        published_at: null,
        scheduled_for: null,
      };

      // Insert into database
      const { data, error } = await supabase
        .from('sets_trivia_multiple_choice')
        .insert(triviaSet)
        .select()
        .single();

      if (error) {
        // If still a duplicate key error, try one more time with timestamp suffix
        if (error.message.includes('duplicate key') && error.message.includes('slug')) {
          const timestampSlug = `${uniqueSlug}-${Date.now()}`;
          const retryTriviaSet = { ...triviaSet, slug: timestampSlug };
          const { data: retryData, error: retryError } = await supabase
            .from('sets_trivia_multiple_choice')
            .insert(retryTriviaSet)
            .select()
            .single();

          if (retryError) {
            return {
              success: false,
              errors: [
                {
                  code: 'DATABASE_ERROR',
                  message: `Failed to create trivia set: ${retryError.message}`,
                  taskId: 'create-record',
                  details: retryError,
                },
              ],
            };
          }

          return {
            success: true,
            data: { triviaSet: retryData },
            metadata: {
              triviaSetId: retryData.id,
            },
          };
        }

        return {
          success: false,
          errors: [
            {
              code: 'DATABASE_ERROR',
              message: `Failed to create trivia set: ${error.message}`,
              taskId: 'create-record',
              details: error,
            },
          ],
        };
      }

      return {
        success: true,
        data: { triviaSet: data },
        metadata: {
          triviaSetId: data.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: 'TASK_EXECUTION_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error',
            taskId: 'create-record',
            details: error,
          },
        ],
      };
    }
  },
};

/**
 * Ensure slug uniqueness by checking database and appending suffix if needed
 */
async function ensureUniqueSlug(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  baseSlug: string,
): Promise<string> {
  // Check if slug exists
  const { data: existing, error } = await supabase
    .from('sets_trivia_multiple_choice')
    .select('slug')
    .eq('slug', baseSlug)
    .limit(1)
    .maybeSingle();

  // If slug doesn't exist (no error and no data), return it as-is
  if (!existing && !error) {
    return baseSlug;
  }

  // Slug exists or there was an error, append timestamp to make it unique
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}

