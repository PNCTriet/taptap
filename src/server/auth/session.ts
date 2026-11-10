import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabasePublicEnvConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Authorization reads only `app_metadata` (never user_metadata). */
export function isPlatformAdminUser(user: Pick<User, "app_metadata"> | null | undefined) {
  return user?.app_metadata?.platform_role === "platform_admin";
}

export interface SessionInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any> | null;
  user: User | null;
  isPlatformAdmin: boolean;
}

export async function getSession(): Promise<SessionInfo> {
  if (!isSupabasePublicEnvConfigured()) {
    return { supabase: null, user: null, isPlatformAdmin: false };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient<any>;
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null, isPlatformAdmin: isPlatformAdminUser(data.user) };
}
