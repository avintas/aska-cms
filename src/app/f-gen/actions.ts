'use server';

import { createServerClient } from '@/utils/supabase/server';
import { generateFactsContent } from '@/lib/gemini/generators/facts';

export interface FactsPrompt {
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
  generatedItems?: GeneratedFactItem[];
}

export interface GeneratedFactItem {
  id: number;
  text: string;
  category: string | null;
  theme: string | null;
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
 * Fetch the facts prompt from collection_prompts table
 */
export async function getFactsPrompt(): Promise<{
  success: boolean;
  prompt?: FactsPrompt;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collection_prompts')
      .select('id, prompt_name, prompt_content, content_type')
      .eq('content_type', 'fact')
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
        error: 'No facts prompt found in collection_prompts table.',
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
 * Get sources that haven't been used for F-Gen facts generation yet
 */
export async function getAvailableSourcesForFacts(): Promise<{
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

    // FAIL-SAFE: Get sources that have been processed for facts
    // Use same approach as badging system - check collection tables directly
    // Check both fact tables (collection_facts and collection_hockey_facts)
    const factTables = ['collection_hockey_facts', 'collection_facts'];
    const processedSourceIds = new Set<number>();

    await Promise.all(
      factTables.map(async (table) => {
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

      // PRIMARY FAIL-SAFE: Skip if already has facts items in collection table
      // This is the most reliable check - if items exist, source was definitely used
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // SECONDARY FAIL-SAFE: Check used_for array as backup
      // This catches cases where marking might have failed but items don't exist yet
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('fact') || usedFor.includes('f-gen')) {
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
 * Fetch sources from source_content_ingested table
 */
export async function getSources(): Promise<{
  success: boolean;
  sources?: SourceItem[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('source_content_ingested')
      .select('id, title, summary, theme')
      .eq('content_status', 'active')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch sources: ${error.message}`,
      };
    }

    const sources: SourceItem[] = (data || []).map((row) => ({
      id: row.id as number,
      title: (row.title as string | null) ?? null,
      summary: (row.summary as string | null) ?? null,
      theme: (row.theme as string | null) ?? null,
    }));

    return {
      success: true,
      sources,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Error fetching sources: ${message}`,
    };
  }
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
    created_at: string | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('source_content_ingested')
      .select('id, title, summary, content_text, created_at')
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
        created_at: (data.created_at as string | null) ?? null,
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
 * Normalize fact item for collection_hockey_facts table
 * More flexible than before to handle variations in Gemini output
 */
function normalizeFactItem(
  item: Record<string, unknown>,
  sourceId: number,
): {
  text: string;
  category: string | null;
  theme: string | null;
  status: string;
  source_content_id: number;
} | null {
  // Try multiple field name variations for text
  const text =
    coerceString(item.text) ??
    coerceString(item.fact_text) ??
    coerceString(item.content_text) ??
    coerceString(item.fact) ??
    coerceString(item.statement) ??
    coerceString(item.summary) ??
    null;

  // Validate required field
  if (!text) {
    return null;
  }

  // Category and theme are optional
  const category = coerceString(item.category) ?? coerceString(item.fact_category) ?? null;
  const theme = coerceString(item.theme) ?? null;

  return {
    text,
    category,
    theme,
    status: 'draft',
    source_content_id: sourceId,
  };
}

/**
 * Analyze source content for fact extraction potential
 * Uses same scoring logic as wisdom extraction
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

    // Count numbers/statistics (look for numeric patterns)
    const numberPattern = /\b\d{1,4}\b/g; // Match 1-4 digit numbers (years, stats, etc.)
    const numbers = (content.match(numberPattern) || []).length;
    
    // Count years (4-digit numbers that could be years)
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years = (content.match(yearPattern) || []).length;

    // Fact indicator keywords/phrases
    const factKeywords = [
      'record',
      'achievement',
      'statistic',
      'statistics',
      'data',
      'figure',
      'total',
      'scored',
      'won',
      'season',
      'career',
      'game',
      'games',
      'goal',
      'goals',
      'assist',
      'assists',
      'point',
      'points',
      'team',
      'player',
      'players',
      'league',
      'nhl',
      'first',
      'second',
      'third',
      'championship',
      'playoff',
      'playoffs',
      'award',
      'awards',
      'trophy',
      'milestone',
      'number',
      'ranked',
      'rank',
      'history',
      'historical',
      'became',
      'reached',
      'set',
      'established',
    ];

    const factIndicators = factKeywords.filter((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase()),
    ).length;

    const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

    // Calculate extraction score (0-100) - optimized for facts
    let score = 0;
    const insights: string[] = [];

    // Word count score (optimal: 200-1000 words)
    if (words.length >= 200 && words.length <= 1000) {
      score += 20;
      insights.push(`✅ Good content length (${words.length} words)`);
    } else if (words.length < 200) {
      score += 8;
      insights.push(`⚠️ Content is short (${words.length} words) - may have limited facts`);
    } else {
      score += 18;
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

    // Numbers/statistics score (very important for facts)
    if (numbers >= 10) {
      score += 30;
      insights.push(`🔢 Rich in numbers (${numbers} numeric values) - excellent fact potential`);
    } else if (numbers >= 5) {
      score += 20;
      insights.push(`🔢 Contains numbers (${numbers} numeric values) - good fact potential`);
    } else if (numbers >= 2) {
      score += 10;
      insights.push(`🔢 Some numbers found (${numbers} numeric values) - moderate fact potential`);
    } else {
      score += 2;
      insights.push(`📝 Limited numeric data - may need to extract qualitative facts`);
    }

    // Years score (dates/years are important for facts)
    if (years >= 3) {
      score += 15;
      insights.push(`📅 Contains multiple years (${years} found) - good historical context`);
    } else if (years >= 1) {
      score += 8;
      insights.push(`📅 Contains year reference (${years} found) - some temporal context`);
    } else {
      score += 2;
      insights.push(`📅 No year references found - facts may lack temporal context`);
    }

    // Fact indicators score
    if (factIndicators >= 8) {
      score += 15;
      insights.push(`✨ Strong fact language detected (${factIndicators} indicators)`);
    } else if (factIndicators >= 4) {
      score += 10;
      insights.push(`💡 Some fact language found (${factIndicators} indicators)`);
    } else if (factIndicators >= 2) {
      score += 5;
      insights.push(`📄 Limited fact language (${factIndicators} indicators)`);
    } else {
      score += 2;
      insights.push(`📄 Minimal fact language - may require more interpretation`);
    }

    // Sentence length score (optimal: 10-25 words per sentence)
    if (averageSentenceLength >= 10 && averageSentenceLength <= 25) {
      score += 5;
      insights.push(`✅ Good sentence structure (avg ${averageSentenceLength.toFixed(1)} words)`);
    } else {
      score += 3;
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
        quoteCount: 0, // Not relevant for facts, kept for interface compatibility
        wisdomIndicators: factIndicators, // Reusing field name but storing fact indicators
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
 * Fetch generated fact items for a source
 */
export async function getGeneratedFactItems(sourceId: number): Promise<{
  success: boolean;
  items?: GeneratedFactItem[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collection_hockey_facts')
      .select('id, text, category, theme, created_at')
      .eq('source_content_id', sourceId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch generated items: ${error.message}`,
      };
    }

    const items: GeneratedFactItem[] = (data || []).map((row) => ({
      id: row.id as number,
      text: row.text as string,
      category: (row.category as string | null) ?? null,
      theme: (row.theme as string | null) ?? null,
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

      // Count numbers/statistics
      const numberPattern = /\b\d{1,4}\b/g;
      const numbers = (content.match(numberPattern) || []).length;
      
      // Count years
      const yearPattern = /\b(19|20)\d{2}\b/g;
      const years = (content.match(yearPattern) || []).length;

      const factKeywords = [
        'record',
        'achievement',
        'statistic',
        'statistics',
        'data',
        'figure',
        'total',
        'scored',
        'won',
        'season',
        'career',
        'game',
        'games',
        'goal',
        'goals',
        'assist',
        'assists',
        'point',
        'points',
        'team',
        'player',
        'players',
        'league',
        'nhl',
        'first',
        'second',
        'third',
        'championship',
        'playoff',
        'playoffs',
        'award',
        'awards',
        'trophy',
        'milestone',
        'number',
        'ranked',
        'rank',
        'history',
        'historical',
        'became',
        'reached',
        'set',
        'established',
      ];

      const factIndicators = factKeywords.filter((keyword) =>
        content.toLowerCase().includes(keyword.toLowerCase()),
      ).length;

      const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

      // Calculate extraction score - optimized for facts
      let score = 0;

      if (words.length >= 200 && words.length <= 1000) {
        score += 20;
      } else if (words.length < 200) {
        score += 8;
      } else {
        score += 18;
      }

      if (sentences.length >= 10 && sentences.length <= 50) {
        score += 20;
      } else if (sentences.length < 10) {
        score += 5;
      } else {
        score += 15;
      }

      // Numbers/statistics score
      if (numbers >= 10) {
        score += 30;
      } else if (numbers >= 5) {
        score += 20;
      } else if (numbers >= 2) {
        score += 10;
      } else {
        score += 2;
      }

      // Years score
      if (years >= 3) {
        score += 15;
      } else if (years >= 1) {
        score += 8;
      } else {
        score += 2;
      }

      // Fact indicators score
      if (factIndicators >= 8) {
        score += 15;
      } else if (factIndicators >= 4) {
        score += 10;
      } else if (factIndicators >= 2) {
        score += 5;
      } else {
        score += 2;
      }

      if (averageSentenceLength >= 10 && averageSentenceLength <= 25) {
        score += 5;
      } else {
        score += 3;
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
          quoteCount: 0, // Not relevant for facts
          wisdomIndicators: factIndicators, // Reusing field name but storing fact indicators
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
 * Check if a source has already been used for F-Gen facts generation
 */
export async function isSourceUsedForFacts(sourceId: number): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Check if any fact items exist for this source
    const { data: existingItems } = await supabase
      .from('collection_hockey_facts')
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
      if (usedFor.includes('fact') || usedFor.includes('f-gen')) {
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
 * Mark a source as used for F-Gen facts generation
 */
async function markSourceAsUsedForFacts(sourceId: number): Promise<void> {
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

    // Add 'fact' if not already present
    if (!currentUsedFor.includes('fact')) {
      const updatedUsedFor = [...currentUsedFor, 'fact'];
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
 * Generate facts content and save to collection_hockey_facts table
 */
export async function generateFactsAction(sourceId: number): Promise<GenerationResult> {
  try {
    // Check if source has already been used
    const alreadyUsed = await isSourceUsedForFacts(sourceId);
    if (alreadyUsed) {
      return {
        success: false,
        message: 'This source has already been used for facts generation. To avoid duplicates, select a different source.',
      };
    }

    // Fetch prompt
    const promptResult = await getFactsPrompt();
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
    const geminiResult = await generateFactsContent({
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
        message: 'Gemini did not generate any items. The source content may not be suitable for fact extraction, or the prompt may need adjustment.',
      };
    }

    // Debug: Log what Gemini actually returned
    // eslint-disable-next-line no-console
    console.log('Gemini returned items:', JSON.stringify(geminiResult.data, null, 2));

    // Normalize items
    const normalizedItems = geminiResult.data
      .map((item, index) => {
        const normalized = normalizeFactItem(item, sourceId);
        if (!normalized) {
          // eslint-disable-next-line no-console
          console.error(`Item ${index} failed normalization:`, {
            item,
            hasText: !!(item.text || item.fact_text || item.content_text),
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
        message: `All ${geminiResult.data.length} generated item(s) failed validation. Sample item keys: ${sampleKeys}. Required: text (or fact_text, content_text). Check console for details.`,
      };
    }

    // Save to database
    const supabase = await createServerClient();
    const { data: insertedData, error } = await supabase
      .from('collection_hockey_facts')
      .insert(normalizedItems)
      .select('id, text, category, theme, created_at');

    if (error) {
      return {
        success: false,
        message: `Failed to save generated content: ${error.message}`,
      };
    }

    const generatedItems: GeneratedFactItem[] = (insertedData || []).map((row) => ({
      id: row.id as number,
      text: row.text as string,
      category: (row.category as string | null) ?? null,
      theme: (row.theme as string | null) ?? null,
      created_at: row.created_at as string,
    }));

    // Mark source as used for facts generation
    await markSourceAsUsedForFacts(sourceId);

    return {
      success: true,
      message: `✅ Successfully generated and saved ${normalizedItems.length} fact(s)!`,
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

