/**
 * Question Selection Types for Who Am I
 * Types related to question selection and balancing
 */

import type { SourceWhoAmIQuestion } from './trivia-set';

/**
 * Selection result containing selected questions
 */
export interface QuestionSelectionResult {
  selected: SourceWhoAmIQuestion[];
}

/**
 * Distribution strategy for question selection
 */
export type DistributionStrategy = 'even' | 'weighted' | 'random';

