import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getPublicEnv } from "@/lib/env";

export interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Server-side Supabase client (Server Components, Server Actions, Route Handlers).
 * Respects Row Level Security (RLS) via the request's cookie session.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from a Server Component where cookies cannot be mutated directly.
          }
        },
      },
    }
  );
}
