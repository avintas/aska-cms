/**
 * Trivia Set Types for Multiple Choice
 * Types specific to multiple choice trivia sets
 */

/**
 * Multiple Choice Trivia Set (destination table structure)
 */
export interface MultipleChoiceTriviaSet {
  id?: number;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  question_data: MultipleChoiceQuestionData[];
  question_count: number;
  estimated_duration?: number | null;
  status: 'draft' | 'published' | 'archived';
  visibility?: 'Public' | 'Unlisted' | 'Private' | null;
  published_at?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Question data structure stored in question_data JSONB array
 */
export interface MultipleChoiceQuestionData {
  question_id?: string;
  source_id: number; // ID from trivia_multiple_choice table
  question_text: string;
  question_type: 'multiple-choice';
  correct_answer: string;
  wrong_answers: string[];
  explanation?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  points?: number;
  time_limit?: number;
}

/**
 * Source question from trivia_multiple_choice table
 */
export interface SourceMultipleChoiceQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation: string | null;
  category: string | null;
  theme: string | null;
  difficulty: string | null;
  tags: string[] | null;
  attribution: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Generated metadata for trivia set
 */
export interface TriviaSetMetadata {
  title: string;
  slug: string;
  description?: string;
  category?: string;
  theme?: string;
  difficulty?: string;
  tags?: string[];
  estimated_duration?: number;
}

