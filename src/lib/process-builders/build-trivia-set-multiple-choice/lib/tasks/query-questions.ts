/**
 * Task 1: Query Source Questions
 * Fetches multiple choice questions from trivia_multiple_choice table
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type { SourceMultipleChoiceQuestion } from '../types';

export const queryQuestionsTask: ProcessBuilderTask = {
  id: 'query-questions',
  name: 'Query Source Questions',
  description: 'Fetches multiple choice questions matching theme and criteria',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // Check if pre-selected candidates are provided (for automated builds)
      const preSelectedCandidates = context.options?.preSelectedCandidates as
        | SourceMultipleChoiceQuestion[]
        | undefined;

      if (preSelectedCandidates && Array.isArray(preSelectedCandidates)) {
        // Use pre-selected candidates (already filtered and sorted by usage)
        const questionCountRule = context.rules.questionCount;
        // Use nullish coalescing (??) instead of || to properly handle 0 as a valid number
        const questionCount = (questionCountRule?.value as number) ?? preSelectedCandidates.length;

        return {
          success: true,
          data: { candidates: preSelectedCandidates },
          metadata: {
            candidateCount: preSelectedCandidates.length,
            requestedCount: questionCount,
            totalCandidates: preSelectedCandidates.length,
            usingPreSelected: true,
          },
        };
      }

      // Standard query flow (manual builds)
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

      // Build query
      let query = supabase
        .from('trivia_multiple_choice')
        .select('*')
        .eq('status', 'published'); // Only published questions

      // Filter by theme if provided
      if (theme) {
        query = query.ilike('theme', `%${theme}%`);
      }

        // Optional filters from rules
        if (context.rules.category) {
          const category = context.rules.category.value as string;
          query = query.eq('category', category);
        }

        // Note: Difficulty filtering removed - all difficulties are included

      // Execute query to get all candidates
      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          errors: [
            {
              code: 'DATABASE_ERROR',
              message: `Failed to query questions: ${error.message}`,
              taskId: 'query-questions',
              details: error,
            },
          ],
        };
      }

      const candidates = (data || []) as SourceMultipleChoiceQuestion[];
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

