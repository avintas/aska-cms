/**
 * Question Selection Types
 * Types for selecting and balancing questions
 */

/**
 * Distribution strategy for splitting questions
 */
export type DistributionStrategy = 'even' | 'weighted' | 'custom';

/**
 * Question selection criteria
 */
export interface QuestionSelection {
  theme?: string;
  category?: string;
  difficulty?: string;
  minQuestions: number;
  maxQuestions?: number;
}

/**
 * Result of question selection and balancing
 */
export interface QuestionSelectionResult {
  candidates: number; // Total candidates found
  selected: number; // Number selected
  distribution: {
    total: number;
  };
}

