'use server';

import { createServerClient } from '@/utils/supabase/server';
import { randomUUID } from 'crypto';
import { processText } from '@/lib/text-processing';
import { getActivePromptByType } from '@/lib/prompts/repository';
import { extractMetadata, enrichContent, analyzeContentSuitability } from '@/lib/sourcing/adapters';
import type { ContentSuitabilityAnalysis } from '@/lib/sourcing/validators';

export interface IngestState {
  ok: boolean;
  error?: string;
  recordId?: number;
  // Extracted metadata for logging/feedback
  metadata?: {
    theme: string;
    category: string | null;
    title: string;
    tags: string[];
    summary: string;
    wordCount: number;
    charCount: number;
    keyPhrases?: string[];
    suitabilityAnalysis?: ContentSuitabilityAnalysis;
  };
}

const MAX_INPUT_CHARS = 50000;

interface PipelineInput {
  raw: string;
  titleOverride?: string;
}

async function runIngestionPipeline({ raw, titleOverride }: PipelineInput): Promise<IngestState> {
  try {
    if (!raw) {
      return { ok: false, error: 'Please paste or type source content.' };
    }
    if (raw.length > MAX_INPUT_CHARS) {
      return {
        ok: false,
        error: `Input is too long (${raw.length} chars). Limit is ${MAX_INPUT_CHARS}.`,
      };
    }

    // Deterministic normalization (server-authoritative)
    const processed = await processText(raw);
    const processedText = processed.processedText;

    // Load active prompts from DB
    const extractionPrompt = await getActivePromptByType('metadata_extraction');
    const enrichmentPrompt = await getActivePromptByType('content_enrichment');
    if (!extractionPrompt || !enrichmentPrompt) {
      return {
        ok: false,
        error: 'Active AI prompts are not configured. Please add prompts in the Prompts Library.',
      };
    }

    // Run AI steps
    const meta = await extractMetadata(processedText, extractionPrompt.prompt_content);
    if (!meta.success) {
      return { ok: false, error: meta.error };
    }
    const enr = await enrichContent(processedText, enrichmentPrompt.prompt_content, {
      titleOverride: titleOverride || undefined,
    });
    if (!enr.success) {
      return { ok: false, error: enr.error };
    }

    // Run content suitability analysis (non-blocking - if it fails, ingestion still succeeds)
    let suitabilityAnalysis: ContentSuitabilityAnalysis | undefined;
    try {
      const analysisPrompt = await getActivePromptByType('content_suitability_analysis');
      if (analysisPrompt) {
        const analysis = await analyzeContentSuitability(processedText, analysisPrompt.prompt_content);
        if (analysis.success) {
          suitabilityAnalysis = analysis.data;
          // eslint-disable-next-line no-console
          console.log('Content suitability analysis completed successfully:', Object.keys(suitabilityAnalysis));
        } else {
          // eslint-disable-next-line no-console
          console.warn('Content suitability analysis returned unsuccessful:', analysis.error);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('No content suitability analysis prompt found - skipping analysis');
      }
    } catch (analysisError) {
      // Log but don't fail ingestion
      // eslint-disable-next-line no-console
      console.warn('Content suitability analysis failed:', analysisError);
    }

    const supabase = await createServerClient();
    const ingestion_process_id = randomUUID();

    // Build metadata object (without suitability_analysis - it goes in its own column)
    const metadataObj: Record<string, unknown> = {
      key_phrases: enr.data.key_phrases,
    };

    // Build insert payload with suitability_analysis as a separate column
    const insertPayload: Record<string, unknown> = {
      content_text: processedText,
      word_count: processed.wordCount,
      char_count: processed.charCount,
      theme: meta.data.theme,
      tags: meta.data.tags,
      category: meta.data.category,
      summary: meta.data.summary,
      title: enr.data.title,
      key_phrases: enr.data.key_phrases,
      metadata: metadataObj,
      ingestion_process_id,
      ingestion_status: 'complete',
    };

    // Add suitability_analysis to the insert payload if it exists
    if (suitabilityAnalysis && Object.keys(suitabilityAnalysis).length > 0) {
      insertPayload.suitability_analysis = suitabilityAnalysis;
      // eslint-disable-next-line no-console
      console.log('Including suitability analysis in insert payload. Content types:', Object.keys(suitabilityAnalysis));
      // eslint-disable-next-line no-console
      console.log('Full analysis data:', JSON.stringify(suitabilityAnalysis, null, 2));
    } else {
      // eslint-disable-next-line no-console
      console.warn('No suitability analysis to save - analysis was not completed or is empty');
      // eslint-disable-next-line no-console
      console.warn('suitabilityAnalysis value:', suitabilityAnalysis);
    }

    // eslint-disable-next-line no-console
    console.log('Inserting payload with suitability_analysis:', insertPayload.suitability_analysis ? 'YES' : 'NO');

    const { data, error } = await supabase
      .from('source_content_ingested')
      .insert(insertPayload)
      .select('id, metadata, suitability_analysis')
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Database insert error:', error);
      return { ok: false, error: error.message || 'Failed to save ingested content.' };
    }

    // Verify what was actually saved
    const savedSuitabilityAnalysis = data?.suitability_analysis as ContentSuitabilityAnalysis | null;
    if (suitabilityAnalysis && Object.keys(suitabilityAnalysis).length > 0) {
      if (savedSuitabilityAnalysis) {
        // eslint-disable-next-line no-console
        console.log('✅ Suitability analysis WAS saved to database column');
        // eslint-disable-next-line no-console
        console.log('Saved analysis content types:', Object.keys(savedSuitabilityAnalysis));
      } else {
        // eslint-disable-next-line no-console
        console.error('❌ Suitability analysis was NOT saved to database column, even though it was included in insertPayload');
        // eslint-disable-next-line no-console
        console.error('Expected analysis:', JSON.stringify(suitabilityAnalysis, null, 2));
        // eslint-disable-next-line no-console
        console.error('Actual saved analysis:', savedSuitabilityAnalysis);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('No suitability analysis to verify (analysis was not completed or is empty)');
    }

    return {
      ok: true,
      recordId: data?.id as number,
      metadata: {
        theme: meta.data.theme,
        category: meta.data.category,
        title: enr.data.title,
        tags: meta.data.tags,
        summary: meta.data.summary,
        wordCount: processed.wordCount,
        charCount: processed.charCount,
        keyPhrases: enr.data.key_phrases,
        suitabilityAnalysis,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

export async function ingestSourceContentAction(
  _prevState: IngestState,
  formData: FormData,
): Promise<IngestState> {
  const raw = String(formData.get('content') || '').trim();
  const titleOverride = String(formData.get('title') || '').trim();
  return runIngestionPipeline({ raw, titleOverride });
}

export async function autoIngestClipboardAction(input: {
  content: string;
  title?: string | null;
}): Promise<IngestState> {
  const raw = (input.content || '').trim();
  const titleOverride = (input.title || '').trim();
  return runIngestionPipeline({ raw, titleOverride });
}
