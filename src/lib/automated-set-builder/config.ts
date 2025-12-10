/**
 * Configuration Management for Automated Set Builder
 * Handles reading and updating automated_set_builder_config table
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';
import type {
  AutomatedSetBuilderConfig,
  AutomatedSetBuilderConfigUpdateInput,
} from '@/shared/types/automated-set-builder';

/**
 * Get the current automated builder configuration
 * Returns default config if none exists
 */
export async function getAutomatedBuilderConfig(): Promise<AutomatedSetBuilderConfig | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('automated_set_builder_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching automated builder config:', error);
    return null;
  }

  return data as AutomatedSetBuilderConfig;
}

/**
 * Update the automated builder configuration
 */
export async function updateAutomatedBuilderConfig(
  updates: AutomatedSetBuilderConfigUpdateInput,
): Promise<{ success: boolean; data?: AutomatedSetBuilderConfig; error?: string }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('automated_set_builder_config')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    console.error('Error updating automated builder config:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data: data as AutomatedSetBuilderConfig,
  };
}

/**
 * Update last run information
 */
export async function updateLastRunInfo(
  status: 'success' | 'partial' | 'failed',
  message?: string | null,
): Promise<{ success: boolean; error?: string }> {
  return updateAutomatedBuilderConfig({
    last_run_at: new Date().toISOString(),
    last_run_status: status,
    last_run_message: message || null,
  }).then((result) => ({
    success: result.success,
    error: result.error,
  }));
}

