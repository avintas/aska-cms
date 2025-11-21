/**
 * Server Actions for Build Trivia Set - Multiple Choice
 * Server actions that can be called from client components
 */

'use server';

import { buildTriviaSetMultipleChoice } from './build-trivia-set-multiple-choice';
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderResult,
} from '../../core/types';

/**
 * Server action to build a multiple choice trivia set
 */
export async function buildTriviaSetMultipleChoiceAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult> {
  return await buildTriviaSetMultipleChoice(goal, rules, options);
}

