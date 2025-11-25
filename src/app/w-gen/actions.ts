'use server';

import { createServerClient } from '@/utils/supabase/server';
import { generateWisdomContent } from '@/lib/gemini/generators/wisdom';
import { searchIdeationSources } from '@/lib/ideation/data';
import type { IdeationFilters, IdeationSearchResult } from '@/lib/ideation';

export interface WisdomPrompt {
  id: number;
  prompt_name: string;
  prompt_content: string;
  content_type: string;
}

export interface SourceItem {
  id: number;
  title: string | null;
  summary: string | null;
  theme: string | null;
}

export interface GenerationResult {
  success: boolean;
  message: string;
  itemCount?: number;
  error?: string;
  generatedItems?: GeneratedWisdomItem[];
}

export interface GeneratedWisdomItem {
  id: number;
  title: string;
  musing: string;
  from_the_box: string;
  theme: string;
  created_at: string;
}

export interface ContentAnalysis {
  wordCount: number;
  sentenceCount: number;
  quoteCount: number;
  wisdomIndicators: number;
  averageSentenceLength: number;
  extractionScore: number;
  assessment: 'excellent' | 'good' | 'fair' | 'poor';
  insights: string[];
}

export interface SourceAnalysisResult {
  sourceId: number;
  sourceTitle: string | null;
  analysis: ContentAnalysis;
}

export interface SourcesReport {
  total: number;
  excellent: SourceAnalysisResult[];
  good: SourceAnalysisResult[];
  fair: SourceAnalysisResult[];
  poor: SourceAnalysisResult[];
  summary: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

/**
 * Fetch the wisdom prompt from collection_prompts table
 */
export async function getWisdomPrompt(): Promise<{
  success: boolean;
  prompt?: WisdomPrompt;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collection_prompts')
      .select('id, prompt_name, prompt_content, content_type')
      .eq('content_type', 'wisdom')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: `Failed to fetch prompt: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No wisdom prompt found in collection_prompts table.',
      };
    }

    return {
      success: true,
      prompt: {
        id: data.id as number,
        prompt_name: data.prompt_name as string,
        prompt_content: data.prompt_content as string,
        content_type: data.content_type as string,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Error fetching prompt: ${message}`,
    };
  }
}

/**
 * Get sources that haven't been used for W-Gen wisdom generation yet
 */
export async function getAvailableSourcesForWisdom(): Promise<{
  success: boolean;
  sources?: SourceItem[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Get all active sources
    const { data: allSources, error: fetchError } = await supabase
      .from('source_content_ingested')
      .select('id, title, summary, theme, used_for')
      .eq('content_status', 'active')
      .order('updated_at', { ascending: false })
      .limit(500);

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch sources: ${fetchError.message}`,
      };
    }

    if (!allSources || allSources.length === 0) {
      return {
        success: true,
        sources: [],
      };
    }

    // FAIL-SAFE: Get sources that have been processed for wisdom
    // Use same approach as badging system - check collection tables directly
    // Check both wisdom tables (collection_wisdom and collection_hockey_wisdom)
    const wisdomTables = ['collection_hockey_wisdom', 'collection_wisdom'];
    const processedSourceIds = new Set<number>();

    await Promise.all(
      wisdomTables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('source_content_id')
          .not('source_content_id', 'is', null);
        if (error) return;
        for (const row of data ?? []) {
          const sourceId = (row as { source_content_id?: number | null }).source_content_id;
          if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
            processedSourceIds.add(sourceId);
          }
        }
      }),
    );

    // Filter to only unprocessed sources
    const availableSources: SourceItem[] = [];

    for (const source of allSources) {
      const sourceId = source.id as number;

      // PRIMARY FAIL-SAFE: Skip if already has wisdom items in collection table
      // This is the most reliable check - if items exist, source was definitely used
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // SECONDARY FAIL-SAFE: Check used_for array as backup
      // This catches cases where marking might have failed but items don't exist yet
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('wisdom') || usedFor.includes('w-gen')) {
        continue;
      }

      // This source is available (passed both checks)
      availableSources.push({
        id: sourceId,
        title: (source.title as string | null) ?? null,
        summary: (source.summary as string | null) ?? null,
        theme: (source.theme as string | null) ?? null,
      });
    }

    return {
      success: true,
      sources: availableSources,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Error fetching available sources: ${message}`,
    };
  }
}

