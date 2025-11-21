'use server';

import { createServerClient } from '@/utils/supabase/server';
import { randomUUID } from 'crypto';
import { processText } from '@/lib/text-processing';
import { getActivePromptByType } from '@/lib/prompts/repository';
import { extractMetadata, enrichContent } from '@/lib/sourcing/adapters';

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
  };
}

const MAX_INPUT_CHARS = 24000;

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

    const supabase = await createServerClient();
    const ingestion_process_id = randomUUID();

    const insertPayload = {
      content_text: processedText,
      word_count: processed.wordCount,
      char_count: processed.charCount,
      theme: meta.data.theme,
      tags: meta.data.tags,
      category: meta.data.category,
      summary: meta.data.summary,
      title: enr.data.title,
      key_phrases: enr.data.key_phrases,
      metadata: { key_phrases: enr.data.key_phrases },
      ingestion_process_id,
      ingestion_status: 'complete',
    };

    const { data, error } = await supabase
      .from('source_content_ingested')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      return { ok: false, error: error.message || 'Failed to save ingested content.' };
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
