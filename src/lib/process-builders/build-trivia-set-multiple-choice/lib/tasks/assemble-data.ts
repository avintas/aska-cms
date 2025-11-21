/**
 * Task 4: Assemble Question Data
 * Transforms selected questions to TriviaQuestionData format
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import type {
  SourceMultipleChoiceQuestion,
  MultipleChoiceQuestionData,
} from '../types';

export const assembleDataTask: ProcessBuilderTask = {
  id: 'assemble-data',
  name: 'Assemble Question Data',
  description: 'Transforms selected questions to final format',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // Get selected questions from Task 2
      const selectResult = context.previousResults?.[1];
      if (!selectResult || !selectResult.success) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_CONTEXT',
              message: 'Previous task (select-balance) did not succeed',
              taskId: 'assemble-data',
            },
          ],
        };
      }

      const selected = (selectResult.data as { selected: SourceMultipleChoiceQuestion[] })
        .selected;

      if (!Array.isArray(selected) || selected.length === 0) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_DATA',
              message: 'No selected questions available',
              taskId: 'assemble-data',
            },
          ],
        };
      }

      // Transform to question data format
      const questionData: MultipleChoiceQuestionData[] = selected.map(
        (question, index) => {
          // Shuffle wrong answers for variety
          const shuffledWrongAnswers = shuffleArray([...question.wrong_answers]);

          return {
            question_id: `q-${question.id}-${index}`,
            source_id: question.id,
            question_text: question.question_text,
            question_type: 'multiple-choice',
            correct_answer: question.correct_answer,
            wrong_answers: shuffledWrongAnswers,
            explanation: question.explanation || null,
            tags: question.tags || null,
            difficulty: question.difficulty || null,
            points: 10, // Default points
            time_limit: 30, // Default 30 seconds
          };
        },
      );

      // Shuffle question order
      const shuffledData = shuffleArray(questionData);

      return {
        success: true,
        data: { questionData: shuffledData },
        metadata: {
          questionCount: shuffledData.length,
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
            taskId: 'assemble-data',
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

