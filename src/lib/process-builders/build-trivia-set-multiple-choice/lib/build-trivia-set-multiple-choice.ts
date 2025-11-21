/**
 * Build Trivia Set - Multiple Choice
 * Main function that orchestrates all tasks to create a multiple choice trivia set
 */

import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderResult,
} from '../../core/types';
import { ProcessBuilderExecutor } from '../../core/executor';
import { queryQuestionsTask } from './tasks/query-questions';
import { selectBalanceTask } from './tasks/select-balance';
import { generateMetadataTask } from './tasks/generate-metadata';
import { assembleDataTask } from './tasks/assemble-data';
import { createRecordTask } from './tasks/create-record';
import { validateFinalizeTask } from './tasks/validate-finalize';

/**
 * Build a multiple choice trivia set from existing questions
 */
export async function buildTriviaSetMultipleChoice(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult> {
  // Create executor with all tasks
  const executor = new ProcessBuilderExecutor([
    queryQuestionsTask,
    selectBalanceTask,
    generateMetadataTask,
    assembleDataTask,
    createRecordTask,
    validateFinalizeTask,
  ]);

  // Execute process
  const result = await executor.execute(goal, rules, options);

  // Add process-specific metadata
  return {
    ...result,
    processId: 'build-trivia-set-multiple-choice',
    processName: 'Build Multiple Choice Trivia Set',
  };
}