/**
 * Search sources for W-Gen with pagination and usage badges
 */
export async function searchSourcesForWisdom(
  filters: Partial<IdeationFilters> = {},
): Promise<IdeationSearchResult> {
  return searchIdeationSources({
    ...filters,
    pageSize: filters.pageSize ?? 6,
  });
}

/**
 * Fetch a single source by ID with full content
 */
export async function getSourceById(sourceId: number): Promise<{
  success: boolean;
  source?: {
    id: number;
    title: string | null;
    summary: string | null;
    content_text: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('source_content_ingested')
      .select('id, title, summary, content_text')
      .eq('id', sourceId)
      .eq('content_status', 'active')
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: `Failed to fetch source: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Source not found or not active.',
      };
    }

    return {
      success: true,
      source: {
        id: data.id as number,
        title: (data.title as string | null) ?? null,
        summary: (data.summary as string | null) ?? null,
        content_text: (data.content_text as string) ?? '',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Error fetching source: ${message}`,
    };
  }
}

/**
 * Helper to coerce a value to a non-empty string
 */
function coerceString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Normalize wisdom item for collection_hockey_wisdom table
 * More flexible than before to handle variations in Gemini output
 */
function normalizeWisdomItem(
  item: Record<string, unknown>,
  sourceId: number,
): {
  title: string;
  musing: string;
  from_the_box: string;
  theme: string;
  status: string;
  source_content_id: number;
} | null {
  // Try multiple field name variations for title
  const title =
    coerceString(item.title) ??
    coerceString(item.content_title) ??
    coerceString(item.heading) ??
    'Untitled Wisdom';

  // Try multiple field name variations for musing
  const musing =
    coerceString(item.musing) ??
    coerceString(item.musings) ??
    coerceString(item.body) ??
    coerceString(item.content_text) ??
    null;

  // Try multiple field name variations for from_the_box
  const fromTheBox =
    coerceString(item.from_the_box) ??
    coerceString(item.pull_quote) ??
    coerceString(item.highlight) ??
    coerceString(item.quote) ??
    coerceString(item.fromTheBox) ?? // camelCase variant
    null;

  // Theme - try to get it, but validate if present
  const themeRaw =
    coerceString(item.theme) ??
    coerceString(item.category) ?? // Sometimes theme is in category
    null;

  // Validate required fields
  if (!musing || !fromTheBox) {
    return null;
  }

  // Validate theme - must be one of the allowed values
  const allowedThemes = [
    'The Grind',
    'The Room',
    'The Code',
    'The Flow',
    'The Stripes',
    'The Chirp',
  ];

  // Theme is required and must match exactly (case-sensitive)
  if (!themeRaw || !allowedThemes.includes(themeRaw)) {
    return null;
  }

  const theme = themeRaw;

  return {
    title,
    musing,
    from_the_box: fromTheBox,
    theme,
    status: 'draft',
    source_content_id: sourceId,
  };
}

/**
 * Analyze source content for wisdom extraction potential
 */
