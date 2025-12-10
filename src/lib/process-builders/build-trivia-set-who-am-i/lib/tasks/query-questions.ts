/**
 * Task 1: Query Source Questions
 * Fetches Who Am I questions from trivia_who_am_i table
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type { SourceWhoAmIQuestion } from '../types';

export const queryQuestionsTask: ProcessBuilderTask = {
  id: 'query-questions',
  name: 'Query Source Questions',
  description: 'Fetches Who Am I questions matching theme and criteria',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      const supabase = getSupabaseAdmin();

      // Extract theme from goal
      const theme = context.goal.text.trim();
      if (!theme) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_INPUT',
              message: 'Theme is required in goal text',
            },
          ],
        };
      }

      // Extract question count from rules
      const questionCountRule = context.rules.questionCount;
      if (!questionCountRule || typeof questionCountRule.value !== 'number') {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_INPUT',
              message: 'questionCount rule is required and must be a number',
            },
          ],
        };
      }

      const questionCount = questionCountRule.value as number;

      // Build base query (without limit to get count first)
      let countQuery = supabase
        .from('trivia_who_am_i')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'); // Only published questions

      // Filter by theme if provided
      if (theme) {
        countQuery = countQuery.ilike('theme', `%${theme}%`);
      }

      // Optional filters from rules
      if (context.rules.category) {
        const category = context.rules.category.value as string;
        countQuery = countQuery.eq('category', category);
      }

      // Get total count first
      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return {
          success: false,
          errors: [
            {
              code: 'DATABASE_ERROR',
              message: `Failed to count questions: ${countError.message}`,
              taskId: 'query-questions',
              details: countError,
            },
          ],
        };
      }

      const totalQuestions = totalCount || 0;

      // Fetch ALL questions in batches to ensure we get everything
      // Supabase has a default limit of 1000 rows per query, so we need to paginate
      // This ensures random selection works across ALL matching questions, not just the first 1000
      const batchSize = 1000;
      const allCandidates: SourceWhoAmIQuestion[] = [];
      let offset = 0;

      while (offset < totalQuestions) {
        // Build query for this batch
        let batchQuery = supabase
          .from('trivia_who_am_i')
          .select('*')
          .eq('status', 'published')
          .range(offset, offset + batchSize - 1);

        // Apply same filters
        if (theme) {
          batchQuery = batchQuery.ilike('theme', `%${theme}%`);
        }

        if (context.rules.category) {
          const category = context.rules.category.value as string;
          batchQuery = batchQuery.eq('category', category);
        }

        const { data: batchData, error: batchError } = await batchQuery;

        if (batchError) {
          return {
            success: false,
            errors: [
              {
                code: 'DATABASE_ERROR',
                message: `Failed to fetch questions batch: ${batchError.message}`,
                taskId: 'query-questions',
                details: batchError,
              },
            ],
          };
        }

        if (batchData && batchData.length > 0) {
          allCandidates.push(...(batchData as SourceWhoAmIQuestion[]));
        }

        // If we got fewer than batchSize, we've reached the end
        if (!batchData || batchData.length < batchSize) {
          break;
        }

        offset += batchSize;
      }

      const candidates = allCandidates;
      const totalCandidates = candidates.length;

      // Check if we have enough candidates
      if (candidates.length === 0) {
        return {
          success: false,
          errors: [
            {
              code: 'INSUFFICIENT_DATA',
              message: `No questions found matching theme: ${theme}`,
              taskId: 'query-questions',
            },
          ],
          warnings: [
            `No published questions found for theme: ${theme}. Try a different theme or publish more questions.`,
          ],
        };
      }

      if (candidates.length < questionCount) {
        return {
          success: true,
          data: { candidates },
          warnings: [
            `Only ${candidates.length} questions available, but ${questionCount} requested. Will create set with available questions.`,
          ],
          metadata: {
            candidateCount: candidates.length,
            requestedCount: questionCount,
            totalCandidates,
          },
        };
      }

      return {
        success: true,
        data: { candidates },
        metadata: {
          candidateCount: candidates.length,
          requestedCount: questionCount,
          totalCandidates,
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
            taskId: 'query-questions',
            details: error,
          },
        ],
      };
    }
  },
};

