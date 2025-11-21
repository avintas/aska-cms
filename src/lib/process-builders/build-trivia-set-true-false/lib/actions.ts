/**
 * Server Actions for Build Trivia Set - True/False
 * Server actions that can be called from client components
 */

'use server';

import { buildTriviaSetTrueFalse } from './build-trivia-set-true-false';
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderResult,
} from '../../core/types';

/**
 * Server action to build a true/false trivia set
 */
export async function buildTriviaSetTrueFalseAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult> {
  return await buildTriviaSetTrueFalse(goal, rules, options);
}

