"use client";

import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "@/lib/supabase/client";

/** Untyped browser client for the Phase 1 tables (RLS applies). */
export function useSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMemo(() => createClientSupabaseClient() as unknown as SupabaseClient<any>, []);
}
