/**
 * Collection Types
 * Types for collection content (Wisdom, Greetings, Stats, Motivational)
 */

import type { StandardContentFields, ContentStatus } from './content';

// ========================================================================
// WISDOM
// ========================================================================

export interface Wisdom extends StandardContentFields {
  title: string;
  musing: string;
  from_the_box: string;
}

export interface WisdomCreateInput {
  title: string;
  musing: string;
  from_the_box: string;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
}

export interface WisdomUpdateInput {
  title?: string;
  musing?: string;
  from_the_box?: string;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
  published_at?: string;
  archived_at?: string;
}

export interface WisdomFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

// ========================================================================
// GREETINGS
// ========================================================================

export interface Greeting extends StandardContentFields {
  greeting_text: string;
}

export interface GreetingCreateInput {
  greeting_text: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
}

export interface GreetingUpdateInput {
  greeting_text?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
  published_at?: string;
  archived_at?: string;
}

export interface GreetingFetchParams {
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

// ========================================================================
// STATS
// ========================================================================

export interface Stat extends StandardContentFields {
  stat_text: string;
  stat_value: string | null;
  stat_category: string | null;
  year: number | null;
}

export interface StatCreateInput {
  stat_text: string;
  stat_value?: string;
  stat_category?: string;
  year?: number;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
}

export interface StatUpdateInput {
  stat_text?: string;
  stat_value?: string;
  stat_category?: string;
  year?: number;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
  published_at?: string;
  archived_at?: string;
}

export interface StatFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  stat_category?: string;
  year?: number;
  limit?: number;
  offset?: number;
}

// ========================================================================
// FACTS
// ========================================================================

export interface Fact extends StandardContentFields {
  fact_text: string;
  fact_value: string | null;
  fact_category: string | null;
  year: number | null;
}

export interface FactCreateInput {
  fact_text: string;
  fact_value?: string;
  fact_category?: string;
  year?: number;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
}

export interface FactUpdateInput {
  fact_text?: string;
  fact_value?: string;
  fact_category?: string;
  year?: number;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
  published_at?: string;
  archived_at?: string;
}

export interface FactFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  fact_category?: string;
  year?: number;
  limit?: number;
  offset?: number;
}

// ========================================================================
// HOCKEY FACTS (F-Gen)
// ========================================================================

export interface HockeyFact {
  id: number;
  text: string;
  category: string | null;
  status: ContentStatus | null;
  theme: string | null;
  source_content_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface HockeyFactCreateInput {
  text: string;
  category?: string;
  status?: ContentStatus;
  theme?: string;
  source_content_id?: number;
}

export interface HockeyFactUpdateInput {
  text?: string;
  category?: string;
  status?: ContentStatus;
  theme?: string;
  source_content_id?: number;
}

export interface HockeyFactFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  source_content_id?: number;
  limit?: number;
  offset?: number;
}

// ========================================================================
// HOCKEY MOTIVATIONAL
// ========================================================================

export interface HockeyMotivate {
  id: number;
  quote: string;
  theme: string | null;
  category: string | null;
  attribution: string | null;
  status: ContentStatus | null;
  source_content_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface HockeyMotivateCreateInput {
  quote: string;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
}

export interface HockeyMotivateUpdateInput {
  quote?: string;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
}

export interface HockeyMotivateFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  source_content_id?: number;
  limit?: number;
  offset?: number;
}

// ========================================================================
// MOTIVATIONAL
// ========================================================================

export interface Motivational extends StandardContentFields {
  quote: string;
  author: string | null;
  context: string | null;
}

export interface MotivationalCreateInput {
  quote: string;
  author?: string;
  context?: string;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
}

export interface MotivationalUpdateInput {
  quote?: string;
  author?: string;
  context?: string;
  theme?: string;
  category?: string;
  attribution?: string;
  status?: ContentStatus;
  source_content_id?: number;
  used_in?: string[];
  display_order?: number;
  published_at?: string;
  archived_at?: string;
}

export interface MotivationalFetchParams {
  status?: ContentStatus;
  theme?: string;
  category?: string;
  limit?: number;
  offset?: number;
}
