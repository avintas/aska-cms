/**
 * Build Trivia Set - Who Am I
 * Process builder for creating Who Am I trivia sets
 */

import { buildTriviaSetWhoAmI } from './build-trivia-set-who-am-i';
import { buildTriviaSetWhoAmIAction } from './actions';
import type { ProcessBuilderMetadata } from '../../core/types';

// Export main function and action
export { buildTriviaSetWhoAmI, buildTriviaSetWhoAmIAction };

// Export metadata for auto-discovery
export const metadata: ProcessBuilderMetadata = {
  id: 'build-trivia-set-who-am-i',
  name: 'Build Who Am I Trivia Set',
  description:
    'Creates a curated Who Am I trivia set from existing questions',
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

