import type { ContentType } from '@aska/shared';

export type IdeationTheme =
  // Core Themes (5 of 13 total)
  | 'Players'
  | 'Teams & Organizations'
  | 'Venues & Locations'
  | 'Awards & Honors'
  | 'Leadership & Staff'
  // Business, Economics, & Management (3)
  | 'Business & Finance'
  | 'Media, Broadcasting, & E-Sports'
  | 'Marketing, Sponsorship, and Merchandising'
  // Technology, Training, & Performance (2)
  | 'Equipment & Technology'
  | 'Training, Health, & Wellness'
  // Culture, Fandom, & Community (2)
  | 'Fandom & Fan Culture'
  | 'Social Impact & Diversity'
  // Advanced Analysis & Strategy (1)
  | 'Tactics & Advanced Analytics';

export interface IdeationThemeStat {
  theme: IdeationTheme;
  totalSources: number;
  publishedSources: number;
  latestIngestedAt: string | null;
}

export interface IdeationCategoryStat {
  category: string;
  total: number;
}

export interface IdeationSourceSummary {
  id: number;
  title: string;
  summary: string;
  theme: IdeationTheme;
  category: string | null;
  tags: string[];
  ingestionStatus: string;
  ingestionProcessId: string | null;
  updatedAt: string;
  usage: SourceUsageKey[];
}

export interface IdeationFilters {
  themes?: IdeationTheme[];
  categories?: string[];
  tags?: string[];
  status?: string[];
  search?: string;
  contentTypes?: ContentType[];
  limit?: number;
  page?: number;
  pageSize?: number;
}

export interface IdeationSearchResult {
  items: IdeationSourceSummary[];
  total: number;
}

export type SourceUsageKey =
  | 'wisdom'
  | 'greeting'
  | 'bench-boss'
  | 'captain-heart'
  | 'motivational' // Legacy/fallback - will be phased out
  | 'stat'
  | 'fact'
  | 'multiple-choice'
  | 'true-false'
  | 'who-am-i';

export interface IdeationTagStat {
  tag: string;
  total: number;
}

export interface IdeationThemeOverview {
  theme: IdeationTheme;
  categories: IdeationCategoryStat[];
}

export interface CollectionInventoryCounts {
  wisdom: number;
  greetings: number;
  motivational: number;
  facts: number;
  sources: number;
  triviaMultipleChoice: number;
  triviaTrueFalse: number;
  triviaWhoAmI: number;
}
