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

/**
 * Get the list of valid themes as a formatted string for prompts
 */
export function getValidThemesList(): string {
  return THEMES.join(', ');
}

/**
 * Get the list of valid themes with categories for prompts
 */
export function getValidThemesWithCategories(): string {
  return THEMES.map((theme) => {
    const categories = CATEGORY_BY_THEME[theme];
    return `- ${theme}${categories.length > 0 ? ` (Categories: ${categories.join(', ')})` : ''}`;
  }).join('\n');
}

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

  const themeRaw = obj?.theme as string | undefined;
  const theme = themeRaw?.trim();
  const tags = obj?.tags as unknown;
  const category = (obj?.category as string | null | undefined) ?? null;
  const summary = coerceSummary(obj);

  if (!theme) {
    errors.push(`theme is required. Valid themes are: ${THEMES.join(', ')}`);
  } else {
    // Normalize common variations before matching
    const normalizeTheme = (t: string): string => {
      return t
        .replace(/\s*&\s*/g, ' and ') // Replace "&" with "and"
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    const normalizedTheme = normalizeTheme(theme);
    
    // Try case-insensitive matching with normalized version
    const matchedTheme = THEMES.find((t) => {
      const normalizedT = normalizeTheme(t);
      return normalizedT.toLowerCase() === normalizedTheme.toLowerCase();
    });

    if (!matchedTheme) {
      errors.push(
        `theme "${theme}" is not valid. Must be one of these 13 standardized themes: ${THEMES.join(', ')}`
      );
    } else if (matchedTheme !== theme) {
      // Theme matched but with variation (case, & vs and, etc.) - auto-fix
      (obj as Record<string, unknown>).theme = matchedTheme;
    }
  }
  if (!Array.isArray(tags) || tags.length < 1 || tags.some((t) => typeof t !== 'string')) {
    errors.push('tags must be a non-empty array of strings');
  }
  if (category !== null && typeof category === 'string') {
    // Use the matched theme (correctly cased) if we found one
    const themeToCheck = (theme && THEMES.find((t) => t.toLowerCase() === theme.toLowerCase())) || theme;
    const t = themeToCheck as ThemeValue;
    if (THEMES.includes(t)) {
      const allowed = CATEGORY_BY_THEME[t];
      if (!allowed.includes(category)) {
        errors.push(
          `category "${category}" is not valid for theme "${t}". Valid categories: ${allowed.join(', ')}`
        );
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

  // Get the correctly cased theme (either original or auto-corrected)
  const finalTheme = (obj.theme as string)?.trim() as ThemeValue;
  if (!THEMES.includes(finalTheme)) {
    // This shouldn't happen, but double-check
    return {
      valid: false,
      errors: [`Theme validation failed. Received: "${finalTheme}". Valid themes: ${THEMES.join(', ')}`],
    };
  }

  return {
    valid: true,
    errors: [],
    value: {
      theme: finalTheme,
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

/**
 * Suitability analysis uses the same keys as generator tracks:
 *   - trivia_multiple_choice
 *   - trivia_true_false
 *   - trivia_who_am_i
 *   - motivational
 *   - facts
 *   - wisdom
 */
export interface ContentSuitabilityAnalysis {
  trivia_multiple_choice?: { suitable: boolean; confidence: number; reasoning: string };
  trivia_true_false?: { suitable: boolean; confidence: number; reasoning: string };
  trivia_who_am_i?: { suitable: boolean; confidence: number; reasoning: string };
  motivational?: { suitable: boolean; confidence: number; reasoning: string };
  facts?: { suitable: boolean; confidence: number; reasoning: string };
  wisdom?: { suitable: boolean; confidence: number; reasoning: string };
}

// Legacy key names for backwards compatibility with existing database data
const LEGACY_KEY_MAP: Record<string, keyof ContentSuitabilityAnalysis> = {
  multiple_choice_trivia: 'trivia_multiple_choice',
  true_false_trivia: 'trivia_true_false',
  who_am_i_trivia: 'trivia_who_am_i',
};

export function validateContentSuitabilityAnalysis(input: unknown): {
  valid: boolean;
  errors: string[];
  value?: ContentSuitabilityAnalysis;
} {
  const errors: string[] = [];
  const obj = input as Record<string, unknown>;

  // Current key names (matching generator track keys)
  const contentTypes: Array<keyof ContentSuitabilityAnalysis> = [
    'trivia_multiple_choice',
    'trivia_true_false',
    'trivia_who_am_i',
    'motivational',
    'facts',
    'wisdom',
  ];

  const result: ContentSuitabilityAnalysis = {};

  for (const contentType of contentTypes) {
    // Try current key first, then fall back to legacy key
    let analysis = obj?.[contentType] as Record<string, unknown> | undefined;
    
    // Check for legacy key names (for existing database data)
    if (!analysis) {
      const legacyKey = Object.entries(LEGACY_KEY_MAP).find(([, v]) => v === contentType)?.[0];
      if (legacyKey) {
        analysis = obj?.[legacyKey] as Record<string, unknown> | undefined;
      }
    }

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

      result[contentType] = {
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


