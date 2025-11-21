/**
 * Trivia Set Types for Who Am I
 * Types specific to Who Am I trivia sets
 */

/**
 * Who Am I Trivia Set (destination table structure)
 */
export interface WhoAmITriviaSet {
  id?: number;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  question_data: WhoAmIQuestionData[];
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
export interface WhoAmIQuestionData {
  question_id?: string;
  source_id: number; // ID from trivia_who_am_i table
  question_text: string; // The clues/question
  question_type: 'who-am-i';
  correct_answer: string; // The answer (person/thing)
  explanation?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  points?: number;
  time_limit?: number;
}

/**
 * Source question from trivia_who_am_i table
 */
export interface SourceWhoAmIQuestion {
  id: number;
  question_text: string; // Clues
  correct_answer: string;
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

