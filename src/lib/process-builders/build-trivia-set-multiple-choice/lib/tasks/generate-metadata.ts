/**
 * Task 3: Generate Metadata
 * Generates title, slug, description, and other metadata for the trivia set
 */

import type { ProcessBuilderTask, TaskContext, TaskResult } from '../../../core/types';
import type {
  SourceMultipleChoiceQuestion,
  TriviaSetMetadata,
} from '../types';

export const generateMetadataTask: ProcessBuilderTask = {
  id: 'generate-metadata',
  name: 'Generate Metadata',
  description: 'Generates title, slug, description, and metadata for trivia set',

  async execute(context: TaskContext): Promise<TaskResult> {
    try {
      // Get selected questions from Task 2
      const previousResult = context.previousResults?.[1];
      if (!previousResult || !previousResult.success) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_CONTEXT',
              message: 'Previous task (select-balance) did not succeed',
              taskId: 'generate-metadata',
            },
          ],
        };
      }

      const selected = (previousResult.data as { selected: SourceMultipleChoiceQuestion[] })
        .selected;

      if (!Array.isArray(selected) || selected.length === 0) {
        return {
          success: false,
          errors: [
            {
              code: 'INVALID_DATA',
              message: 'No selected questions available',
              taskId: 'generate-metadata',
            },
          ],
        };
      }

      // Extract theme from goal
      const theme = context.goal.text.trim();

      // Generate metadata
      const metadata: TriviaSetMetadata = {
        title: generateTitle(theme),
        slug: generateSlug(theme),
        description: generateDescription(theme, selected.length),
        category: determineCategory(selected),
        theme: theme || undefined,
        tags: extractTags(selected, theme),
        estimated_duration: estimateDuration(selected.length),
      };

      return {
        success: true,
        data: { metadata },
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: 'TASK_EXECUTION_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown error',
            taskId: 'generate-metadata',
            details: error,
          },
        ],
      };
    }
  },
};

/**
 * Generate title from theme
 */
function generateTitle(theme: string): string {
  if (!theme) {
    return 'Multiple Choice Trivia';
  }
  return `${theme} Trivia`;
}

/**
 * Generate URL-friendly slug from theme
 */
function generateSlug(theme: string): string {
  if (!theme) {
    return `multiple-choice-trivia-${Date.now()}`;
  }

  return theme
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate description
 */
function generateDescription(theme: string, questionCount: number): string {
  if (theme) {
    return `Test your knowledge with ${questionCount} ${theme} multiple choice questions.`;
  }
  return `Test your knowledge with ${questionCount} multiple choice trivia questions.`;
}

/**
 * Determine category from questions
 */
function determineCategory(
  questions: SourceMultipleChoiceQuestion[],
): string | undefined {
  // Get most common category
  const categories = questions
    .map((q) => q.category)
    .filter((c): c is string => c !== null && c !== undefined);

  if (categories.length === 0) {
    return undefined;
  }

  // Count occurrences
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat] = (counts[cat] || 0) + 1;
  }

  // Return most common
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * Extract tags from questions
 */
function extractTags(
  questions: SourceMultipleChoiceQuestion[],
  theme: string,
): string[] {
  const allTags = new Set<string>();

  // Add theme as tag
  if (theme) {
    allTags.add(theme.toLowerCase().trim());
  }

  // Collect tags from questions
  for (const question of questions) {
    if (question.tags && Array.isArray(question.tags)) {
      for (const tag of question.tags) {
        if (tag && typeof tag === 'string') {
          allTags.add(tag.toLowerCase().trim());
        }
      }
    }
  }

  return Array.from(allTags).slice(0, 10); // Limit to 10 tags
}

/**
 * Estimate duration in minutes
 */
function estimateDuration(questionCount: number): number {
  // Assume 30 seconds per question
  return Math.ceil((questionCount * 30) / 60);
}

