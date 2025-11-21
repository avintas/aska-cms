/**
 * Core Content Types
 * Defines all content types in the Aska system
 */

// ========================================================================
// CONTENT TYPES
// ========================================================================

/**
 * All valid content types in the system
 * Collection types save to dedicated tables (collection_*)
 * Trivia types save to dedicated trivia tables (trivia_multiple_choice, trivia_true_false, trivia_who_am_i)
 */
export type ContentType =
  // Collection content types
  | 'stat'
  | 'fact'
  | 'greeting'
  | 'motivational'
  | 'wisdom'
  // Trivia question types
  | 'multiple-choice'
  | 'true-false'
  | 'who-am-i';

/**
 * Array of all content types (for validation/iteration)
 */
export const ALL_CONTENT_TYPES: ContentType[] = [
  'stat',
  'fact',
  'greeting',
  'motivational',
  'wisdom',
  'multiple-choice',
  'true-false',
  'who-am-i',
];

/**
 * Collection content types only (not trivia)
 */
export const COLLECTION_TYPES: ContentType[] = [
  'stat',
  'fact',
  'greeting',
  'motivational',
  'wisdom',
];

/**
 * Trivia question types only
 */
export const TRIVIA_TYPES: ContentType[] = [
  'multiple-choice',
  'true-false',
  'who-am-i',
];

// ========================================================================
// TYPE GUARDS & HELPERS
// ========================================================================

/**
 * Check if a string is a valid ContentType
 */
export function isContentType(value: string): value is ContentType {
  return ALL_CONTENT_TYPES.includes(value as ContentType);
}

/**
 * Check if content type is a collection type (not trivia)
 */
export function isCollectionType(value: ContentType): boolean {
  return COLLECTION_TYPES.includes(value);
}

/**
 * Check if content type is a trivia type
 */
export function isTriviaType(value: ContentType): boolean {
  return TRIVIA_TYPES.includes(value);
}

/**
 * Get the database table name for a content type
 */
export function getTableName(contentType: ContentType): string {
  const tableMap: Record<ContentType, string> = {
    stat: 'collection_stats',
    fact: 'collection_facts',
    greeting: 'collection_greetings',
    motivational: 'collection_motivational',
    wisdom: 'collection_wisdom',
    'multiple-choice': 'trivia_multiple_choice',
    'true-false': 'trivia_true_false',
    'who-am-i': 'trivia_who_am_i',
  };
  return tableMap[contentType];
}

// ========================================================================
// COMMON FIELDS
// ========================================================================

/**
 * Standard status values for all content
 */
export type ContentStatus = 'unpublished' | 'published' | 'archived' | 'draft';

/**
 * Standard difficulty levels for trivia
 */
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

/**
 * Standard fields present in all content tables
 */
export interface StandardContentFields {
  id: number;
  status: ContentStatus | null;
  theme: string | null;
  category: string | null;
  attribution: string | null;
  source_content_id: number | null;
  used_in: string[] | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
}

