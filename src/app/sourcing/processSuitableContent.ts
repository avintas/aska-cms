'use server';

import { generateContentAction } from '@/app/main-generator/actions';
import type { ContentSuitabilityAnalysis } from '@/lib/sourcing/validators';
import { createServerClient } from '@/utils/supabase/server';

/**
 * Content types that can be generated from suitability analysis.
 * These keys match both suitability analysis AND generator track keys:
 *   - trivia_multiple_choice  → trivia_multiple_choice table
 *   - trivia_true_false       → trivia_true_false table
 *   - trivia_who_am_i         → trivia_who_am_i table
 *   - motivational            → collection_hockey_motivate table
 *   - facts                   → collection_hockey_facts table
 *   - wisdom                  → collection_hockey_wisdom table
 */
const SUPPORTED_CONTENT_TYPES = [
  'trivia_multiple_choice',
  'trivia_true_false',
  'trivia_who_am_i',
  'motivational',
  'facts',
  'wisdom',
] as const;

type SupportedContentType = (typeof SUPPORTED_CONTENT_TYPES)[number];

export interface ProcessSuitableContentResult {
  success: boolean;
  sourceId: number;
  processed: Array<{
    contentType: string;
    success: boolean;
    message: string;
    itemCount?: number;
  }>;
  skipped: Array<{
    contentType: string;
    reason: string;
  }>;
  totalProcessed: number;
  totalSkipped: number;
}

/**
 * Process a source for all suitable content types based on suitability_analysis.
 * Only processes content types where suitable === true AND confidence >= threshold.
 */
export async function processSourceForAllSuitableTypes(
  sourceId: number,
  minConfidence: number = 0.7,
): Promise<ProcessSuitableContentResult> {
  const supabase = await createServerClient();

  // Fetch the source with suitability_analysis
  const { data: source, error: fetchError } = await supabase
    .from('source_content_ingested')
    .select('id, suitability_analysis, content_status')
    .eq('id', sourceId)
    .single();

  if (fetchError || !source) {
    return {
      success: false,
      sourceId,
      processed: [],
      skipped: [{ contentType: 'all', reason: `Failed to fetch source: ${fetchError?.message || 'Source not found'}` }],
      totalProcessed: 0,
      totalSkipped: 1,
    };
  }

  if (source.content_status !== 'active') {
    return {
      success: false,
      sourceId,
      processed: [],
      skipped: [{ contentType: 'all', reason: `Source is not active (status: ${source.content_status})` }],
      totalProcessed: 0,
      totalSkipped: 1,
    };
  }

  const suitabilityAnalysis = source.suitability_analysis as ContentSuitabilityAnalysis | null;

  if (!suitabilityAnalysis || Object.keys(suitabilityAnalysis).length === 0) {
    return {
      success: false,
      sourceId,
      processed: [],
      skipped: [{ contentType: 'all', reason: 'No suitability analysis found for this source' }],
      totalProcessed: 0,
      totalSkipped: 1,
    };
  }

  const processed: ProcessSuitableContentResult['processed'] = [];
  const skipped: ProcessSuitableContentResult['skipped'] = [];

  // Check each supported content type
  for (const contentType of SUPPORTED_CONTENT_TYPES) {
    const analysis = suitabilityAnalysis[contentType];

    if (!analysis) {
      skipped.push({
        contentType,
        reason: 'No analysis data',
      });
      continue;
    }

    if (!analysis.suitable) {
      skipped.push({
        contentType,
        reason: 'Not suitable for this content type',
      });
      continue;
    }

    if (analysis.confidence < minConfidence) {
      skipped.push({
        contentType,
        reason: `Confidence ${(analysis.confidence * 100).toFixed(0)}% is below threshold ${(minConfidence * 100).toFixed(0)}%`,
      });
      continue;
    }

    // Generate content - contentType is already the track key
    try {
      const result = await generateContentAction({
        trackKey: contentType,
        sourceId,
      });

      processed.push({
        contentType,
        success: result.success,
        message: result.message || (result.success ? 'Content generated successfully' : 'Generation failed'),
        itemCount: result.itemCount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      processed.push({
        contentType,
        success: false,
        message: `Error: ${errorMessage}`,
      });
    }

    // Rate limiting: wait 2 seconds before processing next content type
    if (processed.length < SUPPORTED_CONTENT_TYPES.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return {
    success: processed.some((p) => p.success),
    sourceId,
    processed,
    skipped,
    totalProcessed: processed.length,
    totalSkipped: skipped.length,
  };
}
