import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Privileged Supabase client using `SUPABASE_SERVICE_ROLE_KEY`.
 * Protected by `server-only` so any accidental client-side import fails at build time.
 * Bypasses Row Level Security (RLS) — use strictly inside verified server actions/routes.
 */
export function createAdminSupabaseClient() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();

  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
