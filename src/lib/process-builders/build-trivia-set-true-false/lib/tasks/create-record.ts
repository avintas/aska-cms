/**
 * Task 5: Create Trivia Set Record
 * Inserts trivia set into sets_trivia_true_false table
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type {
  TrueFalseTriviaSet,
  TrueFalseQuestionData,
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
        questionData: TrueFalseQuestionData[];
      }).questionData;

      // Get question count from rules
      const questionCountRule = context.rules.questionCount;
      const questionCount = (questionCountRule?.value as number) || questionData.length;

      // Ensure slug uniqueness
      const uniqueSlug = await ensureUniqueSlug(supabase, metadata.slug);

      // Build trivia set record
      const triviaSet: Omit<TrueFalseTriviaSet, 'id' | 'created_at' | 'updated_at'> = {
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

      // Return the set object - it will be stored in collection_trivia_sets as JSONB
      // No individual table insert needed - sets are stored directly in collection_trivia_sets
      const completeSet: TrueFalseTriviaSet = {
        ...triviaSet,
        id: undefined, // No database ID since we're not inserting
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: { triviaSet: completeSet },
        metadata: {
          slug: uniqueSlug,
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
 * Ensure slug uniqueness by generating a unique slug
 * Since sets are stored in collection_trivia_sets as JSONB, we just append timestamp for uniqueness
 */
async function ensureUniqueSlug(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  baseSlug: string,
): Promise<string> {
  // Append timestamp to ensure uniqueness
  // Sets are stored in collection_trivia_sets as JSONB, so we don't need to check database
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}

