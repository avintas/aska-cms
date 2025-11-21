/**
 * Build Trivia Set - Multiple Choice
 * Process builder for creating multiple choice trivia sets
 */

import { buildTriviaSetMultipleChoice } from './build-trivia-set-multiple-choice';
import { buildTriviaSetMultipleChoiceAction } from './actions';
import type { ProcessBuilderMetadata } from '../../core/types';

// Export main function and action
export { buildTriviaSetMultipleChoice, buildTriviaSetMultipleChoiceAction };

// Export metadata for auto-discovery
export const metadata: ProcessBuilderMetadata = {
  id: 'build-trivia-set-multiple-choice',
  name: 'Build Multiple Choice Trivia Set',
  description:
    'Creates a curated multiple choice trivia set from existing questions',
  version: '1.0.0',
  tasks: [
    'query-questions',
    'select-balance',
    'generate-metadata',
    'assemble-data',
    'create-record',
    'validate-finalize',
  ],
  requiredRules: ['questionCount'],
  optionalRules: ['theme', 'category'],
  limits: {
    questionCount: { min: 1, max: 100 },
  },
};

