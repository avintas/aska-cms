/**
 * Task 6: Validate & Finalize
 * Validates the created trivia set and finalizes it
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import type { WhoAmITriviaSet, WhoAmIQuestionData } from '../types';

export const validateFinalizeTask: ProcessBuilderTask = {
  id: 'validate-finalize',
  name: 'Validate & Finalize',
  description: 'Validates trivia set and finalizes creation',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // Get created trivia set from Task 5
      const createResult = context.previousResults?.[4];
      if (!createResult || !createResult.success) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_CONTEXT',
              message: 'Previous task (create-record) did not succeed',
              taskId: 'validate-finalize',
            },
          ],
        };
      }

      const triviaSet = (createResult.data as {
        triviaSet: WhoAmITriviaSet;
      }).triviaSet;

      // Get question count from rules
      const questionCountRule = context.rules.questionCount;
      const expectedCount = (questionCountRule?.value as number) || 0;

      const validationErrors: string[] = [];
      const warnings: string[] = [];

      // Validate question count
      if (triviaSet.question_count !== expectedCount) {
        warnings.push(
          `Question count mismatch: expected ${expectedCount}, got ${triviaSet.question_count}`,
        );
      }

      // Validate required fields
      if (!triviaSet.title || triviaSet.title.trim() === '') {
        validationErrors.push('Title is required');
      }

      if (!triviaSet.slug || triviaSet.slug.trim() === '') {
        validationErrors.push('Slug is required');
      }

      // Validate question data
      if (!Array.isArray(triviaSet.question_data)) {
        validationErrors.push('question_data must be an array');
      } else {
        if (triviaSet.question_data.length === 0) {
          validationErrors.push('question_data cannot be empty');
        }

        // Validate each question
        for (let i = 0; i < triviaSet.question_data.length; i++) {
          const question = triviaSet.question_data[i] as WhoAmIQuestionData;
          const questionErrors = validateQuestion(question, i);
          validationErrors.push(...questionErrors);
        }

        // Check for duplicates
        const questionIds = triviaSet.question_data.map(
          (q) => (q as WhoAmIQuestionData).source_id,
        );
        const uniqueIds = new Set(questionIds);
        if (questionIds.length !== uniqueIds.size) {
          validationErrors.push('Duplicate questions detected in set');
        }
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors.map((error) => ({
            code: 'VALIDATION_FAILED',
            message: error,
            taskId: 'validate-finalize',
          })),
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }

      return {
        success: true,
        data: { triviaSet },
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          validated: true,
          questionCount: triviaSet.question_count,
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
            taskId: 'validate-finalize',
            details: error,
          },
        ],
      };
    }
  },
};

/**
 * Validate a single question
 */
function validateQuestion(
  question: WhoAmIQuestionData,
  index: number,
): string[] {
  const errors: string[] = [];

  if (!question.question_text || question.question_text.trim() === '') {
    errors.push(`Question ${index + 1}: question_text is required`);
  }

  if (!question.correct_answer || question.correct_answer.trim() === '') {
    errors.push(`Question ${index + 1}: correct_answer is required`);
  }

  if (question.question_type !== 'who-am-i') {
    errors.push(
      `Question ${index + 1}: question_type must be 'who-am-i'`,
    );
  }

  if (!question.source_id) {
    errors.push(`Question ${index + 1}: source_id is required`);
  }

  return errors;
}

