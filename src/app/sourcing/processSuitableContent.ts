'use server';

import { generateContentAction } from '@/app/main-generator/actions';
import type { GeneratorTrackKey } from '@/lib/generator/types';
import type { ContentSuitabilityAnalysis } from '@/lib/sourcing/validators';
import { createServerClient } from '@/utils/supabase/server';

/**
 * Mapping from suitability analysis keys to generator track keys
 */
const SUITABILITY_TO_TRACK_KEY: Record<string, GeneratorTrackKey> = {
  multiple_choice_trivia: 'trivia_multiple_choice',
  true_false_trivia: 'trivia_true_false',
  who_am_i_trivia: 'trivia_who_am_i',
  motivational: 'motivational',
  facts: 'facts',
  wisdom: 'wisdom',
};

/**
 * Mapping from track keys to usage keys for tracking
 */
const TRACK_KEY_TO_USAGE_KEY: Record<GeneratorTrackKey, string> = {
  trivia_multiple_choice: 'multiple-choice',
  trivia_true_false: 'true-false',
  trivia_who_am_i: 'who-am-i',
  motivational: 'motivational',
  facts: 'fact',
  wisdom: 'wisdom',
};

export interface ProcessSuitableContentResult {
  success: boolean;
  sourceId: number;
  processed: Array<{
    contentType: string;
    trackKey: GeneratorTrackKey;
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
 * Process a source for all suitable content types based on suitability_analysis
 * Only processes content types where suitable === true AND confidence >= 0.7
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

  // First, track all skipped types (for reporting)
  for (const [suitabilityKey, analysis] of Object.entries(suitabilityAnalysis)) {
    if (!analysis) {
      skipped.push({
        contentType: suitabilityKey,
        reason: 'Analysis data is missing',
      });
      continue;
    }

    // Track types that don't meet threshold
    if (!analysis.suitable || analysis.confidence < minConfidence) {
      skipped.push({
        contentType: suitabilityKey,
        reason: analysis.suitable
          ? `Confidence ${(analysis.confidence * 100).toFixed(0)}% is below threshold ${(minConfidence * 100).toFixed(0)}%`
          : 'Not suitable for this content type',
      });
    }
  }

  // Filter to only suitable types that meet threshold for processing
  const suitableTypes = Object.entries(suitabilityAnalysis).filter(
    ([, analysis]) => analysis && analysis.suitable && analysis.confidence >= minConfidence
  );

  // Process each content type that is suitable (with rate limiting)
  for (let i = 0; i < suitableTypes.length; i++) {
    const [suitabilityKey, analysis] = suitableTypes[i];

    // Map suitability key to track key
    const trackKey = SUITABILITY_TO_TRACK_KEY[suitabilityKey];
    if (!trackKey) {
      skipped.push({
        contentType: suitabilityKey,
        reason: `No track key mapping found for ${suitabilityKey}`,
      });
      continue;
    }

    // Generate content for this content type
    try {
      const result = await generateContentAction({
        trackKey,
        sourceId,
      });

      if (result.success) {
        // Update used_for tracking
        const usageKey = TRACK_KEY_TO_USAGE_KEY[trackKey];
        await updateSourceUsageInDb(sourceId, usageKey);

        processed.push({
          contentType: suitabilityKey,
          trackKey,
          success: true,
          message: result.message || 'Content generated successfully',
          itemCount: result.itemCount,
        });
      } else {
        processed.push({
          contentType: suitabilityKey,
          trackKey,
          success: false,
          message: result.message || 'Generation failed',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      processed.push({
        contentType: suitabilityKey,
        trackKey,
        success: false,
        message: `Error: ${errorMessage}`,
      });
    }

    // Rate limiting: wait 2 seconds before processing next content type (except after the last one)
    if (i < suitableTypes.length - 1) {
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

/**
 * Update used_for tracking for a source
 */
async function updateSourceUsageInDb(sourceId: number, usageKey: string): Promise<void> {
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

  // Add usage key if not already present
  if (!currentUsedFor.includes(usageKey)) {
    const updatedUsedFor = [...currentUsedFor, usageKey];
    await supabase
      .from('source_content_ingested')
      .update({ used_for: updatedUsedFor })
      .eq('id', sourceId);
  }
}

