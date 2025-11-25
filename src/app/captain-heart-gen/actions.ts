'use server';

import { createServerClient } from '@/utils/supabase/server';
import { generateMotivateContent } from '@/lib/gemini/generators/motivate';
import { searchIdeationSources } from '@/lib/ideation/data';
import type { IdeationFilters, IdeationSearchResult } from '@/lib/ideation';

export interface CaptainHeartPrompt {
  id: number;
  prompt_name: string;
  prompt_content: string;
  content_type: string;
}

export interface GenerationResult {
  success: boolean;
  message: string;
  itemCount?: number;
  error?: string;
  generatedItems?: GeneratedMotivateItem[];
}

export interface GeneratedMotivateItem {
  id: number;
  quote: string;
  category: string | null;
  theme: string | null;
  attribution: string | null;
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

/**
 * Fetch the Captain Heart prompt from collection_prompts table
 */
export async function getCaptainHeartPrompt(): Promise<{
  success: boolean;
  prompt?: CaptainHeartPrompt;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collection_prompts')
      .select('id, prompt_name, prompt_content, content_type')
      .eq('content_type', 'motivational')
      .eq('prompt_name', 'Captain Heart')
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
        error: 'No Captain Heart prompt found in collection_prompts table.',
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
 * Search sources for Captain Heart generator with pagination and usage badges
 */
export async function searchSourcesForCaptainHeart(
  filters: Partial<IdeationFilters> = {},
): Promise<IdeationSearchResult> {
  return searchIdeationSources({
    ...filters,
    pageSize: filters.pageSize ?? 6,
  });
}

/**
 * Fetch source content by ID
 */
export async function getSourceById(sourceId: number): Promise<{
  success: boolean;
  source?: { content_text: string; created_at: string };
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('source_content_ingested')
      .select('content_text, created_at')
      .eq('id', sourceId)
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
        error: 'Source not found.',
      };
    }

    return {
      success: true,
      source: {
        content_text: (data.content_text as string) ?? '',
        created_at: (data.created_at as string) ?? new Date().toISOString(),
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
 * Check if source has been used for Captain Heart generation
 */
export async function isSourceUsedForCaptainHeart(sourceId: number): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Check collection_hockey_motivate table - only check for Captain Heart items
    const { data, error } = await supabase
      .from('collection_hockey_motivate')
      .select('id')
      .eq('source_content_id', sourceId)
      .eq('attribution', 'Captain Heart') // Only check Captain Heart messages
      .limit(1)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking source usage:', error);
      return false; // Fail open - allow generation if check fails
    }

    return !!data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking source usage:', error);
    return false; // Fail open
  }
}

/**
 * Mark source as used for Captain Heart generation
 */
