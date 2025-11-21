/**
 * Build Trivia Set - True/False
 * Process builder for creating true/false trivia sets
 */

import { buildTriviaSetTrueFalse } from './build-trivia-set-true-false';
import { buildTriviaSetTrueFalseAction } from './actions';
import type { ProcessBuilderMetadata } from '../../core/types';

// Export main function and action
export { buildTriviaSetTrueFalse, buildTriviaSetTrueFalseAction };

// Export metadata for auto-discovery
export const metadata: ProcessBuilderMetadata = {
  id: 'build-trivia-set-true-false',
  name: 'Build True/False Trivia Set',
  description:
    'Creates a curated true/false trivia set from existing questions',
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

