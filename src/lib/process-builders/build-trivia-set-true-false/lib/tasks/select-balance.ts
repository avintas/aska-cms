/**
 * Task 2: Select & Balance Questions
 * Selects questions from candidates and balances them
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import type { SourceTrueFalseQuestion } from '../types';

export const selectBalanceTask: ProcessBuilderTask = {
  id: 'select-balance',
  name: 'Select & Balance Questions',
  description: 'Selects and balances questions from candidates',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // Get candidates from Task 1 result
      const previousResult = context.previousResults?.[0];
      if (!previousResult || !previousResult.success) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_CONTEXT',
              message: 'Previous task (query-questions) did not succeed',
              taskId: 'select-balance',
            },
          ],
        };
      }

      const candidates = (previousResult.data as { candidates: SourceTrueFalseQuestion[] })
        .candidates;

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return {
          success: false,
          errors: [
            {
              code: 'INSUFFICIENT_DATA',
              message: 'No candidate questions available',
              taskId: 'select-balance',
            },
          ],
        };
      }

      // Get question count from rules
      const questionCountRule = context.rules.questionCount;
      const questionCount = (questionCountRule?.value as number) || 10;

      // Select questions - simple random selection
      let selected: SourceTrueFalseQuestion[];

      if (candidates.length <= questionCount) {
        // Not enough candidates, use all available
        selected = [...candidates];
      } else {
        // Shuffle and take first N
        selected = shuffleArray(candidates).slice(0, questionCount);
      }

      return {
        success: true,
        data: { selected },
        metadata: {
          selectedCount: selected.length,
          requestedCount: questionCount,
        },
        warnings:
          selected.length < questionCount
            ? [
                `Only ${selected.length} questions selected (requested ${questionCount})`,
              ]
            : undefined,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: 'TASK_EXECUTION_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error',
            taskId: 'select-balance',
            details: error,
          },
        ],
      };
    }
  },
};

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

