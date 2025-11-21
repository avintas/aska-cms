/**
 * Server Actions for Build Trivia Set - Who Am I
 * Server actions that can be called from client components
 */

'use server';

import { buildTriviaSetWhoAmI } from './build-trivia-set-who-am-i';
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
  ProcessBuilderResult,
} from '../../core/types';

/**
 * Server action to build a Who Am I trivia set
 */
export async function buildTriviaSetWhoAmIAction(
  goal: ProcessBuilderGoal,
  rules: ProcessBuilderRules,
  options?: ProcessBuilderOptions,
): Promise<ProcessBuilderResult> {
  return await buildTriviaSetWhoAmI(goal, rules, options);
}

