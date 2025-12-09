const THEMES = [
  // Core Themes (5 of 13 total)
  'Players',
  'Teams & Organizations',
  'Venues & Locations',
  'Awards & Honors',
  'Leadership & Staff',
  // Business, Economics, & Management (3)
  'Business & Finance',
  'Media, Broadcasting, & E-Sports',
  'Marketing, Sponsorship, and Merchandising',
  // Technology, Training, & Performance (2)
  'Equipment & Technology',
  'Training, Health, & Wellness',
  // Culture, Fandom, & Community (2)
  'Fandom & Fan Culture',
  'Social Impact & Diversity',
  // Advanced Analysis & Strategy (1)
  'Tactics & Advanced Analytics',
] as const;
type ThemeValue = (typeof THEMES)[number];

const CATEGORY_BY_THEME: Record<ThemeValue, readonly string[]> = {
  Players: [
    'Player Spotlight',
    'Sharpshooters',
    'Net Minders',
    'Icons',
    'Captains',
    'Hockey is Family',
    'Statistics & Records',
    'Career Achievements',
  ],
  'Teams & Organizations': [
    'Stanley Cup Playoffs',
    'NHL Draft',
    'Free Agency',
    'Game Day',
    'Hockey Nations',
    'All-Star Game',
    'Heritage Classic',
    'International Tournaments',
    'Olympics',
  ],
  'Venues & Locations': ['Stadium Series', 'Global Series'],
  'Awards & Honors': [
    'NHL Awards',
    'Milestones',
    'Historical Events',
    'Traditions',
    'Legacy Content',
  ],
  'Leadership & Staff': ['Coaching', 'Management', 'Front Office'],
  'Business & Finance': [
    'Contracts & Salaries',
    'Collective Bargaining',
    'Team Valuations',
    'Revenue Sharing',
    'Financial Operations',
  ],
  'Media, Broadcasting, & E-Sports': [
    'Broadcasting & TV',
    'Streaming Services',
    'Sports Journalism',
    'E-Sports',
    'Video Games',
  ],
  'Marketing, Sponsorship, and Merchandising': [
    'Sponsorships',
    'Endorsements',
    'Merchandise',
    'Advertising',
    'Brand Partnerships',
  ],
  'Equipment & Technology': [
    'Equipment Design',
    'Technology Innovation',
    'Safety Technology',
    'Ice Maintenance',
    'Video Review Systems',
  ],
  'Training, Health, & Wellness': [
    'Training Programs',
    'Nutrition',
    'Sports Psychology',
    'Injury Prevention',
    'Recovery & Rehabilitation',
    'Youth Leagues',
    'Development Programs',
    'Junior Hockey',
  ],
  'Fandom & Fan Culture': [
    'Fan Traditions',
    'Community Events',
    'Watch Parties',
    'Rivalry Culture',
    'Fan Experiences',
  ],
  'Social Impact & Diversity': [
    'Diversity & Inclusion',
    'Charitable Initiatives',
    'Community Outreach',
    'Environmental Impact',
    'Social Programs',
  ],
  'Tactics & Advanced Analytics': [
    'Coaching Systems',
    'Tactical Analysis',
    'Advanced Metrics',
    'Strategy Breakdowns',
    'Performance Analysis',
    'Game Rules',
    'Penalties & Infractions',
    'Officiating',
  ],
};

export interface ExtractedMetadata {
  theme: ThemeValue;
  tags: string[];
  category: string | null;
  summary: string;
}

export interface EnrichedContent {
  title: string;
  key_phrases: string[];
}

function coerceSummary(obj: Record<string, unknown>): string | undefined {
  const candidates = ['summary', 'summary_text', 'metadata_summary', 'content_summary'];
  for (const key of candidates) {
    const value = obj?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

export function validateExtractedMetadata(input: unknown): {
  valid: boolean;
  errors: string[];
  value?: ExtractedMetadata;
} {
  const errors: string[] = [];
  const obj = input as Record<string, unknown>;

  const theme = obj?.theme as string | undefined;
  const tags = obj?.tags as unknown;
  const category = (obj?.category as string | null | undefined) ?? null;
  const summary = coerceSummary(obj);

  if (!theme || !THEMES.includes(theme as ThemeValue)) {
    errors.push('theme must be one of the 13 standardized themes');
  }
  if (!Array.isArray(tags) || tags.length < 1 || tags.some((t) => typeof t !== 'string')) {
    errors.push('tags must be a non-empty array of strings');
  }
  if (category !== null && typeof category === 'string') {
    const t = theme as ThemeValue;
    if (THEMES.includes(t)) {
      const allowed = CATEGORY_BY_THEME[t];
      if (!allowed.includes(category)) {
        errors.push('category must be one of the allowed values for the selected theme');
      }
    }
  } else if (category !== null) {
    errors.push('category must be a string or null');
  }
  if (!summary) {
    errors.push('summary is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    value: {
      theme: theme as ThemeValue,
      tags: tags as string[],
      category,
      summary: summary!,
    },
  };
}

export function validateEnrichedContent(input: unknown): {
  valid: boolean;
  errors: string[];
  value?: EnrichedContent;
} {
  const errors: string[] = [];
  const obj = input as Record<string, unknown>;

  const title = obj?.title as string | undefined;
  const keyPhrases = obj?.key_phrases as unknown;

  if (!title || typeof title !== 'string') {
    errors.push('title is required');
  }
  if (!Array.isArray(keyPhrases) || keyPhrases.some((t) => typeof t !== 'string')) {
    errors.push('key_phrases must be an array of strings');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    value: {
      title: title!,
      key_phrases: keyPhrases as string[],
    },
  };
}

export interface ContentSuitabilityAnalysis {
  multiple_choice_trivia?: { suitable: boolean; confidence: number; reasoning: string };
  true_false_trivia?: { suitable: boolean; confidence: number; reasoning: string };
  motivational?: { suitable: boolean; confidence: number; reasoning: string };
  facts?: { suitable: boolean; confidence: number; reasoning: string };
  wisdom?: { suitable: boolean; confidence: number; reasoning: string };
}

export function validateContentSuitabilityAnalysis(input: unknown): {
  valid: boolean;
  errors: string[];
  value?: ContentSuitabilityAnalysis;
} {
  const errors: string[] = [];
  const obj = input as Record<string, unknown>;

  const contentTypes = [
    'multiple_choice_trivia',
    'true_false_trivia',
    'motivational',
    'facts',
    'wisdom',
  ];

  const result: ContentSuitabilityAnalysis = {};

  for (const contentType of contentTypes) {
    const analysis = obj?.[contentType] as Record<string, unknown> | undefined;
    if (analysis) {
      const suitable = analysis.suitable as boolean | undefined;
      const confidence = analysis.confidence as number | undefined;
      const reasoning = analysis.reasoning as string | undefined;

      if (typeof suitable !== 'boolean') {
        errors.push(`${contentType}.suitable must be a boolean`);
        continue;
      }
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        errors.push(`${contentType}.confidence must be a number between 0 and 1`);
        continue;
      }
      if (typeof reasoning !== 'string') {
        errors.push(`${contentType}.reasoning must be a string`);
        continue;
      }

      result[contentType as keyof ContentSuitabilityAnalysis] = {
        suitable,
        confidence,
        reasoning,
      };
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    value: result,
  };
}


