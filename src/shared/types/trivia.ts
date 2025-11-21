/**
 * Trivia Types
 * Types for trivia questions (Multiple Choice, True/False, Who Am I)
 */

import type { StandardContentFields, ContentStatus, DifficultyLevel } from './content';

// ========================================================================
// MULTIPLE CHOICE TRIVIA
// ========================================================================

export interface MultipleChoiceTrivia extends StandardContentFields {
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation: string | null;
  difficulty: DifficultyLevel | null;
  tags: string[] | null;
}

export interface MultipleChoiceTriviaCreateInput {
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: DifficultyLevel | null;
  tags?: string[] | null;
  attribution?: string | null;
  status?: ContentStatus;
  source_content_id?: number | null;
}

export interface MultipleChoiceTriviaUpdateInput {
  question_text?: string;
  correct_answer?: string;
  wrong_answers?: string[];
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: DifficultyLevel | null;
  tags?: string[] | null;
  attribution?: string | null;
  status?: ContentStatus | null;
  used_in?: string[] | null;
  display_order?: number | null;
}

export interface MultipleChoiceTriviaFetchParams {
  theme?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

// ========================================================================
// TRUE/FALSE TRIVIA
// ========================================================================

export interface TrueFalseTrivia extends StandardContentFields {
  question_text: string;
  is_true: boolean;
  explanation: string | null;
  difficulty: DifficultyLevel | null;
  tags: string[] | null;
}

export interface TrueFalseTriviaCreateInput {
  question_text: string;
  is_true: boolean;
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: DifficultyLevel | null;
  tags?: string[] | null;
  attribution?: string | null;
  status?: ContentStatus;
  source_content_id?: number | null;
}

export interface TrueFalseTriviaUpdateInput {
  question_text?: string;
  is_true?: boolean;
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: DifficultyLevel | null;
  tags?: string[] | null;
  attribution?: string | null;
  status?: ContentStatus | null;
  used_in?: string[] | null;
  display_order?: number | null;
}

export interface TrueFalseTriviaFetchParams {
  theme?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

// ========================================================================
// WHO AM I TRIVIA
// ========================================================================

export interface WhoAmITrivia extends StandardContentFields {
  question_text: string;
  correct_answer: string;
  explanation: string | null;
  difficulty: DifficultyLevel | null;
  tags: string[] | null;
}

export interface WhoAmITriviaCreateInput {
  question_text: string;
  correct_answer: string;
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: DifficultyLevel | null;
  tags?: string[] | null;
  attribution?: string | null;
  status?: ContentStatus;
  source_content_id?: number | null;
}

export interface WhoAmITriviaUpdateInput {
  question_text?: string;
  correct_answer?: string;
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: DifficultyLevel | null;
  tags?: string[] | null;
  attribution?: string | null;
  status?: ContentStatus | null;
  used_in?: string[] | null;
  display_order?: number | null;
}

export interface WhoAmITriviaFetchParams {
  theme?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

// ========================================================================
// VALIDATION HELPERS
// ========================================================================

/**
 * Difficulty levels as const array (for validation)
 */
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

/**
 * Type guard: Check if value is valid difficulty
 */
export function isValidDifficulty(value: unknown): value is DifficultyLevel {
  return DIFFICULTY_LEVELS.includes(value as DifficultyLevel);
}

/**
 * Validate Multiple Choice Trivia input
 * Ensures wrong_answers has exactly 3 items
 */
export function validateMultipleChoiceTriviaInput(
  input: Partial<MultipleChoiceTriviaCreateInput>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.question_text || input.question_text.trim() === '') {
    errors.push('question_text is required');
  }

  if (!input.correct_answer || input.correct_answer.trim() === '') {
    errors.push('correct_answer is required');
  }

  if (!input.wrong_answers || !Array.isArray(input.wrong_answers)) {
    errors.push('wrong_answers must be an array');
  } else if (input.wrong_answers.length !== 3) {
    errors.push('wrong_answers must contain exactly 3 items');
  } else if (input.wrong_answers.some((ans) => !ans || ans.trim() === '')) {
    errors.push('All wrong_answers must be non-empty strings');
  }

  if (input.difficulty && !isValidDifficulty(input.difficulty)) {
    errors.push(`difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

