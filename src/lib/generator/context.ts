import 'server-only';

import type { AIExtractionPrompt } from '@/lib/prompts/repository';
import { getActivePromptByType } from '@/lib/prompts/repository';
import { generatorTracks } from './tracks';
import type { GeneratorTrackDefinition, GeneratorTrackKey } from './types';
import { createServerClient } from '@/utils/supabase/server';

interface RawSourceRecord {
  id: number;
  content_text: string | null;
  summary: string | null;
  title: string | null;
  tags: unknown;
  theme: string | null;
  category: string | null;
  ingestion_status: string | null;
  ingestion_process_id: string | null;
  metadata: Record<string, unknown> | null;
  used_for: unknown;
}

export interface GeneratorSourceSummary {
  id: number;
  title: string | null;
  summary: string | null;
  theme: string | null;
  category: string | null;
  tags: string[];
  ingestionStatus: string | null;
  ingestionProcessId: string | null;
  metadata: Record<string, unknown> | null;
  usedFor: string[];
  contentText: string;
}

export interface GeneratorContextParams {
  track?: string | null;
  sourceId?: string | number | null;
}

export interface ResolvedGeneratorContext {
  trackKey: GeneratorTrackKey | null;
  track: GeneratorTrackDefinition<unknown, unknown> | null;
  prompt: AIExtractionPrompt | null;
  source: GeneratorSourceSummary | null;
  issues: string[];
}

export async function resolveGeneratorContext(
  params: GeneratorContextParams,
): Promise<ResolvedGeneratorContext> {
  const issues: string[] = [];

  const trackKey = coerceTrackKey(params.track);
  const track = trackKey ? (generatorTracks[trackKey] as GeneratorTrackDefinition<unknown, unknown>) : null;

  if (params.track && !track) {
    issues.push(`Track "${params.track}" is not recognized.`);
  }

  const prompt = track ? await getActivePromptByType(track.promptType) : null;
  if (track && !prompt) {
    issues.push(`No active prompt configured for ${track.label}.`);
  }

  const sourceId = coerceNumericId(params.sourceId);
  const source = sourceId !== null ? await fetchSource(sourceId, issues) : null;

  return {
    trackKey: track ? track.key : null,
    track,
    prompt,
    source,
    issues,
  };
}

function coerceTrackKey(candidate?: string | null): GeneratorTrackKey | null {
  if (!candidate) {
    return null;
  }
  const normalized = candidate.trim().toLowerCase().replace(/-/g, '_') as GeneratorTrackKey;
  if (normalized in generatorTracks) {
    return normalized;
  }
  return null;
}

function coerceNumericId(value?: string | number | null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

async function fetchSource(id: number, issues: string[]): Promise<GeneratorSourceSummary | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('source_content_ingested')
    .select(
      'id,content_text,summary,title,tags,theme,category,ingestion_status,ingestion_process_id,metadata,used_for',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching source_content_ingested record:', error);
    issues.push('Failed to load selected source content.');
    return null;
  }

  const record = data as RawSourceRecord | null;
  if (!record) {
    issues.push('Selected source content was not found.');
    return null;
  }

  const contentText = typeof record.content_text === 'string' ? record.content_text : '';
  if (!contentText) {
    issues.push('Selected source is missing content_text.');
  }

  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    theme: record.theme,
    category: record.category,
    tags: coerceTags(record.tags),
    ingestionStatus: record.ingestion_status,
    ingestionProcessId: record.ingestion_process_id,
    metadata: record.metadata ?? null,
    usedFor: coerceTags(record.used_for),
    contentText,
  };
}

function coerceTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry) => entry.length > 0);
      }
    } catch {
      // Treat as comma separated fallback
      return trimmed
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
  }
  return [];
}


