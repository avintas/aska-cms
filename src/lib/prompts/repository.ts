import 'server-only';
import { createServerClient } from '@/utils/supabase/server';

export type PromptType =
  | 'metadata_extraction'
  | 'content_enrichment'
  | 'generator_wisdom'
  | 'generator_greetings'
  | 'generator_motivational'
  | 'generator_stats'
  | 'generator_facts'
  | 'generator_trivia_multiple_choice'
  | 'generator_trivia_true_false'
  | 'generator_trivia_who_am_i';

export interface AIExtractionPrompt {
  id: number;
  prompt_name: string;
  prompt_type: PromptType;
  prompt_content: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Fetch the latest active prompt for a given type.
 * Falls back to the most recently updated prompt when multiple are active.
 */
export async function getActivePromptByType(promptType: PromptType): Promise<AIExtractionPrompt | null> {
  const generatorContentTypeMap: Partial<Record<PromptType, string>> = {
    generator_wisdom: 'wisdom',
    generator_greetings: 'greeting',
    generator_motivational: 'motivational',
    generator_stats: 'stat',
    generator_facts: 'fact',
    generator_trivia_multiple_choice: 'multiple-choice',
    generator_trivia_true_false: 'true-false',
    generator_trivia_who_am_i: 'who-am-i',
  };

  // Generator prompts now live in the `prompts` table.
  const generatorContentType = generatorContentTypeMap[promptType];
  const supabase = await createServerClient();

  if (generatorContentType) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('content_type', generatorContentType)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading generator prompt:', {
        promptType,
        generatorContentType,
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return null;
    }

    if (!data || !data.prompt_content) {
      // eslint-disable-next-line no-console
      console.warn('No prompt found or prompt_content is empty:', {
        promptType,
        generatorContentType,
        found: !!data,
        hasContent: !!data?.prompt_content,
      });
      return null;
    }

    const now = new Date().toISOString();

    return {
      id: (data.id as number) ?? 0,
      prompt_name: (data.prompt_name as string) ?? `${generatorContentType} prompt`,
      prompt_type: promptType,
      prompt_content: data.prompt_content as string,
      description: (data.description as string | null) ?? null,
      is_active: true,
      created_at: (data.created_at as string) ?? now,
      updated_at: (data.updated_at as string) ?? now,
      created_by: (data.created_by as string | null) ?? null,
    };
  }

  const { data, error } = await supabase
    .from('ai_extraction_prompts')
    .select(
      'id,prompt_name,prompt_type,prompt_content,description,is_active,created_at,updated_at,created_by',
    )
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading active prompt:', error);
    return null;
  }

  return (data as AIExtractionPrompt) || null;
}

/**
 * List prompts by type (read-only viewer).
 */
export async function listPromptsByType(
  promptType: PromptType,
): Promise<AIExtractionPrompt[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('ai_extraction_prompts')
    .select(
      'id,prompt_name,prompt_type,prompt_content,description,is_active,created_at,updated_at,created_by',
    )
    .eq('prompt_type', promptType)
    .order('updated_at', { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading prompts:', error);
    return [];
  }
  return (data as AIExtractionPrompt[]) || [];
}


