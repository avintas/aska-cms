/**
 * Trivia Set Types for True/False
 * Types specific to true/false trivia sets
 */

/**
 * True/False Trivia Set (destination table structure)
 */
export interface TrueFalseTriviaSet {
  id?: number;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  question_data: TrueFalseQuestionData[];
  question_count: number;
  estimated_duration?: number | null;
  status: 'draft' | 'published' | 'scheduled';
  visibility?: 'Public' | 'Unlisted' | 'Private' | null;
  published_at?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Question data structure stored in question_data JSONB array
 */
export interface TrueFalseQuestionData {
  question_id?: string;
  source_id: number; // ID from trivia_true_false table
  question_text: string;
  question_type: 'true-false';
  correct_answer: boolean; // Note: This is used in the JSONB question_data, not the database column
  explanation?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  points?: number;
  time_limit?: number;
}

/**
 * Source question from trivia_true_false table
 * Note: Database column is is_true, but we map it to correct_answer for consistency in question_data
 */
export interface SourceTrueFalseQuestion {
  id: number;
  question_text: string;
  is_true: boolean; // Database column name
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