async function markSourceAsUsedForCaptainHeart(sourceId: number): Promise<void> {
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

    // Add 'motivational' if not already present
    if (!currentUsedFor.includes('motivational')) {
      const updatedUsedFor = [...currentUsedFor, 'motivational'];
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
 * Normalize motivational item for collection_hockey_motivate table
 */
function normalizeCaptainHeartItem(
  item: Record<string, unknown>,
  sourceId: number,
): {
  quote: string;
  category: string | null;
  theme: string | null;
  attribution: string | null;
  status: string;
  source_content_id: number;
} | null {
  // Captain Heart prompt uses "content_body", map to quote field
  const quote =
    coerceString(item.content_body) ??
    coerceString(item.message) ??
    coerceString(item.quote) ??
    coerceString(item.content_text) ??
    coerceString(item.text) ??
    null;

  if (!quote) {
    return null;
  }

  // Captain Heart prompt uses "category_tag", map to category field
  const category = coerceString(item.category_tag) ?? coerceString(item.category) ?? null;

  // Captain Heart prompt uses "moment_type", map to theme field
  const theme = coerceString(item.moment_type) ?? coerceString(item.theme) ?? null;

  // Captain Heart prompt uses "character_voice" or "attribution" field
  // If not set, default to "Captain Heart" since this is the Captain Heart generator
  const attribution =
    coerceString(item.character_voice) ??
    coerceString(item.attribution) ??
    coerceString(item.author) ??
    'Captain Heart'; // Default to Captain Heart if not specified

  return {
    quote,
    category,
    theme,
    attribution,
    status: 'draft',
    source_content_id: sourceId,
  };
}

function coerceString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

/**
 * Analyze source content for extraction potential
 */
export async function analyzeSourceContent(sourceId: number): Promise<{
  success: boolean;
  analysis?: ContentAnalysis;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('source_content_ingested')
      .select('content_text')
      .eq('id', sourceId)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        error: 'Failed to fetch source content.',
      };
    }

    const content = (data.content_text as string) ?? '';
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const averageSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // Simple heuristic for motivational indicators
    const motivationalKeywords = [
      'win',
      'lose',
      'team',
      'player',
      'game',
      'champion',
      'victory',
      'defeat',
      'effort',
      'hard work',
      'dedication',
      'passion',
      'pride',
      'respect',
      'honor',
    ];
    const lowerContent = content.toLowerCase();
    const wisdomIndicators = motivationalKeywords.filter((keyword) =>
      lowerContent.includes(keyword),
    ).length;

    // Calculate extraction score (0-100)
    let extractionScore = 0;
    if (wordCount >= 200 && wordCount <= 2000) extractionScore += 30;
    if (sentenceCount >= 5 && sentenceCount <= 50) extractionScore += 20;
    if (averageSentenceLength >= 10 && averageSentenceLength <= 25) extractionScore += 20;
    if (wisdomIndicators >= 3) extractionScore += 30;

    let assessment: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (extractionScore >= 80) assessment = 'excellent';
    else if (extractionScore >= 60) assessment = 'good';
    else if (extractionScore >= 40) assessment = 'fair';

    const insights: string[] = [];
    if (wordCount < 200) insights.push('Content is quite short - may have limited extraction potential');
    if (wordCount > 2000) insights.push('Content is very long - may need to focus on key sections');
    if (wisdomIndicators >= 5) insights.push('Strong motivational language detected');
    if (averageSentenceLength > 25) insights.push('Sentences are quite long - may need simplification');

    return {
      success: true,
      analysis: {
        wordCount,
        sentenceCount,
        quoteCount: 0, // Not applicable for Captain Heart messages
        wisdomIndicators,
        averageSentenceLength,
        extractionScore,
        assessment,
        insights: insights.length > 0 ? insights : ['Content looks suitable for extraction'],
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Analysis failed: ${message}`,
    };
  }
}

/**
 * Get generated items for a source
 */
export async function getGeneratedCaptainHeartItems(sourceId: number): Promise<{
  success: boolean;
  items?: GeneratedMotivateItem[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('collection_hockey_motivate')
      .select('id, quote, category, theme, attribution, created_at')
      .eq('source_content_id', sourceId)
      .eq('attribution', 'Captain Heart') // Only show Captain Heart messages
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: `Failed to fetch items: ${error.message}`,
      };
    }

    const items: GeneratedMotivateItem[] = (data || []).map((row) => ({
      id: row.id as number,
      quote: row.quote as string,
      category: (row.category as string | null) ?? null,
      theme: (row.theme as string | null) ?? null,
      attribution: (row.attribution as string | null) ?? null,
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
 * Generate Captain Heart content and save to collection_hockey_motivate table
 */
export async function generateCaptainHeartAction(sourceId: number): Promise<GenerationResult> {
  try {
    // Check if source has already been used
    const alreadyUsed = await isSourceUsedForCaptainHeart(sourceId);
    if (alreadyUsed) {
      return {
        success: false,
        message: 'This source has already been used for Captain Heart generation. To avoid duplicates, select a different source.',
      };
    }

    // Fetch Captain Heart prompt
    const promptResult = await getCaptainHeartPrompt();
    if (!promptResult.success || !promptResult.prompt) {
      return {
        success: false,
        message: promptResult.error || 'Failed to load Captain Heart prompt.',
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
    const geminiResult = await generateMotivateContent({
      sourceContent: source.content_text,
      customPrompt: prompt.prompt_content,
      articleDate: source.created_at,
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
        message: 'Gemini did not generate any items. The source content may not be suitable for Captain Heart message extraction, or the prompt may need adjustment.',
      };
    }

    // Normalize items
    const normalizedItems = geminiResult.data
      .map((item) => normalizeCaptainHeartItem(item, sourceId))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (normalizedItems.length === 0) {
      return {
        success: false,
        message: 'All generated items failed validation. Required: content_body (or message, quote, content_text, text).',
      };
    }

    // Save to database
    const supabase = await createServerClient();
    const { data: insertedData, error } = await supabase
      .from('collection_hockey_motivate')
      .insert(normalizedItems)
      .select('id, quote, category, theme, attribution, created_at');

    if (error) {
      return {
        success: false,
        message: `Failed to save generated content: ${error.message}`,
      };
    }

    const generatedItems: GeneratedMotivateItem[] = (insertedData || []).map((row) => ({
      id: row.id as number,
      quote: row.quote as string,
      category: (row.category as string | null) ?? null,
      theme: (row.theme as string | null) ?? null,
      attribution: (row.attribution as string | null) ?? null,
      created_at: row.created_at as string,
    }));

    // Mark source as used for Captain Heart generation
    await markSourceAsUsedForCaptainHeart(sourceId);

    return {
      success: true,
      message: `✅ Successfully generated and saved ${normalizedItems.length} Captain Heart message(s)!`,
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

