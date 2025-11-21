/**
 * Shareables Calendarization System Types
 * Phase 1: Motivational content only
 */

// ========================================================================
// DAILY SHAREABLE ITEM
// ========================================================================

/**
 * A single shareable item within a day's collection
 * Contains complete pre-processed content ready to display
 */
export interface DailyShareableItem {
  /** Unique ID from source table (collection_motivational) */
  id: number;

  /** The motivational quote text */
  quote: string;

  /** Author name (if available) */
  author: string | null;

  /** Context or background information (if available) */
  context: string | null;

  /** Theme category (e.g., "legends", "modern", "history") */
  theme: string | null;

  /** Sub-category */
  category: string | null;

  /** Attribution or source information */
  attribution: string | null;

  /** Display position within the day's collection (1-based index) */
  display_order: number;
}

// ========================================================================
// DAILY SHAREABLE COLLECTION
// ========================================================================

/**
 * Complete daily motivational shareable collection stored in database
 * One row = one day = pre-processed items ready to display
 * Phase 1: Motivational only
 * Future: Will have DailyShareableWisdom, DailyShareableStats, DailyShareableGreetings
 */
export interface DailyShareableMotivational {
  /** Primary key - auto-incrementing unique identifier */
  id: number;

  /** The date this collection is scheduled to publish (ISO date string, optional) */
  publish_date: string | null;

  /**
   * Pre-processed array of motivational items ready to display
   * Number of items is flexible (typically 7-12 items, but can vary)
   */
  items: DailyShareableItem[];

  /** Day of week as text: "Sunday", "Monday", etc. (optional) */
  day_of_week: string | null;

  /** Week of year as number: 1-53 (optional) */
  week_of_year: number | null;

  /** Special occasion: "Halloween", "Christmas", etc. (optional) */
  special_occasion: string | null;

  /** Special season: "Playoffs", "Regular Season", etc. (optional) */
  special_season: string | null;

  /** When this schedule entry was created */
  created_at: string;

  /** When this schedule entry was last updated */
  updated_at: string;
}

/**
 * Generic type for any daily shareable (for future use with multiple types)
 */
export type DailyShareable = DailyShareableMotivational;

// ========================================================================
// API REQUEST/RESPONSE TYPES
// ========================================================================

/**
 * Request to generate a schedule
 * Phase 1: Motivational only
 * Future: Will expand to support other content types
 */
export interface GenerateScheduleRequest {
  /** Starting date for the schedule (ISO date string: YYYY-MM-DD) */
  start_date: string;

  /** Number of consecutive days to generate (7, 30, 365, etc.) */
  days: number;

  /** Content type to generate (Phase 1: only 'motivational') */
  content_type: 'motivational';
}

/**
 * Response from schedule generation
 */
export interface GenerateScheduleResponse {
  /** Whether generation was successful */
  success: boolean;

  /** Number of dates that were generated */
  dates_generated: number;

  /** Date range that was generated */
  date_range: {
    start: string; // ISO date string
    end: string; // ISO date string
  };

  /** Error message if generation failed */
  error?: string;
}

/**
 * Query parameters for fetching schedules
 * Phase 1: Motivational only
 */
export interface GetScheduleParams {
  /** Get specific date (ISO date string) */
  date?: string;

  /** Get date range - start date */
  start_date?: string;

  /** Get date range - end date */
  end_date?: string;

  /** Content type (Phase 1: only 'motivational', future: will expand) */
  content_type?: 'motivational';
}

/**
 * Response for today's shareables (web app)
 */
export interface TodayShareablesResponse {
  success: boolean;
  data: {
    publish_date: string;
    items: DailyShareableItem[];
  } | null;
  error?: string;
}

/**
 * Content release report data
 */
export interface ScheduleReport {
  /** Total number of scheduled days */
  total_days: number;

  /** Date range covered */
  date_range: {
    start: string;
    end: string;
  };

  /** Array of scheduled dates */
  scheduled_dates: string[];

  /** Coverage gaps (dates without schedules) */
  gaps: string[];

  /** Statistics */
  stats: {
    earliest_date: string | null;
    latest_date: string | null;
    total_items: number; // total items across all scheduled days
  };
}

// ========================================================================
// FREQUENCY CONTROL TYPES
// ========================================================================

/**
 * Tracks usage of content items during generation
 */
export interface ContentUsageTracker {
  /** Map of content ID to number of times used */
  usage: Map<number, number>;

  /** Maximum times any item can appear */
  max_appearances: number;

  /** Total slots to fill (days × items_per_day) */
  total_slots: number;

  /** Total items available */
  total_items: number;
}