export async function analyzeSourceContent(sourceId: number): Promise<{
  success: boolean;
  analysis?: ContentAnalysis;
  error?: string;
}> {
  try {
    const sourceResult = await getSourceById(sourceId);
    if (!sourceResult.success || !sourceResult.source) {
      return {
        success: false,
        error: sourceResult.error || 'Failed to load source content.',
      };
    }

    const content = sourceResult.source.content_text;
    const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const quotes = (content.match(/["'']/g) || []).length / 2; // Count quote pairs

    // Wisdom indicator words/phrases
    const wisdomKeywords = [
      'wisdom',
      'lesson',
      'learn',
      'experience',
      'understand',
      'realize',
      'insight',
      'perspective',
      'truth',
      'philosophy',
      'reflection',
      'thought',
      'believe',
      'know',
      'remember',
      'always',
      'never',
      'should',
      'must',
      'important',
    ];

    const wisdomIndicators = wisdomKeywords.filter((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase()),
    ).length;

    const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

    // Calculate extraction score (0-100)
    let score = 0;
    const insights: string[] = [];

    // Word count score (optimal: 200-1000 words)
    if (words.length >= 200 && words.length <= 1000) {
      score += 25;
      insights.push(`✅ Good content length (${words.length} words)`);
    } else if (words.length < 200) {
      score += 10;
      insights.push(`⚠️ Content is short (${words.length} words) - may have limited wisdom`);
    } else {
      score += 20;
      insights.push(`📝 Long content (${words.length} words) - plenty to extract from`);
    }

    // Sentence count score (optimal: 10-50 sentences)
    if (sentences.length >= 10 && sentences.length <= 50) {
      score += 20;
      insights.push(`✅ Good sentence count (${sentences.length} sentences)`);
    } else if (sentences.length < 10) {
      score += 5;
      insights.push(`⚠️ Few sentences (${sentences.length}) - may limit extraction`);
    } else {
      score += 15;
      insights.push(`📊 Many sentences (${sentences.length}) - good for extraction`);
    }

    // Quote presence score
    if (quotes >= 2) {
      score += 20;
      insights.push(`💬 Contains ${Math.floor(quotes)} quote(s) - good wisdom potential`);
    } else if (quotes === 1) {
      score += 10;
      insights.push(`💭 Contains 1 quote - some wisdom potential`);
    } else {
      insights.push(`📝 No direct quotes found - will extract wisdom from narrative`);
    }

    // Wisdom indicators score
    if (wisdomIndicators >= 5) {
      score += 25;
      insights.push(`✨ Strong wisdom language detected (${wisdomIndicators} indicators)`);
    } else if (wisdomIndicators >= 2) {
      score += 15;
      insights.push(`💡 Some wisdom language found (${wisdomIndicators} indicators)`);
    } else {
      score += 5;
      insights.push(`📄 Limited wisdom language - may require more interpretation`);
    }

    // Sentence length score (optimal: 10-25 words per sentence)
    if (averageSentenceLength >= 10 && averageSentenceLength <= 25) {
      score += 10;
      insights.push(`✅ Good sentence structure (avg ${averageSentenceLength.toFixed(1)} words)`);
    } else {
      score += 5;
      insights.push(`📏 Average sentence length: ${averageSentenceLength.toFixed(1)} words`);
    }

    // Determine assessment
    let assessment: ContentAnalysis['assessment'];
    if (score >= 80) {
      assessment = 'excellent';
    } else if (score >= 60) {
      assessment = 'good';
    } else if (score >= 40) {
      assessment = 'fair';
    } else {
      assessment = 'poor';
    }

    return {
      success: true,
      analysis: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        quoteCount: Math.floor(quotes),
        wisdomIndicators,
        averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
        extractionScore: Math.min(100, Math.max(0, score)),
        assessment,
        insights,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Analysis error: ${message}`,
    };
  }
}

/**
 * Fetch generated wisdom items for a source
 */
export async function getGeneratedWisdomItems(sourceId: number): Promise<{
  success: boolean;
  items?: GeneratedWisdomItem[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collection_hockey_wisdom')
      .select('id, title, musing, from_the_box, theme, created_at')
      .eq('source_content_id', sourceId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch generated items: ${error.message}`,
      };
    }

    const items: GeneratedWisdomItem[] = (data || []).map((row) => ({
      id: row.id as number,
      title: row.title as string,
      musing: row.musing as string,
      from_the_box: row.from_the_box as string,
      theme: row.theme as string,
      created_at: row.created_at as string,
    }));

    return {
      success: true,
      items,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Error fetching items: ${message}`,
    };
  }
}

/**
 * Analyze all sources and generate a report grouped by score buckets
 */
export async function generateSourcesReport(): Promise<{
  success: boolean;
  report?: SourcesReport;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Fetch all active sources
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, title, content_text')
      .eq('content_status', 'active')
      .order('updated_at', { ascending: false })
      .limit(500); // Reasonable limit

    if (error) {
      return {
        success: false,
        error: `Failed to fetch sources: ${error.message}`,
      };
    }

    if (!sources || sources.length === 0) {
      return {
        success: true,
        report: {
          total: 0,
          excellent: [],
          good: [],
          fair: [],
          poor: [],
          summary: { excellent: 0, good: 0, fair: 0, poor: 0 },
        },
      };
    }

    // Analyze each source
    const results: SourceAnalysisResult[] = [];

    for (const source of sources) {
      const content = (source.content_text as string) || '';
      if (!content.trim()) continue;

      const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const quotes = (content.match(/["'']/g) || []).length / 2;

      const wisdomKeywords = [
        'wisdom',
        'lesson',
        'learn',
        'experience',
        'understand',
        'realize',
        'insight',
        'perspective',
        'truth',
        'philosophy',
        'reflection',
        'thought',
        'believe',
        'know',
        'remember',
        'always',
        'never',
        'should',
        'must',
        'important',
      ];

      const wisdomIndicators = wisdomKeywords.filter((keyword) =>
        content.toLowerCase().includes(keyword.toLowerCase()),
      ).length;

      const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

      // Calculate extraction score
      let score = 0;

      if (words.length >= 200 && words.length <= 1000) {
        score += 25;
      } else if (words.length < 200) {
        score += 10;
      } else {
        score += 20;
      }

      if (sentences.length >= 10 && sentences.length <= 50) {
        score += 20;
      } else if (sentences.length < 10) {
        score += 5;
      } else {
        score += 15;
      }

      if (quotes >= 2) {
        score += 20;
      } else if (quotes === 1) {
        score += 10;
      }

      if (wisdomIndicators >= 5) {
        score += 25;
      } else if (wisdomIndicators >= 2) {
        score += 15;
      } else {
        score += 5;
      }

      if (averageSentenceLength >= 10 && averageSentenceLength <= 25) {
        score += 10;
      } else {
        score += 5;
      }

      const finalScore = Math.min(100, Math.max(0, score));

      let assessment: ContentAnalysis['assessment'];
      if (finalScore >= 80) {
        assessment = 'excellent';
      } else if (finalScore >= 60) {
        assessment = 'good';
      } else if (finalScore >= 40) {
        assessment = 'fair';
      } else {
        assessment = 'poor';
      }

      results.push({
        sourceId: source.id as number,
        sourceTitle: (source.title as string | null) ?? null,
        analysis: {
          wordCount: words.length,
          sentenceCount: sentences.length,
          quoteCount: Math.floor(quotes),
          wisdomIndicators,
          averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
          extractionScore: finalScore,
          assessment,
          insights: [], // Skip detailed insights for bulk report
        },
      });
    }

    // Group by buckets
    const excellent = results.filter((r) => r.analysis.assessment === 'excellent');
    const good = results.filter((r) => r.analysis.assessment === 'good');
    const fair = results.filter((r) => r.analysis.assessment === 'fair');
    const poor = results.filter((r) => r.analysis.assessment === 'poor');

    return {
      success: true,
      report: {
        total: results.length,
        excellent,
        good,
        fair,
        poor,
        summary: {
          excellent: excellent.length,
          good: good.length,
          fair: fair.length,
          poor: poor.length,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Report generation error: ${message}`,
    };
  }
}

/**
 * Check if a source has already been used for W-Gen wisdom generation
 */
export async function isSourceUsedForWisdom(sourceId: number): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Check if any wisdom items exist for this source
    const { data: existingItems } = await supabase
      .from('collection_hockey_wisdom')
      .select('id')
      .eq('source_content_id', sourceId)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      return true;
    }

    // Also check the used_for array on the source
    const { data: source } = await supabase
      .from('source_content_ingested')
      .select('used_for')
      .eq('id', sourceId)
      .maybeSingle();

    if (source?.used_for && Array.isArray(source.used_for)) {
      const usedFor = source.used_for.map((v) => String(v).toLowerCase());
      if (usedFor.includes('wisdom') || usedFor.includes('w-gen')) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking if source is used:', error);
    // If we can't check, assume it's not used to allow generation
    return false;
  }
}

