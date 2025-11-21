/**
 * API Response Types
 * Standard response formats for all API endpoints
 */

import type {
  Wisdom,
  Greeting,
  Stat,
  Motivational,
  MultipleChoiceTrivia,
  TrueFalseTrivia,
  WhoAmITrivia,
} from './index';

// ========================================================================
// GENERIC API RESPONSE
// ========================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

// ========================================================================
// COLLECTION API RESPONSES
// ========================================================================

export interface WisdomApiResponse extends ApiResponse<Wisdom | Wisdom[]> {}
export interface GreetingApiResponse extends ApiResponse<Greeting | Greeting[]> {}
export interface StatApiResponse extends ApiResponse<Stat | Stat[]> {}
export interface MotivationalApiResponse extends ApiResponse<Motivational | Motivational[]> {}

// ========================================================================
// TRIVIA API RESPONSES
// ========================================================================

export interface MultipleChoiceTriviaApiResponse
  extends ApiResponse<MultipleChoiceTrivia | MultipleChoiceTrivia[]> {}
export interface TrueFalseTriviaApiResponse
  extends ApiResponse<TrueFalseTrivia | TrueFalseTrivia[]> {}
export interface WhoAmITriviaApiResponse extends ApiResponse<WhoAmITrivia | WhoAmITrivia[]> {}

// ========================================================================
// PUBLIC API RESPONSES (Simplified for external consumption)
// ========================================================================

export interface PublicMultipleChoiceTriviaResponse {
  id: number;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation: string | null;
  category: string | null;
  theme: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  attribution: string | null;
}

export interface PublicTrueFalseTriviaResponse {
  id: number;
  question_text: string;
  is_true: boolean; // Database column name - matches trivia_true_false table
  explanation: string | null;
  category: string | null;
  theme: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  attribution: string | null;
}

export interface PublicWhoAmITriviaResponse {
  id: number;
  question_text: string;
  correct_answer: string;
  explanation: string | null;
  category: string | null;
  theme: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  attribution: string | null;
}

