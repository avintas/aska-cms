/**
 * Question Selection Types for True/False
 * Types related to question selection and balancing
 */

import type { SourceTrueFalseQuestion } from './trivia-set';

/**
 * Selection result containing selected questions
 */
export interface QuestionSelectionResult {
  selected: SourceTrueFalseQuestion[];
}

/**
 * Distribution strategy for question selection
 */
export type DistributionStrategy = 'even' | 'weighted' | 'random';

