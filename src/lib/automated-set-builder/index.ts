/**
 * Automated Set Builder
 * Main exports for the Automated Set Building System
 */

// Core builder
export { buildAutomatedSets } from './build-automated-sets';
export type { BuildAutomatedSetsResult } from './build-automated-sets';

// Configuration
export {
  getAutomatedBuilderConfig,
  updateAutomatedBuilderConfig,
  updateLastRunInfo,
} from './config';

// Helpers
export { queryQuestionsByUsage } from './helpers/query-questions-by-usage';
export type { QueryQuestionsByUsageOptions } from './helpers/query-questions-by-usage';

export {
  incrementQuestionUsage,
  trackSetUsage,
  extractQuestionIds,
} from './helpers/track-usage';

