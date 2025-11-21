import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for API routes with user session validation.
 * This uses the anon key with session cookies, respecting RLS policies.
 *
 * @returns {Promise<{ supabase: SupabaseClient; userId: string | null }>}
 */
export async function createApiClient(): Promise<{
  supabase: SupabaseClient;
  userId: string | null;
}> {
  const cookieStore = await cookies();

  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions): void {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions): void {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Get the current user ID from the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    userId: user?.id || null,
  };
}
