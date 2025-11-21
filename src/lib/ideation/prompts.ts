import 'server-only';

import { getActivePromptByType } from '@/lib/prompts/repository';

export async function getAnalysisPrompt(): Promise<string | null> {
  const prompt = await getActivePromptByType('content_enrichment');
  return prompt?.prompt_content ?? null;
}

export async function getExplorationPrompt(): Promise<string | null> {
  const prompt = await getActivePromptByType('metadata_extraction');
  return prompt?.prompt_content ?? null;
}
