'use server';

import { resolveGeneratorContext } from '@/lib/generator/context';
import type { GeneratorTrackKey } from '@/lib/generator/types';
import { createServerClient } from '@/utils/supabase/server';

export interface GenerateContentRequest {
  trackKey: GeneratorTrackKey;
  sourceId: number;
  temperature?: number;
  additionalInstructions?: string;
}

export interface GenerateContentResult {
  success: boolean;
  message: string;
  itemCount?: number;
  errorType?: 'technical' | 'structural' | 'logical';
  sample?: unknown;
  rawCount?: number;
  normalizedCount?: number;
}

/**
 * Helper function to get expected fields for a track (for debugging)
 */
function getExpectedFieldsForTrack(trackKey: string): string[] {
  const fieldMap: Record<string, string[]> = {
    wisdom: ['title', 'musing', 'from_the_box'],
    greetings: ['greeting_text'],
    motivational: ['quote'],
    facts: ['fact_text'],
    trivia_multiple_choice: ['question_text', 'correct_answer', 'wrong_answers'],
    trivia_true_false: ['question_text', 'correct_answer'],
    trivia_who_am_i: ['question_text', 'correct_answer'],
  };
  return fieldMap[trackKey] || [];
}

export interface BatchProcessResult {
  success: boolean;
  processed: number;
  failed: number;
  totalRequested: number;
  results: Array<{
    sourceId: number;
    success: boolean;
    message: string;
    itemCount?: number;
  }>;
  message: string;
}

export interface UnprocessedSourcesCount {
  available: number;
  total: number;
}

/**
 * Get count of unprocessed sources available for multiple-choice trivia generation
 */
