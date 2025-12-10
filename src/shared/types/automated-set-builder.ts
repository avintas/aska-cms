/**
 * Automated Set Builder Types
 * Types for the Automated Set Building System (ASBS)
 */

import type { MultipleChoiceTriviaSet } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/types/trivia-set';

// ========================================================================
// SET TYPE
// ========================================================================

export type TriviaSetType = 'mc' | 'tf' | 'wai';

// ========================================================================
// COLLECTION TRIVIA SETS
// ========================================================================

/**
 * A single trivia set stored in collection_trivia_sets
 * Contains the full set object with its type identifier
 */
export interface CollectionTriviaSetEntry {
  /** Type of trivia set */
  type: TriviaSetType;
  /** Full set object (matches the structure from sets_trivia_multiple_choice, sets_trivia_true_false, or sets_trivia_who_am_i) */
  set: MultipleChoiceTriviaSet; // TODO: Create union type for all set types when TF/WAI are added
}

/**
 * Collection of trivia sets for a single publish date
 * Stored in collection_trivia_sets table
 */
export interface CollectionTriviaSets {
  /** Primary key */
  id: number;
  /** The date these sets are scheduled to publish (ISO date string) */
  publish_date: string;
  /** Array of complete trivia sets stored as JSONB */
  sets: CollectionTriviaSetEntry[];
  /** Number of sets in the collection */
  set_count: number;
  /** Status of the automated run */
  run_status: 'completed' | 'partial' | 'failed';
  /** Message about the run (success message or error) */
  run_message: string | null;
  /** When this collection was created */
  created_at: string;
  /** When this collection was last updated */
  updated_at: string;
}

/**
 * Input for creating a new collection entry
 */
export interface CollectionTriviaSetsCreateInput {
  publish_date: string;
  sets: CollectionTriviaSetEntry[];
  set_count?: number;
  run_status?: 'completed' | 'partial' | 'failed';
  run_message?: string | null;
}

// ========================================================================
// AUTOMATED SET BUILDER CONFIG
// ========================================================================

/**
 * Configuration for the Automated Set Building System
 * Stored in automated_set_builder_config table (single row, id=1)
 */
export interface AutomatedSetBuilderConfig {
  /** Primary key (always 1) */
  id: number;
  /** Whether the automated system is enabled */
  enabled: boolean;
  /** Number of sets to create per day */
  sets_per_day: number;
  /** Number of questions per set */
  questions_per_set: number;
  /** Array of theme names to include in the mix (null = all themes) */
  themes: string[] | null;
  /** Whether to enforce balanced theme distribution */
  balance_themes: boolean;
  /** Cron schedule expression (e.g., '0 2 * * *' for daily at 2 AM UTC) */
  cron_schedule: string;
  /** Last run timestamp */
  last_run_at: string | null;
  /** Last run status */
  last_run_status: 'success' | 'partial' | 'failed' | null;
  /** Last run message/error */
  last_run_message: string | null;
  /** When config was created */
  created_at: string;
  /** When config was last updated */
  updated_at: string;
}

/**
 * Input for updating the automated builder configuration
 */
export interface AutomatedSetBuilderConfigUpdateInput {
  enabled?: boolean;
  sets_per_day?: number;
  questions_per_set?: number;
  themes?: string[] | null;
  balance_themes?: boolean;
  cron_schedule?: string;
  last_run_at?: string | null;
  last_run_status?: 'success' | 'partial' | 'failed' | null;
  last_run_message?: string | null;
}

/**
 * Theme selection for automated builder
 */
export interface ThemeSelection {
  /** Theme name */
  name: string;
  /** Whether this theme is included in the mix */
  included: boolean;
}