/**
 * Mark a source as used for W-Gen wisdom generation
 */
async function markSourceAsUsedForWisdom(sourceId: number): Promise<void> {
  try {
    const supabase = await createServerClient();

    // Get current used_for array
    const { data: source } = await supabase
      .from('source_content_ingested')
      .select('used_for')
      .eq('id', sourceId)
      .maybeSingle();

    if (!source) return;

    const currentUsedFor = Array.isArray(source.used_for)
      ? source.used_for.map((v) => String(v))
      : [];

    // Add 'wisdom' if not already present
    if (!currentUsedFor.includes('wisdom')) {
      const updatedUsedFor = [...currentUsedFor, 'wisdom'];
      await supabase
        .from('source_content_ingested')
        .update({ used_for: updatedUsedFor })
        .eq('id', sourceId);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error marking source as used:', error);
    // Don't throw - this is a tracking operation, shouldn't fail the generation
  }
}

/**
 * Generate wisdom content and save to collection_hockey_wisdom table
 */
export async function generateWisdomAction(sourceId: number): Promise<GenerationResult> {
  try {
    // Check if source has already been used
    const alreadyUsed = await isSourceUsedForWisdom(sourceId);
    if (alreadyUsed) {
      return {
        success: false,
        message: 'This source has already been used for wisdom generation. To avoid duplicates, select a different source.',
      };
    }

    // Fetch prompt
    const promptResult = await getWisdomPrompt();
    if (!promptResult.success || !promptResult.prompt) {
      return {
        success: false,
        message: promptResult.error || 'Failed to load prompt.',
      };
    }

    // Fetch source content
    const sourceResult = await getSourceById(sourceId);
    if (!sourceResult.success || !sourceResult.source) {
      return {
        success: false,
        message: sourceResult.error || 'Failed to load source content.',
      };
    }

    const prompt = promptResult.prompt;
    const source = sourceResult.source;

    // Call Gemini API
    const geminiResult = await generateWisdomContent({
      sourceContent: source.content_text,
      customPrompt: prompt.prompt_content,
    });

    if (!geminiResult.success || !geminiResult.data) {
      return {
        success: false,
        message: geminiResult.error || 'Generation failed.',
      };
    }

    // Check if Gemini returned any items at all
    if (geminiResult.data.length === 0) {
      return {
        success: false,
        message: 'Gemini did not generate any items. The source content may not be suitable for wisdom extraction, or the prompt may need adjustment.',
      };
    }

    // Debug: Log what Gemini actually returned
    // eslint-disable-next-line no-console
    console.log('Gemini returned items:', JSON.stringify(geminiResult.data, null, 2));

    // Normalize items
    const normalizedItems = geminiResult.data
      .map((item, index) => {
        const normalized = normalizeWisdomItem(item, sourceId);
        if (!normalized) {
          // eslint-disable-next-line no-console
          console.error(`Item ${index} failed normalization:`, {
            item,
            hasMusing: !!(item.musing || item.musings),
            hasFromTheBox: !!item.from_the_box,
            hasTheme: !!item.theme,
            themeValue: item.theme,
            allKeys: Object.keys(item),
          });
        }
        return normalized;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (normalizedItems.length === 0) {
      // Show sample of what was returned to help debug
      const sampleItem = geminiResult.data[0];
      const sampleKeys = sampleItem ? Object.keys(sampleItem).join(', ') : 'no items';
      return {
        success: false,
        message: `All ${geminiResult.data.length} generated item(s) failed validation. Sample item keys: ${sampleKeys}. Required: musing (or musings), from_the_box, and theme (must be one of: The Grind, The Room, The Code, The Flow, The Stripes, The Chirp). Check console for details.`,
      };
    }

    // Save to database
    const supabase = await createServerClient();
    const { data: insertedData, error } = await supabase
      .from('collection_hockey_wisdom')
      .insert(normalizedItems)
      .select('id, title, musing, from_the_box, theme, created_at');

    if (error) {
      return {
        success: false,
        message: `Failed to save generated content: ${error.message}`,
      };
    }

    const generatedItems: GeneratedWisdomItem[] = (insertedData || []).map((row) => ({
      id: row.id as number,
      title: row.title as string,
      musing: row.musing as string,
      from_the_box: row.from_the_box as string,
      theme: row.theme as string,
      created_at: row.created_at as string,
    }));

    // Mark source as used for wisdom generation
    await markSourceAsUsedForWisdom(sourceId);

    return {
      success: true,
      message: `✅ Successfully generated and saved ${normalizedItems.length} wisdom item(s)!`,
      itemCount: normalizedItems.length,
      generatedItems,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Generation error: ${message}`,
    };
  }
}