export async function getUnprocessedSourcesCount(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for multiple-choice
  const { data: processedSources } = await supabase
    .from('trivia_multiple_choice')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('multiple-choice')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Get count of unprocessed sources available for motivational messages generation
 */
export async function getUnprocessedSourcesCountForMotivational(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for motivational
  const { data: processedSources } = await supabase
    .from('collection_motivational')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('motivational')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Find next unprocessed source for a given track
 * Uses a more efficient query to find sources not yet processed for multiple-choice
 */
async function findNextUnprocessedSource(trackKey: GeneratorTrackKey): Promise<number | null> {
  const supabase = await createServerClient();

  // Get sources that have been used for this track
  const usageKey = trackKey === 'trivia_multiple_choice' ? 'multiple-choice' : null;
  if (!usageKey) {
    // For now, only support multiple-choice
    return null;
  }

  // Query trivia_multiple_choice to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('trivia_multiple_choice')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes(usageKey)) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Find next unprocessed source for motivational messages
 */
async function findNextUnprocessedSourceForMotivational(): Promise<number | null> {
  const supabase = await createServerClient();

  // Query collection_motivational to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('collection_motivational')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('motivational')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Update used_for tracking for a source
 */
async function updateSourceUsage(sourceId: number, usageKey: string): Promise<void> {
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

/**
 * Sleep helper for cooldown
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch process multiple sources sequentially for multiple-choice trivia generation
 */
export async function batchGenerateMultipleChoiceAction(
  count: number,
): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSource('trivia_multiple_choice');

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'trivia_multiple_choice',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'multiple-choice');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

/**
 * Batch process multiple sources sequentially for motivational messages generation
 */
export async function batchGenerateMotivationalAction(count: number): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceForMotivational();

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'motivational',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'motivational');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

/**
 * Get count of unprocessed sources available for true/false trivia generation
 */
export async function getUnprocessedSourcesCountForTrueFalse(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for true/false
  const { data: processedSources } = await supabase
    .from('trivia_true_false')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('true-false')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Find next unprocessed source for true/false trivia
 */
async function findNextUnprocessedSourceForTrueFalse(): Promise<number | null> {
  const supabase = await createServerClient();

  // Query trivia_true_false to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('trivia_true_false')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('true-false')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Batch process multiple sources sequentially for true/false trivia generation
 */
export async function batchGenerateTrueFalseAction(count: number): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceForTrueFalse();

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'trivia_true_false',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'true-false');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

/**
 * Get count of unprocessed sources available for wisdom messages generation
 */
export async function getUnprocessedSourcesCountForWisdom(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for wisdom
  const { data: processedSources } = await supabase
    .from('collection_wisdom')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('wisdom')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Find next unprocessed source for wisdom messages
 */
async function findNextUnprocessedSourceForWisdom(): Promise<number | null> {
  const supabase = await createServerClient();

  // Query collection_wisdom to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('collection_wisdom')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('wisdom')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Batch process multiple sources sequentially for wisdom messages generation
 */
export async function batchGenerateWisdomAction(count: number): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceForWisdom();

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'wisdom',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'wisdom');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

/**
 * Get count of unprocessed sources available for facts generation
 */
export async function getUnprocessedSourcesCountForFacts(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for facts
  const { data: processedSources } = await supabase
    .from('collection_facts')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('fact')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Find next unprocessed source for facts
 */
async function findNextUnprocessedSourceForFacts(): Promise<number | null> {
  const supabase = await createServerClient();

  // Query collection_facts to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('collection_facts')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('fact')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Batch process multiple sources sequentially for facts generation
 */
export async function batchGenerateFactsAction(count: number): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceForFacts();

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'facts',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'fact');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

/**
 * Get count of unprocessed sources available for greetings generation
 */
export async function getUnprocessedSourcesCountForGreetings(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for greetings
  const { data: processedSources } = await supabase
    .from('collection_greetings')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('greeting')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Find next unprocessed source for greetings
 */
async function findNextUnprocessedSourceForGreetings(): Promise<number | null> {
  const supabase = await createServerClient();

  // Query collection_greetings to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('collection_greetings')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('greeting')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Batch process multiple sources sequentially for greetings generation
 */
export async function batchGenerateGreetingsAction(count: number): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceForGreetings();

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'greetings',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'greeting');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

/**
 * Get count of unprocessed sources available for Who Am I trivia generation
 */
export async function getUnprocessedSourcesCountForWhoAmI(): Promise<UnprocessedSourcesCount> {
  const supabase = await createServerClient();

  // Get total active sources
  const { count: totalCount } = await supabase
    .from('source_content_ingested')
    .select('*', { count: 'exact', head: true })
    .eq('content_status', 'active');

  // Get sources that have been processed for Who Am I
  const { data: processedSources } = await supabase
    .from('trivia_who_am_i')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Count sources that are active and not processed
  // We'll query and count manually since we need to check used_for array
  const { data: sources } = await supabase
    .from('source_content_ingested')
    .select('id, used_for, content_status')
    .eq('content_status', 'active');

  let availableCount = 0;
  if (sources) {
    for (const source of sources) {
      // Skip if already in processed list
      if (processedSourceIds.has(source.id)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('who-am-i')) {
        continue;
      }

      // This source is available
      availableCount++;
    }
  }

  return {
    available: availableCount,
    total: totalCount ?? 0,
  };
}

/**
 * Find next unprocessed source for Who Am I trivia
 */
async function findNextUnprocessedSourceForWhoAmI(): Promise<number | null> {
  const supabase = await createServerClient();

  // Query trivia_who_am_i to find which sources have been processed
  const { data: processedSources } = await supabase
    .from('trivia_who_am_i')
    .select('source_content_id')
    .not('source_content_id', 'is', null);

  const processedSourceIds = new Set<number>();
  if (processedSources) {
    for (const row of processedSources) {
      const sourceId = (row as { source_content_id?: number | null }).source_content_id;
      if (typeof sourceId === 'number' && Number.isFinite(sourceId)) {
        processedSourceIds.add(sourceId);
      }
    }
  }

  // Find sources that are active and not processed
  // Query in batches and check each one
  const batchSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: sources, error } = await supabase
      .from('source_content_ingested')
      .select('id, used_for, content_status')
      .eq('content_status', 'active')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error || !sources || sources.length === 0) {
      // No more sources
      return null;
    }

    // Filter out sources that have been processed
    for (const source of sources) {
      const sourceId = source.id;

      // Skip if already in processed list
      if (processedSourceIds.has(sourceId)) {
        continue;
      }

      // Check used_for array
      const usedFor = Array.isArray(source.used_for)
        ? source.used_for.map((v) => String(v).toLowerCase())
        : [];

      if (usedFor.includes('who-am-i')) {
        continue;
      }

      // Found unprocessed source
      return sourceId;
    }

    // Move to next batch
    offset += batchSize;
  }
}

/**
 * Batch process multiple sources sequentially for Who Am I trivia generation
 */
export async function batchGenerateWhoAmIAction(count: number): Promise<BatchProcessResult> {
  const results: BatchProcessResult['results'] = [];
  let processed = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (let i = 0; i < count; i++) {
    // Find next unprocessed source
    const sourceId = await findNextUnprocessedSourceForWhoAmI();

    if (!sourceId) {
      // No more unprocessed sources available
      stoppedEarly = true;
      break;
    }

    // Process this source
    const result = await generateContentAction({
      trackKey: 'trivia_who_am_i',
      sourceId,
    });

    if (result.success) {
      processed++;
      // Update used_for tracking
      await updateSourceUsage(sourceId, 'who-am-i');
      results.push({
        sourceId,
        success: true,
        message: result.message,
        itemCount: result.itemCount,
      });
    } else {
      failed++;
      results.push({
        sourceId,
        success: false,
        message: result.message,
      });
    }

    // Wait 2 seconds before next source (except after the last one)
    if (i < count - 1) {
      await sleep(2000);
    }
  }

  // Build appropriate message based on outcome
  let message: string;
  if (processed === count && failed === 0) {
    message = `Successfully processed all ${processed} requested source(s).`;
  } else if (stoppedEarly) {
    const requested = count;
    const available = processed + failed;
    if (failed === 0) {
      message = `Processed ${processed} source(s) (all available). Requested ${requested}, but only ${available} unprocessed source(s) were found.`;
    } else {
      message = `Processed ${processed} source(s), ${failed} failed. Requested ${requested}, but only ${available} unprocessed source(s) were available.`;
    }
  } else {
    // Some failed but we had enough sources
    message = `Processed ${processed} source(s), ${failed} failed. ${count - processed - failed} source(s) were skipped due to errors.`;
  }

  return {
    success: failed === 0, // Success if no failures, even if fewer sources were available
    processed,
    failed,
    totalRequested: count,
    results,
    message,
  };
}

export async function generateContentAction(
  request: GenerateContentRequest,
): Promise<GenerateContentResult> {
  try {
    const { trackKey, sourceId, additionalInstructions } = request;

    // Resolve context (track, prompt, source)
    const context = await resolveGeneratorContext({
      track: trackKey,
      sourceId,
    });

    // Check for issues
    if (context.issues.length > 0) {
      return {
        success: false,
        message: context.issues.join(' '),
        errorType: 'structural',
      };
    }

    if (!context.track || !context.prompt || !context.source) {
      return {
        success: false,
        message: 'Missing required context: track, prompt, or source.',
        errorType: 'structural',
      };
    }

    // Build the final prompt
    let finalPrompt = context.prompt.prompt_content;
    if (additionalInstructions && additionalInstructions.trim()) {
      finalPrompt += `\n\nAdditional Instructions:\n${additionalInstructions.trim()}`;
    }

    // Run the generator
    const result = await context.track.adapter.run({
      sourceContent: context.source.contentText,
      customPrompt: finalPrompt,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Generation failed with unknown error.',
        errorType: 'technical',
      };
    }

    const rawItems = result.data ?? [];
    if (rawItems.length === 0) {
      return {
        success: false,
        message: 'Gemini returned no items to persist.',
        errorType: 'structural',
      };
    }

    const normalizedItems: unknown[] = [];
    const skippedItems: string[] = [];
    const failingSamples: unknown[] = [];

    for (const rawItem of rawItems) {
      // Log raw item for debugging
      // eslint-disable-next-line no-console
      console.log('Processing raw item:', JSON.stringify(rawItem, null, 2));

      const normalized = context.track.adapter.normalize(rawItem, context.source?.id ?? null);
      if (!normalized) {
        const errorMsg = 'Normalization failed - required fields missing or invalid';
        skippedItems.push(errorMsg);
        failingSamples.push(rawItem);
        // eslint-disable-next-line no-console
        console.error('Normalization failed for item:', {
          rawItem,
          track: context.track.key,
          expectedFields: getExpectedFieldsForTrack(context.track.key),
        });
        continue;
      }

      if (context.track.adapter.validate) {
        const validation = context.track.adapter.validate(normalized as never);
        if (!validation.valid) {
          const errorMsg = validation.errors.join(', ') || 'Validation failed';
          skippedItems.push(errorMsg);
          failingSamples.push(normalized);
          // eslint-disable-next-line no-console
          console.error('Validation failed for normalized item:', {
            normalizedItem: normalized,
            validationErrors: validation.errors,
            track: context.track.key,
          });
          continue;
        }
      }
      normalizedItems.push(normalized);
    }

    if (normalizedItems.length === 0) {
      // Build detailed error message
      const errorDetails: string[] = [];
      errorDetails.push(
        `All ${rawItems.length} generated item(s) failed validation or normalization.`,
      );

      if (failingSamples.length > 0) {
        const firstFailure = failingSamples[0] as Record<string, unknown>;
        const receivedFields = Object.keys(firstFailure || {}).join(', ');
        const expectedFields = getExpectedFieldsForTrack(context.track.key).join(', ');
        errorDetails.push(`Expected fields: ${expectedFields}`);
        errorDetails.push(`Received fields: ${receivedFields || '(none)'}`);

        // Show sample of what was received
        if (firstFailure) {
          const samplePreview = JSON.stringify(firstFailure, null, 2).substring(0, 500);
          errorDetails.push(
            `Sample item: ${samplePreview}${samplePreview.length >= 500 ? '...' : ''}`,
          );
        }
      }

      return {
        success: false,
        message: errorDetails.join(' | '),
        errorType: 'structural',
        sample: failingSamples[0] ?? rawItems[0],
        rawCount: rawItems.length,
      };
    }

    const supabase = await createServerClient();
    const { error } = await supabase
      .from(context.track.targetTable)
      .insert(normalizedItems as never[]);

    if (error) {
      // Enhanced error logging for debugging
      // eslint-disable-next-line no-console
      console.error('Database insert error:', {
        table: context.track.targetTable,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        sampleItem: normalizedItems[0],
        itemCount: normalizedItems.length,
      });

      return {
        success: false,
        message: `Failed to persist generated content: ${error.message}${error.details ? ` (Details: ${error.details})` : ''}${error.hint ? ` (Hint: ${error.hint})` : ''}`,
        errorType: 'technical',
        sample: normalizedItems[0],
        rawCount: rawItems.length,
        normalizedCount: normalizedItems.length,
      };
    }

    const itemCount = normalizedItems.length;
    let message = `Successfully generated ${itemCount} item(s) for ${context.track.label}.`;
    if (skippedItems.length > 0) {
      message += ` Skipped ${skippedItems.length} item(s) due to: ${skippedItems.join('; ')}.`;
    }

    return {
      success: true,
      message,
      itemCount,
      rawCount: rawItems.length,
      normalizedCount: normalizedItems.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Generation error: ${message}`,
      errorType: 'technical',
    };
  }
}
