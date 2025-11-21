import type { DifficultyLevel } from '@aska/shared';

/**
 * Minimal TriviaQuestion shape used across Gemini generators.
 * We keep this local to avoid coupling generators to all shared trivia unions.
 */
export interface TriviaQuestion {
  question_type: 'multiple-choice' | 'true-false' | 'who-am-i';
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation: string;
  theme: string;
  category?: string | null;
  difficulty?: DifficultyLevel | null;
}
