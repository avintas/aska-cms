'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates and returns a Supabase client for use in Client Components.
 *
 * This client is safe to use in the browser.
 *
 * @returns {SupabaseClient} The Supabase client instance.
 */
export function createClient() {
  // Uses NEXT_PUBLIC keys which are safe to expose in the browser.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

