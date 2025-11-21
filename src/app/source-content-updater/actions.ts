'use server';

import { createServerClient } from '@/utils/supabase/server';
import { getActivePromptByType } from '@/lib/prompts/repository';
import { extractMetadata } from '@/lib/sourcing/adapters';
import { processText } from '@/lib/text-processing';
import type { ExtractedMetadata } from '@/lib/sourcing/validators';

export interface SourceContentStats {
  total: number;
  remaining: number;
  processed: number;
}

export interface SourceContentItem {
  id: number;
  title: string | null;
  summary: string | null;
  theme: string | null;
  category: string | null;
  tags: string[];
  content_text: string;
  metadata_refreshed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegenerateMetadataResult {
  success: boolean;
  error?: string;
  metadata?: ExtractedMetadata;
}

export interface SaveMetadataResult {
  success: boolean;
  error?: string;
}

/**
 * Get statistics about source content refresh status
 */
export async function getStatsAction(): Promise<{
  success: boolean;
  data?: SourceContentStats;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { count: total, error: totalError } = await supabase
      .from('source_content_ingested')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return { success: false, error: `Failed to fetch total count: ${totalError.message}` };
    }

    const { count: remaining, error: remainingError } = await supabase
      .from('source_content_ingested')
      .select('*', { count: 'exact', head: true })
      .is('metadata_refreshed_at', null);

    if (remainingError) {
      return { success: false, error: `Failed to fetch remaining count: ${remainingError.message}` };
    }

    return {
      success: true,
      data: {
        total: total ?? 0,
        remaining: remaining ?? 0,
        processed: (total ?? 0) - (remaining ?? 0),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Fetch the next source that needs metadata refresh
 */
export async function fetchNextSourceAction(): Promise<{
  success: boolean;
  data?: SourceContentItem;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('source_content_ingested')
      .select('id, title, summary, theme, category, tags, content_text, metadata_refreshed_at, created_at, updated_at')
      .is('metadata_refreshed_at', null)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { success: false, error: `Failed to fetch source: ${error.message}` };
    }

    if (!data) {
      return { success: true, data: undefined }; // No more sources to process
    }

    // Coerce tags array
    const tags = Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : [];

    return {
      success: true,
      data: {
        id: data.id,
        title: data.title ?? null,
        summary: data.summary ?? null,
        theme: data.theme ?? null,
        category: data.category ?? null,
        tags,
        content_text: data.content_text ?? '',
        metadata_refreshed_at: data.metadata_refreshed_at ?? null,
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? '',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Regenerate metadata for a source using Gemini
 */
export async function regenerateMetadataAction(sourceId: number): Promise<RegenerateMetadataResult> {
  try {
    const supabase = await createServerClient();

    // Fetch the source
    const { data: source, error: fetchError } = await supabase
      .from('source_content_ingested')
      .select('content_text')
      .eq('id', sourceId)
      .maybeSingle();

    if (fetchError || !source) {
      return { success: false, error: 'Source not found' };
    }

    const contentText = source.content_text;
    if (!contentText) {
      return { success: false, error: 'Source has no content text' };
    }

    // Process text (normalize)
    const processed = await processText(contentText);

    // Get active prompt
    const extractionPrompt = await getActivePromptByType('metadata_extraction');
    if (!extractionPrompt) {
      return {
        success: false,
        error: 'Active metadata extraction prompt not found. Please configure prompts in the Prompts Library.',
      };
    }

    // Extract metadata using Gemini
    const result = await extractMetadata(processed.processedText, extractionPrompt.prompt_content);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      metadata: result.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Save regenerated metadata to the source
 */
export async function saveMetadataAction(
  sourceId: number,
  metadata: ExtractedMetadata,
): Promise<SaveMetadataResult> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('source_content_ingested')
      .update({
        theme: metadata.theme,
        tags: metadata.tags,
        category: metadata.category,
        summary: metadata.summary,
        metadata_refreshed_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    if (error) {
      return { success: false, error: `Failed to save metadata: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Skip a source (mark as processed without updating metadata)
 */
export async function skipSourceAction(sourceId: number): Promise<SaveMetadataResult> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('source_content_ingested')
      .update({
        metadata_refreshed_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    if (error) {
      return { success: false, error: `Failed to skip source: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Delete a source content item
 */
export async function deleteSourceAction(sourceId: number): Promise<SaveMetadataResult> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from('source_content_ingested').delete().eq('id', sourceId);

    if (error) {
      return { success: false, error: `Failed to delete source: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

